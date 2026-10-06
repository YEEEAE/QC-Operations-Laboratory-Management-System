import { test, expect } from '@playwright/test';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import { createPool } from '../../src/shared/database/pool.js';
import { Kysely, PostgresDialect } from 'kysely';
import { migrate } from '../../scripts/db/migrate.js';
import { seedFoundationData, APPROVED_PERMISSION_CODES } from '../../db/seeds/common.js';
import type { DatabaseSchema } from '../../src/shared/database/db-types.js';
import type { ActorContext } from '../../src/shared/authorization/types.js';
import { ImportControlledInspectionSourcesUseCase } from '../../src/modules/quarantine/catalog/application/import-controlled-sources.js';
import {
  ManageItemTemplateMappingUseCase,
  PostgresItemMappingReader,
  ResolveInspectionTemplateUseCase,
} from '../../src/modules/quarantine/inspection/application/resolve-inspection-template.js';
import { PostgresInspectionRepository } from '../../src/modules/quarantine/inspection/infrastructure/postgres-repository.js';
import { PostgresReceivingRepository } from '../../src/modules/quarantine/receiving/infrastructure/postgres-repository.js';
import { PostgresTemplateRepository } from '../../src/modules/quarantine/templates/infrastructure/postgres-repository.js';
import { CreateInspectionFromReceivingUseCase } from '../../src/modules/quarantine/receiving/application/create-inspection-from-receiving.js';

const url = process.env.QC_CATALOG_E2E_DATABASE_URL;
if (
  url &&
  (!['localhost', '127.0.0.1'].includes(new URL(url).hostname) ||
    new URL(url).pathname !== '/qc_disposable')
)
  throw new Error('Controlled catalog E2E requires the dedicated loopback disposable database.');
// Synthetic authenticated sessions contain credentials: never retain traces or video.
test.use({ trace: 'off', video: 'off', screenshot: 'off' });
test('controlled source, no-JS repeatable rows, precise persistence and hostile direct request', async ({
  browser,
}) => {
  test.skip(!url, 'Explicit disposable catalog fixture is required.');
  const pool = createPool({ connectionString: url });
  const db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  const id = randomUUID();
  const actor: ActorContext = {
    id,
    accountState: 'ACTIVE',
    roles: ['SUPERVISOR'],
    permissions: APPROVED_PERMISSION_CODES.map((code) => ({ code, scopes: ['GLOBAL'] })),
  };
  const token = randomBytes(32).toString('base64url');
  const sessionId = randomUUID();
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: 'http://127.0.0.1:4321',
    storageState: {
      cookies: [
        {
          name: '__Host-qc_session',
          value: token,
          domain: '127.0.0.1',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
          expires: -1,
        },
      ],
      origins: [],
    },
  });
  try {
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    await seedFoundationData(pool);
    await pool.query(
      'INSERT INTO qc.users(id,login_identity,display_name,password_hash) VALUES($1,$2,$3,$4)',
      [id, `catalog-browser-${id}`, 'Synthetic catalog inspector', 'test-only-unusable-password'],
    );
    await pool.query(
      "INSERT INTO qc.user_roles(user_id,role_id,assigned_by) SELECT $1,id,$1 FROM qc.roles WHERE code='SUPERVISOR'",
      [id],
    );
    await pool.query(
      "INSERT INTO qc.user_scopes(user_id,scope_kind,assigned_by) VALUES($1,'GLOBAL',$1)",
      [id],
    );
    await pool.query(
      "INSERT INTO qc.sessions(id,user_id,session_token_hash,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",
      [sessionId, id, createHash('sha256').update(token).digest('hex')],
    );
    await new ImportControlledInspectionSourcesUseCase(db).execute({
      actor,
      requestId: randomUUID(),
    });
    const version = (
      await pool.query(
        "SELECT v.id,v.template_id FROM qc.inspection_template_versions v JOIN qc.inspection_templates t ON t.id=v.template_id WHERE t.template_code='F-823-T76' AND v.report_revision='1'",
      )
    ).rows[0];
    // Technical fixture only; this SQL is not QC approval, signature or human UAT evidence.
    await pool.query(
      "UPDATE qc.inspection_template_versions SET state='APPROVED',approved_at=now(),effective_at=now(),approved_by=$2 WHERE id=$1",
      [version.id, id],
    );
    const itemCode = `BROWSER-${id}`;
    await new ManageItemTemplateMappingUseCase(db).create({
      actor,
      itemCode,
      templateId: version.template_id,
      effectiveFrom: '2026-01-01',
      requestId: randomUUID(),
    });
    const receivingId = randomUUID();
    await pool.query(
      "INSERT INTO qc.receiving_items(id,receiving_no,doc_no,item_code,description,lot,qty,receiving_date,workflow_state,created_by,supplier_name,purchase_order_no) VALUES($1,$4,'SYNTHETIC-DOC',$2,'Synthetic component','ORIGINAL-LOT',1200,current_date,'READY_FOR_INSPECTION',$3,'Synthetic supplier','ORIGINAL-PO')",
      [receivingId, itemCode, id, receivingId],
    );
    const origin = new CreateInspectionFromReceivingUseCase({
      receiving: new PostgresReceivingRepository(db),
      inspection: new PostgresInspectionRepository(db),
      template: new PostgresTemplateRepository(db),
      mapping: new ResolveInspectionTemplateUseCase(new PostgresItemMappingReader(db)),
    });
    const inspection = await origin.execute({
      actor,
      receivingId,
      templateVersionId: version.id,
      inspectionNo: `BROWSER-${randomUUID()}`,
      requestId: randomUUID(),
    });
    const page = await context.newPage();
    await page.goto('/quarantine/admin?search=F-823-T76');
    await expect(
      page.getByText('Inspection & Test Report for Blood Line Parts', { exact: true }).first(),
    ).toBeVisible();
    await page.goto(`/quarantine/inspections/${inspection.id}/execute`);
    await expect(page.getByText('ORIGINAL-PO', { exact: true })).toBeVisible();
    await expect(page.locator('[name="header:po"]')).toHaveCount(0);
    await page.locator('[name="row:components:0:description"]').fill('Synthetic component A');
    await page.locator('[name="row:components:0:lot"]').fill('SYNTHETIC-LOT-A');
    await page.locator('[name="row:components:0:quantity"]').fill('12.3400');
    await page.getByRole('button', { name: 'Add row to Component lines', exact: true }).click();
    await expect(page.locator('[name="row:components:1:description"]')).toBeVisible();
    await expect(page.locator('[name="row:components:0:quantity"]')).toHaveValue('12.3400');
    await page.locator('[name="row:components:1:description"]').fill('Synthetic component B');
    await page.locator('[name="row:components:1:quantity"]').fill('0.000100');
    await page.getByRole('button', { name: 'Save digital form', exact: true }).click();
    await expect(page.locator('[name="row:components:0:quantity"]')).toHaveValue('12.3400');
    await expect(page.locator('[name="row:components:1:quantity"]')).toHaveValue('0.000100');
    const before = (
      await pool.query('SELECT version,form_values FROM qc.inspection_reports WHERE id=$1', [
        inspection.id,
      ])
    ).rows[0];
    expect(before.form_values.points.components.rows).toHaveLength(2);
    const response = await context.request.post(
      '/_actions/quarantine.saveControlledInspectionForm',
      {
        headers: { Origin: 'http://127.0.0.1:4321' },
        data: {
          id: inspection.id,
          expectedVersion: before.version,
          values: { headers: { supplier: 'FORGED' }, points: {} },
        },
      },
    );
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(
      (
        await pool.query('SELECT version,form_values FROM qc.inspection_reports WHERE id=$1', [
          inspection.id,
        ])
      ).rows[0],
    ).toEqual(before);
    await page.getByRole('button', { name: 'Submit saved form for review', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('The controlled action was not applied');
    expect(
      (await pool.query('SELECT state FROM qc.inspection_reports WHERE id=$1', [inspection.id]))
        .rows[0].state,
    ).toBe('DRAFT');
  } finally {
    await pool.query(
      "UPDATE qc.sessions SET revoked_at=now(),revoked_reason='CATALOG_E2E_FINISHED' WHERE id=$1",
      [sessionId],
    );
    await context.close();
    await db.destroy();
  }
});
