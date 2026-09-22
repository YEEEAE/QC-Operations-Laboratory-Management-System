import { createHash } from 'node:crypto';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresLabRepository } from '../../../src/modules/laboratory/infrastructure/postgres-repository.js';
import { PostgresControlledLabSources } from '../../../src/modules/laboratory/infrastructure/postgres-controlled-sources.js';
import { RecordLabRunUseCase } from '../../../src/modules/laboratory/application/record-lab-run.js';
import { RecordRunEquipmentUseCase } from '../../../src/modules/laboratory/application/record-run-equipment.js';
import { SubmitLabTestUseCase } from '../../../src/modules/laboratory/application/submit-lab-test.js';
import { GetEquipmentEligibilityUseCase } from '../../../src/modules/assets/equipment/application/get-equipment-eligibility.js';
import { PostgresEquipmentEligibilityReader } from '../../../src/modules/assets/equipment/infrastructure/eligibility-reader.js';
import { PostgresAuditRepository } from '../../../src/shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { stableJson } from '../../../src/shared/json/stable-stringify.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { LabTest } from '../../../src/modules/laboratory/domain/lab-test.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const OWNER_ID = '01900000-0000-7000-8000-00000000f001';
const TEMPLATE_ID = '01900000-0000-7000-8000-00000000f010';
const TEMPLATE_VERSION_ID = '01900000-0000-7000-8000-00000000f011';
const PH_ID = '01900000-0000-7000-8000-00000000f020';
const ASSAY_ID = '01900000-0000-7000-8000-00000000f021';
const APPEARANCE_ID = '01900000-0000-7000-8000-00000000f022';
const EQUIPMENT_ID = '01900000-0000-7000-8000-00000000f030';
const CALIBRATION_ID = '01900000-0000-7000-8000-00000000f031';

const actor = (): ActorContext => ({
  id: OWNER_ID,
  accountState: 'ACTIVE',
  roles: ['SYSTEM_OWNER'],
  permissions: [
    { code: 'PERM-LAB-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-EDIT-DRAFT', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-ENTER-MEASUREMENT', scopes: ['GLOBAL'] },
    { code: 'PERM-LAB-SUBMIT', scopes: ['GLOBAL'] },
  ],
});

let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await pool
    .query(
      `CREATE SCHEMA IF NOT EXISTS qc;
     CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$ BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql`,
    )
    .catch(() => undefined);
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  await pool.query(
    `INSERT INTO qc.users (id, login_identity, display_name, password_hash) VALUES ($1, 'qcdata003-owner', 'QC Data Owner', 'test-only-placeholder-not-a-secret') ON CONFLICT (id) DO NOTHING`,
    [OWNER_ID],
  );
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

function repository() {
  return new PostgresLabRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );
}

/**
 * A user-scoped external cluster is reused across test files; this suite owns
 * the `qc` schema it just recreated, so each case builds its own approved
 * template version rather than sharing mutable rows.
 */
describe('QC-DATA-003 laboratory runs on PostgreSQL', () => {
  it('records runs, replicates, approved calculations, sample results, equipment evidence and the derived overall result', async () => {
    const stamp = Date.now();
    const testId = '01900000-0000-7000-8000-00000000f100';
    const templateVersionId = TEMPLATE_VERSION_ID;
    const phId = PH_ID;
    const assayId = ASSAY_ID;
    const appearanceId = APPEARANCE_ID;

    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
       VALUES ($1, $2, 'Assay panel', true, $3) ON CONFLICT (id) DO NOTHING`,
      [TEMPLATE_ID, `TPL-DATA003-${stamp}`, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, method_reference, content_hash, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', 'TEST-ONLY-METHOD', 'TEST-ONLY-HASH', $3) ON CONFLICT (id) DO NOTHING`,
      [templateVersionId, TEMPLATE_ID, OWNER_ID],
    );
    // pH carries an approved MEAN calculation rule AND an approved room for the
    // mean, so both the calculation and the acceptance outcome are server-side.
    await pool!.query(
      `INSERT INTO qc.lab_test_template_parameters
         (id, template_version_id, parameter_code, label, data_type, unit, required, position,
          acceptance_rule_type, acceptance_rule_payload, controlled_source_reference,
          calculation_rule_type, calculation_rule_payload)
       VALUES
         ($1, $2, 'ph', 'pH', 'NUMERIC', 'pH', true, 1, 'RANGE_INCLUSIVE',
          '{"lower":"5.0","upper":"6.0"}'::jsonb, 'TEST-ONLY-SOURCE',
          'MEAN', '{"decimals":1,"version":"r1"}'::jsonb),
         ($3, $2, 'assay', 'Assay', 'NUMERIC', '%', true, 2, 'MAX_LIMIT',
          '{"max":"1.0"}'::jsonb, 'TEST-ONLY-SOURCE', null, null),
         ($4, $2, 'appearance', 'Appearance', 'TEXT', null, false, 3, 'ENUM_ALLOWED',
          '{"allowed":["Clear","Cloudy"]}'::jsonb, 'TEST-ONLY-SOURCE', null, null)
       ON CONFLICT (id) DO NOTHING`,
      [phId, templateVersionId, assayId, appearanceId],
    );

    // 1. The approved controlled source resolves the calculation rule with the
    // frozen context — the browser never supplies a rule or a limit.
    const context = await new PostgresControlledLabSources(db).resolve(templateVersionId);
    expect(context.parameters.find((parameter) => parameter.id === phId)?.calculationRule).toEqual({
      ruleType: 'MEAN',
      rulePayload: { decimals: 1, version: 'r1' },
    });
    expect(context.parameters.find((parameter) => parameter.id === phId)?.acceptanceRuleType).toBe(
      'RANGE_INCLUSIVE',
    );

    const repo = repository();
    const test: LabTest = {
      id: testId,
      labTestNo: `LAB-DATA003-${stamp}`,
      state: 'DRAFT',
      scientificResult: null,
      authorId: OWNER_ID,
      createdBy: OWNER_ID,
      version: 1n,
      context,
      samples: [],
      measurements: [],
      batches: [],
      readings: [],
      sampleResults: [],
      derivedResult: null,
      originalTestId: null,
      retestSequence: 0,
      retestReason: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null,
      reviewStartedAt: null,
      approvedAt: null,
      rejectedAt: null,
    };
    await repo.create(test, { actor: actor(), requestId: `req-create-${stamp}`, action: 'CREATE' });

    // 2. Run 1: two samples, replicated readings, one approved calculation.
    const run = new RecordLabRunUseCase(repo, () => new Date('2026-09-21T02:00:00.000Z'));
    const afterRun1 = await run.execute({
      actor: actor(),
      id: testId,
      expectedVersion: 1n,
      run: { batchNo: 'RUN-1', label: 'First extraction' },
      samples: [{ identifier: 'S-1' }, { identifier: 'S-2' }],
      readings: [
        { sampleIdentifier: 'S-1', parameterId: phId, readingIndex: 1, raw: '5.4', unit: 'pH' },
        { sampleIdentifier: 'S-1', parameterId: phId, readingIndex: 2, raw: '5.6', unit: 'pH' },
        { sampleIdentifier: 'S-1', parameterId: assayId, readingIndex: 1, raw: '0.5', unit: '%' },
        {
          sampleIdentifier: 'S-1',
          parameterId: appearanceId,
          readingIndex: 1,
          raw: 'Clear',
          unit: null,
        },
        { sampleIdentifier: 'S-2', parameterId: phId, readingIndex: 1, raw: '5.4', unit: 'pH' },
        { sampleIdentifier: 'S-2', parameterId: assayId, readingIndex: 1, raw: '1.5', unit: '%' },
        {
          sampleIdentifier: 'S-2',
          parameterId: appearanceId,
          readingIndex: 1,
          raw: 'Cloudy',
          unit: null,
        },
      ],
      requestId: `req-run1-${stamp}`,
    });
    expect(afterRun1.batches).toHaveLength(1);
    expect(afterRun1.batches?.[0]?.sequence).toBe(1);
    const batchId = afterRun1.batches![0]!.id;
    const sampleOne = afterRun1.samples.find((sample) => sample.identifier === 'S-1')!;
    const sampleTwo = afterRun1.samples.find((sample) => sample.identifier === 'S-2')!;

    // The MEAN over the two pH replicates is the reported value, and the raw
    // readings themselves are preserved in lab_readings.
    const phMeasurement = afterRun1.measurements.find(
      (measurement) => measurement.parameterId === phId && measurement.sampleId === sampleOne.id,
    );
    expect(phMeasurement?.calculatedValue).toBe('5.5');
    expect(phMeasurement?.calculationRuleReference).toBe('TEST-ONLY-SOURCE');
    expect(phMeasurement?.calculationRuleVersion).toBe('r1');
    expect(phMeasurement?.raw).toBeNull();

    const storedReadings = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.lab_readings WHERE lab_test_id = $1 AND batch_id = $2`,
      [testId, batchId],
    );
    expect(storedReadings.rows[0]?.count).toBe('7');
    const storedCalculated = await pool!.query<{ calculated_value: string }>(
      `SELECT calculated_value FROM qc.lab_measurements WHERE lab_test_id = $1 AND batch_id = $2 AND template_parameter_id = $3 AND sample_id = $4`,
      [testId, batchId, phId, sampleOne.id],
    );
    expect(storedCalculated.rows[0]?.calculated_value).toBe('5.5');

    const results = await pool!.query<{ sample_id: string; result: string }>(
      `SELECT sample_id, result FROM qc.lab_sample_results WHERE lab_test_id = $1 AND batch_id = $2`,
      [testId, batchId],
    );
    const bySample = new Map(results.rows.map((row) => [row.sample_id, row.result]));
    expect(bySample.get(sampleOne.id)).toBe('PASS');
    expect(bySample.get(sampleTwo.id)).toBe('FAIL');

    // 3. Run 2 is a new run with the next sequence; run 1 is untouched.
    const afterRun2 = await run.execute({
      actor: actor(),
      id: testId,
      expectedVersion: afterRun1.version,
      run: { batchNo: 'RUN-2' },
      samples: [{ identifier: 'S-3' }],
      readings: [
        { sampleIdentifier: 'S-3', parameterId: phId, readingIndex: 1, raw: '5.5', unit: 'pH' },
        { sampleIdentifier: 'S-3', parameterId: assayId, readingIndex: 1, raw: '0.4', unit: '%' },
      ],
      requestId: `req-run2-${stamp}`,
    });
    expect(afterRun2.batches?.map((batch) => batch.sequence)).toEqual([1, 2]);
    expect(afterRun2.samples).toHaveLength(3);

    // 4. Re-entering run 1's pH group replaces exactly that group: a third
    // replicate replaces the two stored ones instead of appending to them, and
    // the other groups of the same run are left untouched.
    const afterReentry = await run.execute({
      actor: actor(),
      id: testId,
      expectedVersion: afterRun2.version,
      run: { batchId, batchNo: 'RUN-1' },
      samples: [{ identifier: 'S-1' }, { identifier: 'S-2' }],
      readings: [
        { sampleIdentifier: 'S-1', parameterId: phId, readingIndex: 1, raw: '5.2', unit: 'pH' },
        { sampleIdentifier: 'S-1', parameterId: phId, readingIndex: 2, raw: '5.4', unit: 'pH' },
        { sampleIdentifier: 'S-1', parameterId: phId, readingIndex: 3, raw: '5.5', unit: 'pH' },
      ],
      requestId: `req-reentry-${stamp}`,
    });
    expect(
      afterReentry.readings?.filter(
        (reading) => reading.parameterId === phId && reading.sampleId === sampleOne.id,
      ),
    ).toHaveLength(3);
    expect(
      afterReentry.readings?.filter(
        (reading) => reading.parameterId === phId && reading.sampleId === sampleTwo.id,
      ),
    ).toHaveLength(1);
    expect(
      afterReentry.measurements.find(
        (measurement) => measurement.parameterId === phId && measurement.sampleId === sampleOne.id,
      )?.calculatedValue,
    ).toBe('5.4');
    const reentryReadings = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.lab_readings WHERE lab_test_id = $1 AND batch_id = $2`,
      [testId, batchId],
    );
    // 7 stored readings − 2 replaced pH replicates + 3 new ones.
    expect(reentryReadings.rows[0]?.count).toBe('8');

    // 5. Run-level equipment evidence: verified by the approved Assets policy,
    // snapshots captured at usage time.
    await pool!.query(
      `INSERT INTO qc.equipment (id, equipment_no, name, state, created_by, updated_by)
       VALUES ($1, $2, 'HPLC', 'ACTIVE', $3, $3) ON CONFLICT (id) DO NOTHING`,
      [EQUIPMENT_ID, `EQ-DATA003-${stamp}`, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.calibration_records (id, calibration_no, equipment_id, state, calibration_date, due_date, created_by)
       VALUES ($1, $2, $3, 'CURRENT', CURRENT_DATE, CURRENT_DATE + 365, $4) ON CONFLICT (id) DO NOTHING`,
      [CALIBRATION_ID, `CAL-DATA003-${stamp}`, EQUIPMENT_ID, OWNER_ID],
    );
    await pool!.query(`UPDATE qc.equipment SET current_calibration_id = $1 WHERE id = $2`, [
      CALIBRATION_ID,
      EQUIPMENT_ID,
    ]);

    const eligibility = new GetEquipmentEligibilityUseCase(
      new PostgresEquipmentEligibilityReader(db),
      () => new Date('2026-09-21T02:30:00.000Z'),
    );
    await new RecordRunEquipmentUseCase(
      repo,
      eligibility,
      () => new Date('2026-09-21T02:30:00.000Z'),
    ).execute({
      actor: actor(),
      id: testId,
      expectedVersion: afterReentry.version,
      batchId,
      usage: {
        equipmentId: EQUIPMENT_ID,
        calibrationRecordId: CALIBRATION_ID,
        usedAt: '2026-09-21T02:20:00.000Z',
        usageRole: 'MEASUREMENT',
        equipmentSnapshot: { equipmentId: EQUIPMENT_ID, equipmentNo: `EQ-DATA003-${stamp}` },
        calibrationSnapshot: { calibrationRecordId: CALIBRATION_ID },
      },
      requestId: `req-equipment-${stamp}`,
    });
    const storedUsage = await pool!.query<{ batch_id: string; usage_role: string }>(
      `SELECT batch_id, usage_role FROM qc.lab_equipment_usage WHERE lab_test_id = $1`,
      [testId],
    );
    expect(storedUsage.rows[0]?.batch_id).toBe(batchId);
    expect(storedUsage.rows[0]?.usage_role).toBe('MEASUREMENT');
    // An ineligible usage is denied, not silently stored.
    await expect(
      new RecordRunEquipmentUseCase(repo, eligibility).execute({
        actor: actor(),
        id: testId,
        expectedVersion: (await repo.get(testId, actor()))!.version,
        batchId,
        usage: {
          equipmentId: EQUIPMENT_ID,
          calibrationRecordId: CALIBRATION_ID,
          usedAt: '2026-09-21T02:20:00.000Z',
          usageSnapshot: {},
          equipmentSnapshot: {},
          calibrationSnapshot: {},
        } as never,
        requestId: `req-equipment-bad-${stamp}`,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });

    // 6. Submission freezes the derived overall result as review evidence; the
    // official result still comes only from the approved evaluation source.
    const current = (await repo.get(testId, actor()))!;
    const submitted = await new SubmitLabTestUseCase(
      repo,
      {
        async resolve() {
          throw new Error('not used');
        },
        async listApprovedTemplates() {
          return [];
        },
        async validateExecution() {},
        async evaluate() {
          throw new Error('not used');
        },
      },
      { async verify() {} },
    ).execute({
      actor: actor(),
      id: testId,
      expectedVersion: current.version,
      requestId: `req-submit-${stamp}`,
    });
    expect(submitted.state).toBe('SUBMITTED');
    expect(submitted.scientificResult).toBeNull();
    expect(submitted.derivedResult?.result).toBe('FAIL');
    expect(submitted.derivedResult?.inputsHash).toMatch(/^[0-9a-f]{64}$/);
    const storedDerived = await pool!.query<{
      derived_result: string;
      derived_result_inputs_hash: string;
    }>(`SELECT derived_result, derived_result_inputs_hash FROM qc.lab_tests WHERE id = $1`, [
      testId,
    ]);
    expect(storedDerived.rows[0]?.derived_result).toBe('FAIL');

    // The snapshot recorded at submission still carries the run evidence.
    const snapshot = await pool!.query<{ template_snapshot: { test?: { batches?: unknown[] } } }>(
      `SELECT template_snapshot FROM qc.lab_test_snapshots WHERE lab_test_id = $1 ORDER BY snapshot_version DESC LIMIT 1`,
      [testId],
    );
    expect(snapshot.rows[0]?.template_snapshot?.test?.batches).toHaveLength(2);
  }, 180000);

  it('keeps the raw-value contract: one value per measurement row, batches and readings intact across a state transition', async () => {
    const stamp = Date.now();
    const testId = '01900000-0000-7000-8000-00000000f200';
    const templateVersionId = '01900000-0000-7000-8000-00000000f210';
    const parameterId = '01900000-0000-7000-8000-00000000f220';
    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
       VALUES ('01900000-0000-7000-8000-00000000f211', $1, 'Single parameter panel', true, $2) ON CONFLICT (id) DO NOTHING`,
      [`TPL-DATA003B-${stamp}`, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, method_reference, content_hash, created_by)
       VALUES ($1, '01900000-0000-7000-8000-00000000f211', 'v1', 'APPROVED', 'TEST-ONLY-METHOD', 'TEST-ONLY-HASH', $2) ON CONFLICT (id) DO NOTHING`,
      [templateVersionId, OWNER_ID],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_parameters
         (id, template_version_id, parameter_code, label, data_type, unit, required, position,
          acceptance_rule_type, acceptance_rule_payload, controlled_source_reference)
       VALUES ($1, $2, 'ph', 'pH', 'NUMERIC', 'pH', true, 1, 'RANGE_INCLUSIVE',
               '{"lower":"5.0","upper":"6.0"}'::jsonb, 'TEST-ONLY-SOURCE') ON CONFLICT (id) DO NOTHING`,
      [parameterId, templateVersionId],
    );
    const context = await new PostgresControlledLabSources(db).resolve(templateVersionId);
    const repo = repository();
    await repo.create(
      {
        id: testId,
        labTestNo: `LAB-DATA003B-${stamp}`,
        state: 'DRAFT',
        scientificResult: null,
        authorId: OWNER_ID,
        createdBy: OWNER_ID,
        version: 1n,
        context,
        samples: [],
        measurements: [],
        batches: [],
        readings: [],
        sampleResults: [],
        derivedResult: null,
        originalTestId: null,
        retestSequence: 0,
        retestReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: null,
        reviewStartedAt: null,
        approvedAt: null,
        rejectedAt: null,
      },
      { actor: actor(), requestId: `req-create-b-${stamp}`, action: 'CREATE' },
    );
    const recorded = await new RecordLabRunUseCase(repo).execute({
      actor: actor(),
      id: testId,
      expectedVersion: 1n,
      run: { batchNo: 'RUN-1' },
      samples: [{ identifier: 'S-1' }],
      readings: [{ sampleIdentifier: 'S-1', parameterId, readingIndex: 1, raw: '5.4', unit: 'pH' }],
      requestId: `req-run-b-${stamp}`,
    });
    const batchId = recorded.batches![0]!.id;
    const sampleId = recorded.samples[0]!.id;

    // The 0009 invariant survives: a row may not carry two raw values.
    await expect(
      pool!.query(
        `INSERT INTO qc.lab_measurements (id, lab_test_id, sample_id, template_parameter_id, raw_numeric_value, raw_text_value, entered_by)
         VALUES (qc.uuidv7(), $1, $2, $3, 1, 'x', $4)`,
        [testId, sampleId, parameterId, OWNER_ID],
      ),
    ).rejects.toThrowError();

    // A rejected transition writes nothing, so the run evidence is untouched.
    await expect(
      new RecordLabRunUseCase(repo).execute({
        actor: actor(),
        id: testId,
        expectedVersion: 1n,
        run: { batchNo: 'RUN-1' },
        samples: [{ identifier: 'S-1' }],
        readings: [
          { sampleIdentifier: 'S-1', parameterId, readingIndex: 1, raw: '5.9', unit: 'pH' },
        ],
        requestId: `req-stale-${stamp}`,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    const untouched = await pool!.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM qc.lab_readings WHERE lab_test_id = $1 AND batch_id = $2`,
      [testId, batchId],
    );
    expect(untouched.rows[0]?.count).toBe('1');

    // A state transition keeps the run's samples, readings and results attached.
    const current = (await repo.get(testId, actor()))!;
    const submitted = await new SubmitLabTestUseCase(
      repo,
      {
        async resolve() {
          throw new Error('not used');
        },
        async listApprovedTemplates() {
          return [];
        },
        async validateExecution() {},
        async evaluate() {
          throw new Error('not used');
        },
      },
      { async verify() {} },
    ).execute({
      actor: actor(),
      id: testId,
      expectedVersion: current.version,
      requestId: `req-submit-b-${stamp}`,
    });
    expect(submitted.state).toBe('SUBMITTED');
    const afterSubmit = await pool!.query<{ readings: string; samples: string; results: string }>(
      `SELECT
         (SELECT count(*)::text FROM qc.lab_readings WHERE lab_test_id = $1) AS readings,
         (SELECT count(*)::text FROM qc.lab_samples WHERE lab_test_id = $1) AS samples,
         (SELECT count(*)::text FROM qc.lab_sample_results WHERE lab_test_id = $1) AS results`,
      [testId],
    );
    expect(afterSubmit.rows[0]).toEqual({ readings: '1', samples: '1', results: '1' });

    // The submission snapshot hash is stable for the same recorded content.
    const hashAgain = createHash('sha256')
      .update(stableJson(submitted.sampleResults ?? []))
      .digest('hex');
    expect(hashAgain).toMatch(/^[0-9a-f]{64}$/);
  }, 180000);
});
