import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { CreateNcrUseCase } from '../../../src/modules/quality/ncr/application/create-ncr.js';
import { PostgresNcrRepository } from '../../../src/modules/quality/ncr/infrastructure/postgres-repository.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const url = process.env.QC_TEST_DATABASE_URL;
if (url && (!['localhost', '127.0.0.1'].includes(new URL(url).hostname) || new URL(url).pathname !== '/qc_test'))
  throw new Error('CA-F-01 requires the disposable loopback qc_test database.');
const pool = new Pool({ connectionString: url, options: '-c search_path=qc,pg_catalog' });
const db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
const actor: ActorContext = { id: randomUUID(), accountState: 'ACTIVE', roles: ['EMPLOYEE'],
  permissions: [{ code: 'PERM-NCR-CREATE', scopes: ['OWN'] }] };
const other = randomUUID();
const repo = new PostgresNcrRepository(db);
const usecase = new CreateNcrUseCase(repo);
const finding = async (state = 'DRAFT', creator = actor.id) => {
  const id = randomUUID();
  await pool.query(`INSERT INTO qc.findings(id,finding_no,title,description,state,created_by) VALUES($1,$2,'Finding fixture','Observed deviation',$3,$4)`, [id, id, state, creator]);
  return id;
};
const input = (findingId: string) => ({ actor, findingId, intentId: randomUUID(), requestId: randomUUID(),
  ncrNo: randomUUID(), title: 'Recorded deviation', description: 'Observed departure', affectedItemCode: 'User reference', affectedLot: 'Free lot' });
const snapshot = async () => {
  const result: unknown[] = [];
  for (const table of ['ncrs', 'audit_events', 'idempotency_records'])
    result.push((await pool.query(`SELECT * FROM qc.${table} ORDER BY id`)).rows);
  return result;
};
beforeAll(async () => {
  if (!url) return;
  await migrate({ pool });
  for (const id of [actor.id, other]) await pool.query(`INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,'CA-F-01 fixture','test-only')`, [id, id]);
});
afterAll(async () => { await db.destroy(); });

describe.skipIf(!url)('CA-F-01 atomic NCR creation on PostgreSQL', () => {
  it.each(['DRAFT', 'OPEN', 'UNDER_REVIEW', 'CLOSED', 'VOID'])('allows %s Finding, manual number and absent owner', async state => {
    const command = input(await finding(state));
    const ncr = await usecase.execute(command);
    expect(ncr).toMatchObject({ state: 'DRAFT', findingId: command.findingId, ncrNo: command.ncrNo, createdBy: actor.id, version: 1n, affectedItemCode: 'User reference', affectedLot: 'Free lot' });
    expect(ncr.ownerId).toBeUndefined();
    expect(ncr.createdAt).toBeInstanceOf(Date);
    const audit = (await pool.query('SELECT * FROM qc.audit_events WHERE subject_id=$1', [ncr.id])).rows;
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ actor_id: actor.id, action: 'CREATE', new_state: 'DRAFT', request_id: command.requestId, signature_id: null });
    expect((await pool.query('SELECT state FROM qc.findings WHERE id=$1', [command.findingId])).rows[0].state).toBe(state);
  });
  it('allows multiple NCRs for one Finding and matches concurrent/repeated intent despite a new trace', async () => {
    const command = input(await finding());
    const results = await Promise.all([usecase.execute(command), usecase.execute({ ...command, requestId: randomUUID() })]);
    expect(results[0].id).toBe(results[1].id);
    const before = await snapshot();
    expect((await usecase.execute({ ...command, requestId: randomUUID() })).id).toBe(results[0].id);
    expect(await snapshot()).toEqual(before);
    await expect(usecase.execute({ ...command, title: 'Changed intent' })).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });
    expect(await snapshot()).toEqual(before);
    const second = await usecase.execute(input(command.findingId));
    expect(second.id).not.toBe(results[0].id);
  });
  it('denies missing/out-of-scope sources, permission and inactive actors with no writes', async () => {
    const valid = input(await finding());
    const hidden = await finding('OPEN', other);
    const before = await snapshot();
    for (const command of [
      { ...valid, findingId: randomUUID() }, { ...valid, findingId: hidden },
      { ...valid, actor: { ...actor, permissions: [] } },
      { ...valid, actor: { ...actor, accountState: 'INACTIVE' as const } },
    ]) {
      await expect(async () => usecase.execute(command)).rejects.toThrow();
      expect(await snapshot()).toEqual(before);
    }
  });
  it('rejects tampered owner/server fields and blank data without writes', async () => {
    const command = input(await finding());
    const before = await snapshot();
    for (const extra of [{ ownerId: actor.id }, { createdBy: other }, { state: 'OPEN' }, { title: '  ' }, { ncrNo: '' }]) {
      await expect(async () => usecase.execute({ ...command, ...extra })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(await snapshot()).toEqual(before);
    }
  });
  it('rejects a duplicate NCR number as a field validation error and rolls back the receipt', async () => {
    const command = input(await finding());
    await usecase.execute(command);
    const before = await snapshot();
    await expect(usecase.execute({ ...command, intentId: randomUUID() })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: { ncrNo: ['This NCR number is already in use.'] },
    });
    expect(await snapshot()).toEqual(before);
  });
  it('rolls back NCR/relation/receipt when CREATE audit fails, then permits retry', async () => {
    const command = input(await finding());
    const before = await snapshot();
    await pool.query(`CREATE FUNCTION qc.caf01_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.actor_id='${actor.id}'::uuid AND NEW.subject_type='NCR' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER caf01_fail_audit BEFORE INSERT ON qc.audit_events FOR EACH ROW EXECUTE FUNCTION qc.caf01_fail_audit()`);
    try {
      await expect(usecase.execute(command)).rejects.toThrow();
      expect(await snapshot()).toEqual(before);
    } finally {
      await pool.query('DROP TRIGGER caf01_fail_audit ON qc.audit_events; DROP FUNCTION qc.caf01_fail_audit()');
    }
    expect((await usecase.execute(command)).state).toBe('DRAFT');
  });
  it('rereads source authorization after waiting on its transaction lock', async () => {
    const command = input(await finding());
    const client = await pool.connect();
    await client.query('BEGIN');
    await client.query('UPDATE qc.findings SET created_by=$1 WHERE id=$2', [other, command.findingId]);
    const before = await snapshot();
    const pending = usecase.execute(command);
    // Wait until the actual source SELECT is blocked, not a timing assertion.
    for (let attempt = 0; attempt < 100; attempt++) {
      const waiting = await pool.query(`SELECT 1 FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%findings%for update%'`);
      if (waiting.rowCount) break;
      await new Promise(resolve => setTimeout(resolve, 10));
      if (attempt === 99) throw new Error('Source lock was not observed');
    }
    await client.query('COMMIT'); client.release();
    await expect(pending).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    expect(await snapshot()).toEqual(before);
  });
});
