import { test, expect } from '@playwright/test';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Argon2idPasswordHasher } from '../../src/modules/identity/security/argon2-password-hasher.js';

const url = process.env.QC_TEST_DATABASE_URL;
if (url && (new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/qc_adp26_07'))
  throw new Error('Dedicated loopback QC-ADP26-07 database required.');
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
test('P-04 real page, responsive copy, direct denial and signed closure', async ({ browser }) => {
  test.skip(!url, 'Dedicated isolated PostgreSQL fixture required.');
  const pool = new Pool({ connectionString: url });
  const actor = randomUUID();
  const id = randomUUID();
  const secret = randomBytes(24).toString('base64url');
  const token = randomBytes(32).toString('base64url');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4327', storageState: {
    cookies: [{ name: '__Host-qc_session', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, secure: true, sameSite: 'Strict', expires: -1 }], origins: [],
  } });
  try {
    const hash = await new Argon2idPasswordHasher().hash(secret);
    await pool.query('INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,$3,$4)', [actor, `adp07-browser-${actor}`, 'Synthetic supervisor', hash]);
    await pool.query("INSERT INTO qc.user_roles(user_id,role_id,assigned_by) SELECT $1,id,$1 FROM qc.roles WHERE code='SUPERVISOR'", [actor]);
    for (const code of ['PERM-CAPA-VIEW', 'PERM-NCR-VIEW', 'PERM-CAPA-CLOSE', 'PERM-EQUIPMENT-VIEW', 'PERM-CALIBRATION-VIEW', 'PERM-MAINTENANCE-VIEW']) {
      await pool.query("INSERT INTO qc.permissions(code,domain,action,risk_level) VALUES($1,'quality','VIEW','MEDIUM') ON CONFLICT(code) DO NOTHING", [code]);
      await pool.query("INSERT INTO qc.role_permissions(role_id,permission_id) SELECT r.id,p.id FROM qc.roles r,qc.permissions p WHERE r.code='SUPERVISOR' AND p.code=$1 ON CONFLICT DO NOTHING", [code]);
    }
    await pool.query("INSERT INTO qc.user_scopes(user_id,scope_kind,assigned_by) VALUES($1,'GLOBAL',$1)", [actor]);
    await pool.query("INSERT INTO qc.sessions(id,user_id,session_token_hash,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')", [randomUUID(), actor, createHash('sha256').update(token).digest('hex')]);
    await pool.query("INSERT INTO qc.capas(id,capa_no,state,title,description,owner_id,created_by,verification_required,effectiveness_required) VALUES($1,$3,'IN_PROGRESS','Synthetic controlled decision','Synthetic fixture',$2,$2,true,true)", [id, actor, `ADP07-${id.slice(0,8)}`]);
    await pool.query("INSERT INTO qc.capa_actions(capa_id,sequence_no,description,owner_id,state) VALUES($1,1,'Incomplete action',$2,'OPEN')", [id, actor]);
    const snapshot = async () => {
      const record = (await pool.query('SELECT state,version FROM qc.capas WHERE id=$1', [id])).rows;
      const audit = (await pool.query('SELECT id FROM qc.audit_events WHERE subject_id=$1 ORDER BY id', [id])).rows;
      const outbox = (await pool.query('SELECT id FROM qc.outbox_events ORDER BY id')).rows;
      return { record, audit, outbox };
    };
    const page = await context.newPage();
    const widths: number[] = [];
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/quality/capa/${id}`);
      await expect(page.getByRole('heading', { name: 'CAPA detail', exact: true })).toBeVisible();
      await expect(page.getByText(/P-04 allows this exception only/)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      widths.push(width);
    }
    const before = await snapshot();
    const send = (reason: string, reauthenticationSecret: string) => page.evaluate(async (input) => {
      const response = await fetch('/_actions/capa.close', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      return { status: response.status, body: await response.text() };
    }, { id, expectedVersion: '1', reason, reauthenticationSecret, requestId: randomUUID() });
    const rejected = await send('Synthetic exception', 'invalid-synthetic-input');
    expect(rejected.status).toBeGreaterThanOrEqual(400);
    expect(await snapshot()).toEqual(before);
    const accepted = await send('Synthetic exception', secret);
    expect(accepted.status).toBe(200);
    const after = await snapshot();
    expect(after.record[0].state).toBe('CLOSED');
    expect(after.audit.length).toBe(before.audit.length + 1);
    expect(after.outbox).toEqual(before.outbox);
    await page.goto('/quality/capa');
    await expect(page.getByText(/Approved P-04 exception:/)).toBeVisible();
    await page.goto('/quality/capa/new');
    await expect(page.getByText(/P-04/)).toBeVisible();
    const equipment = randomUUID();
    const calibration = randomUUID();
    await pool.query("INSERT INTO qc.equipment(id,equipment_no,name,state,created_by) VALUES($1,$2,'Synthetic expired instrument','ACTIVE',$3)", [equipment, `ADP07-EQ-${equipment.slice(0,8)}`, actor]);
    await pool.query("INSERT INTO qc.calibration_records(id,calibration_no,equipment_id,state,calibration_date,due_date,created_by) VALUES($1,$2,$3,'CURRENT',current_date-2,current_date-1,$4)", [calibration, `ADP07-CAL-${calibration.slice(0,8)}`, equipment, actor]);
    await pool.query('UPDATE qc.equipment SET current_calibration_id=$1 WHERE id=$2', [calibration, equipment]);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/assets/calibrations/${calibration}`);
      await expect(page.getByText('Not eligible for laboratory or inspection use.', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    mkdirSync('.ci-results', { recursive: true });
    writeFileSync('.ci-results/QC-ADP26-07-browser.json', JSON.stringify({ widths, fixture: id, role: 'SUPERVISOR', state: 'IN_PROGRESS', rejectedStatus: rejected.status, acceptedStatus: accepted.status, before, after, AT: 'NOT VERIFIED', UAT: 'NOT VERIFIED' }, null, 2));
  } finally { await context.close(); await pool.end(); }
});
