import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresCapaRepository } from '../../../src/modules/quality/capa/infrastructure/postgres-repository.js';
import { CloseCapaUseCase } from '../../../src/modules/quality/capa/application/close-capa.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';

const url = process.env.QC_TEST_DATABASE_URL;
if (url && (new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/qc_adp26_07'))
  throw new Error('This suite requires its dedicated QC-ADP26-07 loopback database.');
const pool = new Pool({ connectionString: url, options: '-c search_path=qc,pg_catalog' });
const db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
const actorId = randomUUID();
const otherId = randomUUID();
const actor = (overrides: Partial<ActorContext> = {}): ActorContext => ({
  id: actorId, accountState: 'ACTIVE', roles: ['SUPERVISOR'],
  permissions: [{ code: 'PERM-CAPA-CLOSE', scopes: ['GLOBAL'] }], ...overrides,
});
const repo = new PostgresCapaRepository(db);
const observations: Record<string, unknown> = {};
const snapshot = async (id: string) => {
  const queries = [
    ['row', 'SELECT * FROM qc.capas WHERE id=$1'],
    ['actions', 'SELECT * FROM qc.capa_actions WHERE capa_id=$1 ORDER BY id'],
    ['audit', 'SELECT * FROM qc.audit_events WHERE subject_id=$1 ORDER BY id'],
    ['signatures', 'SELECT * FROM qc.electronic_signatures WHERE subject_id=$1 ORDER BY id'],
    ['snapshots', 'SELECT * FROM qc.capa_close_snapshots WHERE capa_id=$1 ORDER BY id'],
    ['outbox', 'SELECT * FROM qc.outbox_events ORDER BY id'],
    ['idempotency', 'SELECT * FROM qc.idempotency_records WHERE key LIKE $1 ORDER BY key'],
  ] as const;
  const result: Record<string, unknown[]> = {};
  for (const [key, query] of queries)
    result[key] = (await pool.query(query, [key === 'idempotency' ? `CAPA:CLOSE:${id}:%` : id].slice(0, key === 'outbox' ? 0 : 1))).rows;
  return result;
};
const summary = (value: Record<string, unknown[]>) => ({
  sha256: createHash('sha256').update(JSON.stringify(value)).digest('hex'),
  counts: Object.fromEntries(Object.entries(value).map(([key, rows]) => [key, rows.length])),
  record: value.row,
});
const fixture = async (owner = actorId) => {
  const id = randomUUID();
  await pool.query(`INSERT INTO qc.capas(id,capa_no,state,title,description,owner_id,verification_required,effectiveness_required,created_by) VALUES($1,$2,'IN_PROGRESS','Synthetic CAPA','P-04 exception fixture',$3,true,true,$4)`, [id, `ADP07-${id}`, owner, actorId]);
  await pool.query(`INSERT INTO qc.capa_actions(capa_id,sequence_no,description,owner_id,state) VALUES($1,1,'Incomplete synthetic action',$2,'OPEN')`, [id, owner]);
  return id;
};
const close = (id: string, options: Partial<Parameters<CloseCapaUseCase['execute']>[0]> = {}, valid = true) =>
  new CloseCapaUseCase(repo, { verify: async () => valid }).execute({ actor: actor(), id, expectedVersion: 1n, reason: 'Synthetic P-04 exception', reauthenticationSecret: 'synthetic-test-input', requestId: randomUUID(), ...options });

beforeAll(async () => {
  await migrate({ pool });
  observations.version = (await pool.query('SHOW server_version')).rows[0];
  observations.ledger = (await pool.query('SELECT version,name,checksum FROM qc.schema_migrations ORDER BY version')).rows;
  for (const id of [actorId, otherId])
    await pool.query(`INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,'Synthetic ADP07 actor','test-only-placeholder')`, [id, `adp07-${id}`]);
}, 180000);
afterAll(async () => {
  mkdirSync('.ci-results', { recursive: true });
  writeFileSync('.ci-results/QC-ADP26-07-db.json', JSON.stringify(observations, null, 2));
  await db.destroy();
});

describe.skipIf(!url)('P-04 PostgreSQL acceptance (dedicated database required)', () => {
  it('closes with an incomplete action and preserves the exact signed aggregate', async () => {
    const id = await fixture();
    expect((await repo.get(id, actor()))?.actions).toHaveLength(1);
    const before = await snapshot(id);
    const result = await close(id);
    expect(result.state).toBe('CLOSED');
    const after = await snapshot(id);
    expect(after.audit).toHaveLength(1);
    expect(after.signatures).toHaveLength(1);
    expect(after.snapshots).toHaveLength(1);
    expect(after.actions).toEqual(before.actions);
    expect(after.outbox).toEqual(before.outbox);
    observations.positive = { before: summary(before), after: summary(after) };
  });

  it('denies on a readable existing valid record with no row/audit/outbox changes', async () => {
    const id = await fixture();
    expect(await repo.get(id, actor())).toBeTruthy();
    const before = await snapshot(id);
    for (const deniedActor of [actor({ roles: ['MANAGER'] }), actor({ roles: ['ADMIN'] }), actor({ roles: ['SYSTEM_OWNER'], loginIdentity: 'yazeed' }), actor({ permissions: [] }), actor({ accountState: 'INACTIVE' })]) {
      await expect(close(id, { actor: deniedActor })).rejects.toThrow();
      expect(await snapshot(id)).toEqual(before);
    }
    for (const options of [{ expectedVersion: 2n }, { reason: ' ' }, { reauthenticationSecret: '' }]) {
      await expect(close(id, options)).rejects.toThrow();
      expect(await snapshot(id)).toEqual(before);
    }
    await expect(close(id, {}, false)).rejects.toThrow();
    expect(await snapshot(id)).toEqual(before);
    const scoped = await fixture(otherId);
    expect(await repo.get(scoped, actor())).toBeTruthy();
    const scopeBefore = await snapshot(scoped);
    await expect(close(scoped, { actor: actor({ permissions: [{ code: 'PERM-CAPA-CLOSE', scopes: ['OWN'] }] }) })).rejects.toThrow();
    expect(await snapshot(scoped)).toEqual(scopeBefore);
    observations.denial = { before: summary(before), after: summary(await snapshot(id)), scopeBefore: summary(scopeBefore), scopeAfter: summary(await snapshot(scoped)) };
  });

  it('rolls back the close, signature, snapshot and idempotency if audit insertion fails', async () => {
    const id = await fixture();
    const before = await snapshot(id);
    await pool.query(`CREATE FUNCTION qc.adp07_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.subject_id='${id}'::uuid THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER adp07_fail_audit BEFORE INSERT ON qc.audit_events FOR EACH ROW EXECUTE FUNCTION qc.adp07_fail_audit()`);
    try { await expect(close(id)).rejects.toThrow(); expect(await snapshot(id)).toEqual(before); }
    finally { await pool.query('DROP TRIGGER adp07_fail_audit ON qc.audit_events; DROP FUNCTION qc.adp07_fail_audit()'); }
    observations.rollback = { before: summary(before), after: summary(await snapshot(id)) };
  });

  it('commits exactly once for a same-version race and rejects terminal state', async () => {
    const id = await fixture();
    const results = await Promise.allSettled([close(id), close(id)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const after = await snapshot(id);
    expect(after.audit).toHaveLength(1);
    expect(after.signatures).toHaveLength(1);
    await expect(close(id, { expectedVersion: 2n })).rejects.toThrow();
    expect(await snapshot(id)).toEqual(after);
    observations.race = summary(after);
  });

  it('replays the committed repository command without another write', async () => {
    const id = await fixture();
    let command: Parameters<PostgresCapaRepository['close']>[0] | undefined;
    const capturing = Object.create(repo) as PostgresCapaRepository;
    capturing.close = async (input) => { command = input; return repo.close(input); };
    await new CloseCapaUseCase(capturing, { verify: async () => true }).execute({ actor: actor(), id, expectedVersion: 1n, reason: 'Replay fixture', reauthenticationSecret: 'synthetic-test-input', requestId: randomUUID() });
    const before = await snapshot(id);
    expect((await repo.close(command!)).state).toBe('CLOSED');
    expect(await snapshot(id)).toEqual(before);
    observations.replay = { before: summary(before), after: summary(await snapshot(id)) };
  });
});
