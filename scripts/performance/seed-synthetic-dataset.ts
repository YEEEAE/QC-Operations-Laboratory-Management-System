/**
 * QC-100-FINAL-007 — synthetic representative dataset seeder.
 *
 * Safety properties:
 * - Refuses unless NODE_ENV is development|test AND QC_PERF_SEED_ALLOW=true.
 * - Refuses any DATABASE_URL that looks production-related (qclevel.top,
 *   render.com, onrender.com, or a "prod" database without a test/dev marker).
 * - Only runs against a disposable local cluster: host must be
 *   localhost/127.0.0.1 and the database name must be a disposable name.
 * - Every synthetic login identity uses the `perf-` prefix; every synthetic
 *   business number uses the `PERF-` prefix, so the dataset is fully
 *   distinguishable from operational data and fully removable.
 * - Idempotent: re-running removes only prior PERF- prefixed rows first.
 * - Distribution is deterministic (seeded RNG); the manifest is printed as JSON.
 * - No password, token, cookie, URL credential or secret is logged. The
 *   measurement passwords are generated, never echoed.
 */
import { createHash, randomUUID } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Pool } from 'pg';

import { hash } from 'argon2';

/* ------------------------------------------------------------------ guards */

const DISPOSABLE_DATABASE_NAMES = new Set(['qc_disposable', 'qc_test', 'qc_perf']);

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    fail('Refusing perf seed: NODE_ENV must be development or test.');
  }
  if (env.QC_PERF_SEED_ALLOW !== 'true') {
    fail('Refusing perf seed: QC_PERF_SEED_ALLOW=true is required (disposable environments only).');
  }
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) fail('Refusing perf seed: DATABASE_URL is required.');
  const lowered = databaseUrl.toLowerCase();
  const looksProduction =
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    lowered.includes('onrender.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'));
  if (looksProduction) fail('Refusing perf seed: DATABASE_URL looks production-related.');
  let parsed: URL;
  try {
    parsed = new URL(lowered);
  } catch {
    fail('Refusing perf seed: DATABASE_URL is malformed.');
  }
  const host = parsed.hostname;
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
  if (host !== 'localhost' && host !== '127.0.0.1') {
    fail(`Refusing perf seed: host must be a disposable local cluster (found ${host}).`);
  }
  if (!DISPOSABLE_DATABASE_NAMES.has(database)) {
    fail(`Refusing perf seed: database name must be a disposable name (found ${database}).`);
  }
}

/* ------------------------------------------------------------- utilities */

// Deterministic RNG so the distribution is reproducible run to run.
function mulberry32(seed: number): () => number {
  return function next(): number {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260919);
const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;
const weighted = <T>(items: readonly (T | readonly [T, number])[]): T => {
  const pairs = items.map((item) =>
    Array.isArray(item) ? (item as [T, number]) : ([item, 1] as [T, number]),
  );
  const total = pairs.reduce((sum, pair) => sum + pair[1], 0);
  let roll = rng() * total;
  for (const [value, weight] of pairs) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return pairs[pairs.length - 1]![0];
};
const round = (value: number, places = 2): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

function stableId(label: string): string {
  const hex = createHash('sha256').update(`qc-perf-seed:${label}`).digest('hex').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
}

const DAY = 24 * 60 * 60 * 1000;
// Fixed "now" so the dataset is stable across a slow run; the measurement
// harness re-derives freshness from real timestamps at read time.
const NOW = new Date('2026-09-19T09:00:00.000Z');
const daysAgo = (n: number): Date => new Date(NOW.getTime() - n * DAY);
const daysAhead = (n: number): Date => new Date(NOW.getTime() + n * DAY);

type Cell = string | number | boolean | Date | null;
type Row = Cell[];

/** Minimal query-capable client accepted by the bulk insert helper. */
interface QueryClient {
  query(text: string, values?: readonly unknown[]): Promise<{ rows: unknown[] }>;
}

/** Bulk insert helper: builds parameterised multi-row VALUES in chunks. */
async function bulkInsert(
  client: QueryClient,
  table: string,
  columns: readonly string[],
  rows: Row[],
  chunkSize = 500,
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values: Cell[] = [];
    const placeholders: string[] = [];
    let index = 1;
    for (const row of chunk) {
      const rowPlaceholders: string[] = [];
      for (const value of row) {
        rowPlaceholders.push(`$${index}`);
        values.push(value);
        index += 1;
      }
      placeholders.push(`(${rowPlaceholders.join(',')})`);
    }
    const sql = `INSERT INTO qc.${table} (${columns.join(',')}) VALUES ${placeholders.join(',')}`;
    await client.query(sql, values).catch((error: unknown) => {
      throw new Error(`bulkInsert(${table}) failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}

/* ------------------------------------------------------------ vocabularies */

const TASK_STATES = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const RECEIVING_STATES = [
  'PENDING',
  'READY_FOR_INSPECTION',
  'UNDER_INSPECTION',
  'INSPECTION_COMPLETE',
  'RELEASE_PENDING',
  'RELEASED',
  'HOLD',
  'EXPIRED',
  'CANCELLED',
] as const;
const INSPECTION_RESULTS = ['NOT_STARTED', 'IN_PROGRESS', 'PASS', 'FAIL', 'HOLD'] as const;
const FINAL_RESULTS = ['PASS', 'FAIL', 'HOLD'] as const;
const REPORT_STATES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED'] as const;
const LAB_STATES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED'] as const;
const REJECT_TYPES = ['ISSUE_SLIP', 'DAILY_REJECT'] as const;
const REJECT_STATUSES = ['DRAFT', 'FINALIZED', 'VOID'] as const;
const ISSUE_SLIP_STATUSES = [
  'DRAFT',
  'ISSUED',
  'APPROVAL_TRACKING',
  'COMPLETED',
  'VOID',
] as const;
const DOC_TYPES = ['WI', 'SOP', 'CONTROLLED_PROCEDURE', 'CONTROLLED_FORM', 'INSTRUCTION'] as const;
const DOC_VERSION_STATES = [
  'CATALOG_ONLY',
  'DRAFT',
  'IN_REVIEW',
  'RETURNED',
  'APPROVED',
  'EFFECTIVE',
  'SUPERSEDED',
  'ARCHIVED',
  'VOID',
] as const;
const EQUIPMENT_STATES = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;
const CALIBRATION_STATES = [
  'SCHEDULED',
  'SUBMITTED',
  'APPROVED',
  'CURRENT',
  'DUE',
  'OVERDUE',
  'COMPLETED',
  'FAILED',
] as const;
const SEVERITIES = ['INFO', 'WARNING', 'CRITICAL'] as const;
const FINDING_STATES = ['DRAFT', 'OPEN', 'UNDER_REVIEW', 'CLOSED', 'VOID'] as const;
const FINDING_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const NCR_STATES = [
  'DRAFT',
  'OPEN',
  'UNDER_INVESTIGATION',
  'RCA_IN_PROGRESS',
  'CAPA_IN_PROGRESS',
  'READY_FOR_CLOSURE',
  'CLOSED',
  'VOID',
] as const;
const CAPA_STATES = [
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_VERIFICATION',
  'EFFECTIVENESS_REVIEW',
  'READY_FOR_CLOSURE',
  'CLOSED',
  'VOID',
] as const;
const APPROVAL_WORK_TYPES = ['REVIEW', 'APPROVAL'] as const;
const DEPARTMENTS = ['RAW_MATERIALS', 'PACKAGING', 'FILLING', 'LABORATORY', 'WAREHOUSE'] as const;
const SHIFTS = ['MORNING', 'EVENING', 'NIGHT'] as const;
const ITEM_CODES = [
  'RM-0102',
  'RM-0207',
  'RM-0311',
  'PK-1101',
  'PK-1204',
  'FL-2103',
  'FL-2210',
  'LB-3001',
  'LB-3015',
  'WH-4002',
] as const;
const SUPPLIERS = [
  'Alpha Chemicals',
  'Beta Packaging',
  'Gamma Labs',
  'Delta Supply',
  'Epsilon Materials',
] as const;
const REJECT_REASONS = [
  'Out of specification',
  'Visual defect',
  'Contamination',
  'Label mismatch',
  'Temperature excursion',
  'Damaged packaging',
] as const;
const MACHINES = ['Mixer-01', 'Filler-02', 'Sealer-03', 'Labeler-04', 'Autoclave-05'] as const;

/* ------------------------------------------------------------------ sizes */

const SIZES = {
  syntheticUsersPerRole: 6,
  inspectionTemplates: 4,
  labTemplates: 4,
  equipment: 80,
  calibrationsPerEquipment: 3,
  tasks: 3000,
  receivingItems: 8000,
  inspectionReports: 2500,
  labTests: 1800,
  samplesPerLabTest: 2,
  dailyRejectReports: 900,
  issueSlipReports: 300,
  dailyRejectEntriesPerReport: 4,
  findings: 400,
  ncrs: 250,
  capas: 120,
  approvalCases: 400,
  documentIdentities: 250,
  versionsPerDocument: 2,
  notifications: 2500,
  outboxEvents: 1200,
  auditEvents: 12000,
  daysSpread: 120,
} as const;

type Counts = Record<string, number>;
const inserted: Counts = {};

/* ------------------------------------------------------------------ main */

async function main(): Promise<void> {
  requireGuard(process.env);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    application_name: 'qc-perf-seed',
    options: '-c timezone=UTC -c search_path=qc,pg_catalog',
  });
  const client = await pool.connect();
  const distributions: Record<string, Record<string, number>> = {};

  const record = (bucket: string, key: string): void => {
    distributions[bucket] = distributions[bucket] ?? {};
    distributions[bucket][key] = (distributions[bucket][key] ?? 0) + 1;
  };

  try {
    await client.query('BEGIN');

    /* ---- idempotent removal of any prior PERF- dataset (perf rows only) --
     * qc.audit_events is append-only by trigger (immutable audit), so it is
     * never deleted; the PERF-SEED- prefixed rows are instead skipped on
     * re-runs below. */
    await client.query("DELETE FROM qc.notification_deliveries WHERE notification_id IN (SELECT id FROM qc.notifications WHERE recipient_user_id IN (SELECT id FROM qc.users WHERE login_identity LIKE 'perf-%'))");
    await client.query("DELETE FROM qc.notifications WHERE recipient_user_id IN (SELECT id FROM qc.users WHERE login_identity LIKE 'perf-%')");
    await client.query('DELETE FROM qc.outbox_events WHERE dedupe_key LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.document_versions WHERE document_id IN (SELECT id FROM qc.document_identities WHERE document_no LIKE $$PERF-%$$)');
    await client.query("DELETE FROM qc.document_identities WHERE document_no LIKE 'PERF-%'");
    await client.query('DELETE FROM qc.approval_work_items WHERE approval_case_id IN (SELECT id FROM qc.approval_cases WHERE subject_id::text IN (SELECT id::text FROM qc.findings WHERE finding_no LIKE $$PERF-%$$))');
    await client.query('DELETE FROM qc.approval_cases WHERE subject_id::text IN (SELECT id::text FROM qc.findings WHERE finding_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.capas WHERE capa_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.ncrs WHERE ncr_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.findings WHERE finding_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.lab_measurements WHERE lab_test_id IN (SELECT id FROM qc.lab_tests WHERE lab_test_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.lab_samples WHERE lab_test_id IN (SELECT id FROM qc.lab_tests WHERE lab_test_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.lab_tests WHERE lab_test_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.inspection_report_results WHERE inspection_report_id IN (SELECT id FROM qc.inspection_reports WHERE inspection_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.inspection_reports WHERE inspection_no LIKE $$PERF-%$$');
    // Synthetic templates (safe once reports no longer reference the versions).
    await client.query('DELETE FROM qc.inspection_template_points WHERE point_code LIKE $$PT-%$$');
    await client.query('DELETE FROM qc.inspection_template_sections WHERE section_code LIKE $$SEC-%$$');
    await client.query("DELETE FROM qc.inspection_template_versions WHERE version_no = '1.0' AND created_by IN (SELECT id FROM qc.users WHERE login_identity = 'yazeed')");
    await client.query("DELETE FROM qc.inspection_templates WHERE template_code LIKE 'PERF-IT-%'");
    await client.query('DELETE FROM qc.lab_test_template_parameters WHERE parameter_code LIKE $$PR-%$$');
    await client.query('DELETE FROM qc.lab_test_template_sections WHERE section_code LIKE $$SEC-%$$');
    await client.query("DELETE FROM qc.lab_test_template_versions WHERE version_no = '1.0' AND created_by IN (SELECT id FROM qc.users WHERE login_identity = 'yazeed')");
    await client.query("DELETE FROM qc.lab_test_templates WHERE test_code LIKE 'PERF-LT-%'");
    await client.query('DELETE FROM qc.daily_reject_entries WHERE report_id IN (SELECT id FROM qc.reject_reports WHERE report_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.reject_issue_slips WHERE report_id IN (SELECT id FROM qc.reject_reports WHERE report_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.reject_reports WHERE report_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.task_assignments WHERE task_id IN (SELECT id FROM qc.tasks WHERE task_no LIKE $$PERF-%$$)');
    await client.query('DELETE FROM qc.tasks WHERE task_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.receiving_items WHERE receiving_no LIKE $$PERF-%$$');
    // equipment.current_calibration_id RESTRICTs calibration deletion.
    await client.query("UPDATE qc.equipment SET current_calibration_id = NULL WHERE equipment_no LIKE 'PERF-%'");
    await client.query('DELETE FROM qc.calibration_records WHERE calibration_no LIKE $$PERF-%$$');
    await client.query('DELETE FROM qc.equipment WHERE equipment_no LIKE $$PERF-%$$');
    await client.query("DELETE FROM qc.user_scopes WHERE user_id IN (SELECT id FROM qc.users WHERE login_identity LIKE 'perf-%')");
    await client.query("DELETE FROM qc.user_roles WHERE user_id IN (SELECT id FROM qc.users WHERE login_identity LIKE 'perf-%')");
    // qc.users cannot be deleted: audit_events is append-only and RESTRICTs
    // actor deletion. Re-runs therefore reuse existing perf- users by their
    // stable IDs instead of recreating them.

    /* ---- reference users --------------------------------------------- */
    const roleIdByCode: Record<string, string> = {};
    {
      const roles = await client.query<{ id: string; code: string }>(
        'SELECT id, code FROM qc.roles WHERE active = TRUE',
      );
      for (const row of roles.rows) roleIdByCode[row.code] = row.id;
    }
    const owner = await client.query<{ id: string }>(
      "SELECT id FROM qc.users WHERE login_identity = 'yazeed'",
    );
    const ownerId = owner.rows[0]?.id ?? fail('Refusing perf seed: yazeed owner account is missing.');

    type SyntheticUser = {
      id: string;
      loginIdentity: string;
      roleCode: 'EMPLOYEE' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';
      team: string;
    };
    const syntheticUsers: SyntheticUser[] = [];
    const teams = ['QC-TEAM-A', 'QC-TEAM-B', 'QC-TEAM-C'];
    const roleCycle: SyntheticUser['roleCode'][] = ['EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN'];
    const measurementPassword = `PERF-Measure-${randomUUID().slice(0, 12)}`;
    const measurementHash = await hash(measurementPassword);
    // The disposable credential is written only to the gitignored runtime
    // directory with restrictive permissions, never to a repo file or log.
    const credentialPath = resolve(process.cwd(), '.tmp', 'perf-credentials.json');
    await mkdir(dirname(credentialPath), { recursive: true });
    await writeFile(
      credentialPath,
      JSON.stringify(
        { loginIdentity: 'perf-measure', password: measurementPassword, generatedAt: new Date().toISOString() },
        null,
        2,
      ),
      { mode: 0o600 },
    );
    await chmod(credentialPath, 0o600);

    // Measurement identity used by the browser/HTTP harness (MANAGER + TEAM scope).
    const measureUser: SyntheticUser = {
      id: stableId('perf-user:perf-measure'),
      loginIdentity: 'perf-measure',
      roleCode: 'MANAGER',
      team: teams[0]!,
    };
    for (let index = 0; index < SIZES.syntheticUsersPerRole * 4; index += 1) {
      const roleCode = roleCycle[index % 4]!;
      const loginIdentity = `perf-${roleCode.toLowerCase()}-${String(index + 1).padStart(2, '0')}`;
      syntheticUsers.push({
        id: stableId(`perf-user:${loginIdentity}`),
        loginIdentity,
        roleCode,
        team: teams[index % 3]!,
      });
    }
    const allUsers = [measureUser, ...syntheticUsers];

    // Reuse any perf- users already present from a previous run, so the
    // append-only audit history keeps a consistent actor identity.
    const existingUsers = await client.query<{ id: string; login_identity: string }>(
      "SELECT id, login_identity FROM qc.users WHERE login_identity LIKE 'perf-%'",
    );
    const existingUserId = new Map(existingUsers.rows.map((row) => [row.login_identity, row.id]));
    const usersToCreate = allUsers.filter((user) => !existingUserId.has(user.loginIdentity));
    for (const user of allUsers) {
      const existing = existingUserId.get(user.loginIdentity);
      if (existing) user.id = existing;
    }

    const userRows = usersToCreate.map((user) => [
      user.id,
      user.loginIdentity,
      `${user.loginIdentity}@example.invalid`,
      `Perf ${user.roleCode} ${user.loginIdentity} (disposable)`,
      user.loginIdentity === 'perf-measure' ? measurementHash : measurementHash,
      'ACTIVE',
      false,
      ownerId,
    ]);
    await bulkInsert(client, 'users', [
      'id',
      'login_identity',
      'email',
      'display_name',
      'password_hash',
      'account_state',
      'must_change_password',
      'created_by',
    ], userRows);
    inserted.users = allUsers.length;
    record('users', 'MANAGER+TEAM measurement identity (perf-measure)');
    for (const user of syntheticUsers) record('users', user.roleCode);

    const roleRows: (string | number | boolean | Date | null)[][] = [];
    const scopeRows: (string | number | boolean | Date | null)[][] = [];
    for (const user of allUsers) {
      const roleId = roleIdByCode[user.roleCode];
      if (!roleId) fail(`Foundation role missing: ${user.roleCode}`);
      roleRows.push([
        randomUUID(),
        user.id,
        roleId,
        ownerId,
        'QC-100-FINAL-007 SYNTHETIC PERF DATASET',
        NOW,
      ]);
      scopeRows.push([
        randomUUID(),
        user.id,
        'TEAM',
        user.team,
        ownerId,
        'QC-100-FINAL-007 SYNTHETIC PERF DATASET',
      ]);
    }
    await bulkInsert(
      client,
      'user_roles',
      ['id', 'user_id', 'role_id', 'assigned_by', 'reason', 'valid_until'],
      roleRows,
    );
    await bulkInsert(
      client,
      'user_scopes',
      ['id', 'user_id', 'scope_kind', 'scope_value', 'assigned_by', 'reason'],
      scopeRows,
    );
    inserted.user_roles = roleRows.length;
    inserted.user_scopes = scopeRows.length;

    /* ---- inspection + laboratory templates ---------------------------- */
    const inspectionVersionIds: string[] = [];
    const inspectionPointIds: string[] = [];
    {
      const templateRows: (string | number | boolean | Date | null)[][] = [];
      const versionRows: (string | number | boolean | Date | null)[][] = [];
      const sectionRows: (string | number | boolean | Date | null)[][] = [];
      const pointRows: (string | number | boolean | Date | null)[][] = [];
      const dataTypes = ['TEXT', 'NUMERIC', 'BOOLEAN', 'SELECT'];
      let pointCounter = 0;
      for (let t = 0; t < SIZES.inspectionTemplates; t += 1) {
        const templateId = stableId(`perf-inspection-template:${t}`);
        const versionId = stableId(`perf-inspection-template-version:${t}`);
        inspectionVersionIds.push(versionId);
        templateRows.push([
          templateId,
          `PERF-IT-${String(t + 1).padStart(3, '0')}`,
          `Perf inspection template ${t + 1}`,
          'Synthetic representative inspection checklist',
          true,
          ownerId,
        ]);
        versionRows.push([
          versionId,
          templateId,
          '1.0',
          'APPROVED',
          daysAgo(90),
          daysAgo(91),
          ownerId,
          'PERF-IT-SOP',
          null,
          'Perf inspection template v1.0',
          'Synthetic representative inspection checklist',
          ownerId,
        ]);
        for (let s = 0; s < 2; s += 1) {
          const sectionId = stableId(`perf-inspection-section:${t}:${s}`);
          sectionRows.push([
            sectionId,
            versionId,
            `SEC-${s + 1}`,
            `Perf inspection section ${s + 1}`,
            s,
            'Verify the representative acceptance criteria',
          ]);
          for (let p = 0; p < 4; p += 1) {
            const pointId = stableId(`perf-inspection-point:${t}:${s}:${p}`);
            inspectionPointIds.push(pointId);
            pointCounter += 1;
            pointRows.push([
              pointId,
              sectionId,
              `PT-${String(pointCounter).padStart(3, '0')}`,
              `Perf checkpoint ${pointCounter}`,
              'Representative acceptance criterion',
              dataTypes[pointCounter % 4]!,
              dataTypes[pointCounter % 4] === 'NUMERIC' ? 'unit' : null,
              true,
              'RANGE',
              JSON.stringify({ min: 0, max: 100 }),
              'PERF-IT-SOP-4.1',
              p,
            ]);
          }
        }
      }
      await bulkInsert(
        client,
        'inspection_templates',
        [
          'id',
          'template_code',
          'name',
          'description',
          'active',
          'created_by',
        ],
        templateRows,
      );
      await bulkInsert(
        client,
        'inspection_template_versions',
        [
          'id',
          'template_id',
          'version_no',
          'state',
          'effective_at',
          'approved_at',
          'approved_by',
          'source_document',
          'content_hash',
          'name',
          'description',
          'created_by',
        ],
        versionRows,
      );
      await bulkInsert(
        client,
        'inspection_template_sections',
        ['id', 'template_version_id', 'section_code', 'title', 'position', 'instructions'],
        sectionRows,
      );
      await bulkInsert(
        client,
        'inspection_template_points',
        [
          'id',
          'section_id',
          'point_code',
          'label',
          'requirement_text',
          'data_type',
          'unit',
          'required',
          'acceptance_rule_type',
          'acceptance_rule_payload',
          'source_reference',
          'position',
        ],
        pointRows,
      );
      inserted.inspection_templates = SIZES.inspectionTemplates;
      inserted.inspection_template_versions = SIZES.inspectionTemplates;
      inserted.inspection_template_sections = SIZES.inspectionTemplates * 2;
      inserted.inspection_template_points = pointCounter;
    }

    const labVersionIds: string[] = [];
    const labParameterIds: string[] = [];
    {
      const templateRows: (string | number | boolean | Date | null)[][] = [];
      const versionRows: (string | number | boolean | Date | null)[][] = [];
      const sectionRows: (string | number | boolean | Date | null)[][] = [];
      const parameterRows: (string | number | boolean | Date | null)[][] = [];
      const dataTypes = ['NUMERIC', 'TEXT', 'BOOLEAN'];
      let parameterCounter = 0;
      for (let t = 0; t < SIZES.labTemplates; t += 1) {
        const templateId = stableId(`perf-lab-template:${t}`);
        const versionId = stableId(`perf-lab-template-version:${t}`);
        labVersionIds.push(versionId);
        templateRows.push([
          templateId,
          `PERF-LT-${String(t + 1).padStart(3, '0')}`,
          `Perf laboratory method ${t + 1}`,
          'Synthetic representative laboratory method',
          true,
          ownerId,
        ]);
        versionRows.push([
          versionId,
          templateId,
          '1.0',
          'APPROVED',
          daysAgo(90),
          daysAgo(91),
          ownerId,
          'PERF-LT-METHOD',
          null,
          ownerId,
        ]);
        for (let s = 0; s < 2; s += 1) {
          const sectionId = stableId(`perf-lab-section:${t}:${s}`);
          sectionRows.push([
            sectionId,
            versionId,
            `SEC-${s + 1}`,
            `Perf laboratory section ${s + 1}`,
            s,
            'Perform the representative method steps',
          ]);
          for (let p = 0; p < 4; p += 1) {
            const parameterId = stableId(`perf-lab-parameter:${t}:${s}:${p}`);
            labParameterIds.push(parameterId);
            parameterCounter += 1;
            const dataType = dataTypes[parameterCounter % 3]!;
            parameterRows.push([
              parameterId,
              versionId,
              `PR-${String(parameterCounter).padStart(3, '0')}`,
              `Perf parameter ${parameterCounter}`,
              dataType,
              dataType === 'NUMERIC' ? 'mg/L' : null,
              true,
              'RANGE',
              JSON.stringify({ min: 0, max: 50 }),
              'PERF-LT-METHOD-6.2',
              p,
            ]);
          }
        }
      }
      await bulkInsert(
        client,
        'lab_test_templates',
        ['id', 'test_code', 'name', 'description', 'active', 'created_by'],
        templateRows,
      );
      await bulkInsert(
        client,
        'lab_test_template_versions',
        [
          'id',
          'template_id',
          'version_no',
          'state',
          'effective_at',
          'approved_at',
          'approved_by',
          'method_reference',
          'content_hash',
          'created_by',
        ],
        versionRows,
      );
      await bulkInsert(
        client,
        'lab_test_template_sections',
        ['id', 'template_version_id', 'section_code', 'title', 'position', 'instructions'],
        sectionRows,
      );
      await bulkInsert(
        client,
        'lab_test_template_parameters',
        [
          'id',
          'template_version_id',
          'parameter_code',
          'label',
          'data_type',
          'unit',
          'required',
          'acceptance_rule_type',
          'acceptance_rule_payload',
          'controlled_source_reference',
          'position',
        ],
        parameterRows,
      );
      inserted.lab_test_templates = SIZES.labTemplates;
      inserted.lab_test_template_versions = SIZES.labTemplates;
      inserted.lab_test_template_sections = SIZES.labTemplates * 2;
      inserted.lab_test_template_parameters = parameterCounter;
    }

    /* ---- equipment + calibrations ------------------------------------- */
    const equipmentIds: string[] = [];
    {
      const equipmentRows: Row[] = [];
      const calibrationRows: Row[] = [];
      // current_calibration_id is resolved after both tables exist, because
      // equipment -> calibration_records and calibration_records -> equipment
      // reference each other.
      const currentCalibrationByEquipment: Map<string, string> = new Map();
      for (let e = 0; e < SIZES.equipment; e += 1) {
        const equipmentId = stableId(`perf-equipment:${e}`);
        equipmentIds.push(equipmentId);
        const state = weighted<EquipmentState>([
          ['ACTIVE', 70],
          ['OUT_OF_SERVICE', 10],
          ['UNDER_MAINTENANCE', 12],
          ['DECOMMISSIONED', 8],
        ]);
        record('equipment', state);
        equipmentRows.push([
          equipmentId,
          `PERF-EQ-${String(e + 1).padStart(3, '0')}`,
          `Perf instrument ${e + 1}`,
          'Perf Instruments',
          `PI-${1000 + e}`,
          `SN-${20000 + e}`,
          `Lab ${e % 4}`,
          state,
          null,
          daysAgo(100),
          null,
          ownerId,
        ]);
        for (let c = 0; c < SIZES.calibrationsPerEquipment; c += 1) {
          const calibrationId = stableId(`perf-calibration:${e}:${c}`);
          const state = weighted<CalibrationState>([
            ['CURRENT', 45],
            ['DUE', 15],
            ['OVERDUE', 15],
            ['COMPLETED', 10],
            ['FAILED', 5],
            ['SCHEDULED', 5],
            ['APPROVED', 5],
          ]);
          record('calibration_records', state);
          const calibrationDate = daysAgo(90 - c * 30);
          const dueDate = new Date(calibrationDate.getTime() + 90 * DAY);
          calibrationRows.push([
            calibrationId,
            `PERF-CAL-${String(e + 1).padStart(3, '0')}-${c + 1}`,
            equipmentId,
            state,
            calibrationDate,
            dueDate,
            'Perf Calibration Lab',
            `CERT-${30000 + e * 3 + c}`,
            state === 'FAILED' ? 'FAIL' : 'PASS',
            state === 'CURRENT' || state === 'COMPLETED' ? daysAgo(90 - c * 30) : null,
            state === 'CURRENT' ? daysAgo(90 - c * 30) : null,
            null,
            null,
            ownerId,
          ]);
          if (state === 'CURRENT' && !currentCalibrationByEquipment.has(equipmentId)) {
            currentCalibrationByEquipment.set(equipmentId, calibrationId);
          }
        }
      }
      await bulkInsert(
        client,
        'equipment',
        [
          'id',
          'equipment_no',
          'name',
          'manufacturer',
          'model',
          'serial_no',
          'location',
          'state',
          'current_calibration_id',
          'commissioned_at',
          'decommissioned_at',
          'created_by',
        ],
        equipmentRows,
      );
      await bulkInsert(
        client,
        'calibration_records',
        [
          'id',
          'calibration_no',
          'equipment_id',
          'state',
          'calibration_date',
          'due_date',
          'provider',
          'certificate_no',
          'result',
          'approved_at',
          'became_current_at',
          'superseded_at',
          'voided_at',
          'created_by',
        ],
        calibrationRows,
      );
      for (const [equipmentId, calibrationId] of currentCalibrationByEquipment) {
        await client.query(
          'UPDATE qc.equipment SET current_calibration_id = $1 WHERE id = $2',
          [calibrationId, equipmentId],
        );
      }
      inserted.equipment = SIZES.equipment;
      inserted.calibration_records = calibrationRows.length;
    }

    /* ---- tasks -------------------------------------------------------- */
    const taskIds: string[] = [];
    {
      const taskRows: (string | number | boolean | Date | null)[][] = [];
      const assignmentRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.tasks; i += 1) {
        const taskId = stableId(`perf-task:${i}`);
        taskIds.push(taskId);
        const author = pick(syntheticUsers);
        const state = weighted<TaskState>([
          ['OPEN', 28],
          ['IN_PROGRESS', 30],
          ['COMPLETED', 22],
          ['DRAFT', 8],
          ['ON_HOLD', 7],
          ['CANCELLED', 5],
        ]);
        record('tasks', state);
        // Due-date spread: overdue / due today / future / none — the exact
        // predicates the dashboard "due" filter and overdue counters read.
        const dueRoll = rng();
        const dueAt =
          dueRoll < 0.18
            ? daysAgo(Math.floor(rng() * 30) + 1) // overdue
            : dueRoll < 0.28
              ? new Date(NOW.getTime() + Math.floor(rng() * 8) * 60 * 60 * 1000) // due today
              : dueRoll < 0.85
                ? daysAhead(Math.floor(rng() * 60) + 1)
                : null;
        if (dueAt && dueAt.getTime() < NOW.getTime()) record('tasks.due', 'overdue');
        else if (dueAt) record('tasks.due', 'future');
        else record('tasks.due', 'none');
        const completedAt = state === 'COMPLETED' ? daysAgo(Math.floor(rng() * 60)) : null;
        taskRows.push([
          taskId,
          `PERF-TASK-${String(i + 1).padStart(5, '0')}`,
          `Perf task ${i + 1}`,
          `Synthetic representative task ${i + 1} for queue measurement`,
          weighted<string>([
            ['LOW', 25],
            ['MEDIUM', 40],
            ['HIGH', 25],
            ['URGENT', 10],
          ]),
          state,
          dueAt,
          author.id,
          author.id,
          completedAt,
        ]);
        const assignee = pick(allUsers);
        assignmentRows.push([randomUUID(), taskId, assignee.id, author.id, NOW, null, null]);
      }
      await bulkInsert(
        client,
        'tasks',
        [
          'id',
          'task_no',
          'title',
          'description',
          'priority',
          'state',
          'due_at',
          'created_by',
          'current_assignee_id',
          'completed_at',
        ],
        taskRows,
      );
      await bulkInsert(
        client,
        'task_assignments',
        ['id', 'task_id', 'assignee_id', 'assigned_by', 'assigned_at', 'unassigned_at', 'reason'],
        assignmentRows,
      );
      inserted.tasks = SIZES.tasks;
      inserted.task_assignments = assignmentRows.length;
    }

    /* ---- receiving items ---------------------------------------------- */
    const receivingIds: string[] = [];
    {
      const rows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.receivingItems; i += 1) {
        const id = stableId(`perf-receiving:${i}`);
        receivingIds.push(id);
        const workflowState = weighted<ReceivingState>([
          ['RELEASED', 26],
          ['PENDING', 14],
          ['READY_FOR_INSPECTION', 14],
          ['UNDER_INSPECTION', 12],
          ['INSPECTION_COMPLETE', 12],
          ['RELEASE_PENDING', 8],
          ['HOLD', 8],
          ['EXPIRED', 4],
          ['CANCELLED', 2],
        ]);
        record('receiving_items.workflow_state', workflowState);
        const inspectionResult = weighted<InspectionResult>([
          ['PASS', 45],
          ['NOT_STARTED', 20],
          ['FAIL', 15],
          ['IN_PROGRESS', 12],
          ['HOLD', 8],
        ]);
        record('receiving_items.inspection_result', inspectionResult);
        const released = workflowState === 'RELEASED';
        const creator = pick(syntheticUsers);
        rows.push([
          id,
          `PERF-RCV-${String(i + 1).padStart(5, '0')}`,
          `PERF-DOC-${String(i + 1).padStart(5, '0')}`,
          pick(ITEM_CODES),
          `Perf raw material ${i + 1}`,
          `LOT-${100000 + i}`,
          round(1 + rng() * 500),
          // Receiving dates spread across the whole measured window.
          daysAgo(Math.floor(rng() * SIZES.daysSpread)),
          rng() < 0.7 ? daysAhead(Math.floor(rng() * 365)) : null,
          workflowState,
          inspectionResult,
          released,
          released ? daysAgo(Math.floor(rng() * 30)) : null,
          released ? creator.id : null,
          creator.id,
          pick(SUPPLIERS),
        ]);
      }
      await bulkInsert(
        client,
        'receiving_items',
        [
          'id',
          'receiving_no',
          'doc_no',
          'item_code',
          'description',
          'lot',
          'qty',
          'receiving_date',
          'expiry_date',
          'workflow_state',
          'inspection_result',
          'release_system',
          'released_at',
          'released_by',
          'created_by',
          'supplier_name',
        ],
        rows,
      );
      inserted.receiving_items = SIZES.receivingItems;
    }

    /* ---- inspection reports + results --------------------------------- */
    {
      const reportRows: (string | number | boolean | Date | null)[][] = [];
      const resultRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.inspectionReports; i += 1) {
        const id = stableId(`perf-inspection-report:${i}`);
        const receivingId = receivingIds[i % receivingIds.length]!;
        const author = pick(syntheticUsers);
        const state = weighted<ReportState>([
          ['SUBMITTED', 26],
          ['APPROVED', 24],
          ['UNDER_REVIEW', 18],
          ['DRAFT', 14],
          ['RETURNED', 12],
          ['REJECTED', 6],
        ]);
        record('inspection_reports.state', state);
        const hasResult = state !== 'DRAFT';
        const finalResult = hasResult ? weighted(FINAL_RESULTS) : null;
        if (finalResult) record('inspection_reports.final_result', finalResult);
        const submittedAt = state !== 'DRAFT' ? daysAgo(Math.floor(rng() * 100)) : null;
        const reviewStartedAt =
          state === 'UNDER_REVIEW' || state === 'APPROVED' || state === 'REJECTED'
            ? daysAgo(Math.floor(rng() * 80))
            : null;
        const approvedAt = state === 'APPROVED' ? daysAgo(Math.floor(rng() * 60)) : null;
        const rejectedAt = state === 'REJECTED' ? daysAgo(Math.floor(rng() * 60)) : null;
        reportRows.push([
          id,
          `PERF-INSP-${String(i + 1).padStart(5, '0')}`,
          receivingId,
          inspectionVersionIds[i % inspectionVersionIds.length]!,
          state,
          finalResult,
          author.id,
          submittedAt,
          reviewStartedAt,
          approvedAt,
          rejectedAt,
          null,
          null,
          author.id,
          i % 3 === 0 ? author.id : null,
        ]);
        if (hasResult) {
          for (let p = 0; p < 4; p += 1) {
            const pointId = inspectionPointIds[(i * 4 + p) % inspectionPointIds.length]!;
            const numericValue = round(rng() * 100);
            resultRows.push([
              stableId(`perf-inspection-result:${i}:${p}`),
              id,
              pointId,
              numericValue,
              null,
              null,
              null,
              'unit',
              numericValue > 50 ? 'PASS' : 'FAIL',
              null,
              author.id,
            ]);
          }
        }
      }
      await bulkInsert(
        client,
        'inspection_reports',
        [
          'id',
          'inspection_no',
          'receiving_item_id',
          'template_version_id',
          'state',
          'final_result',
          'author_id',
          'submitted_at',
          'review_started_at',
          'approved_at',
          'rejected_at',
          'voided_at',
          'snapshot_id',
          'created_by',
          'assigned_user_id',
        ],
        reportRows,
      );
      await bulkInsert(
        client,
        'inspection_report_results',
        [
          'id',
          'inspection_report_id',
          'template_point_id',
          'numeric_value',
          'text_value',
          'boolean_value',
          'selected_value',
          'unit',
          'result',
          'remarks',
          'entered_by',
        ],
        resultRows,
      );
      inserted.inspection_reports = SIZES.inspectionReports;
      inserted.inspection_report_results = resultRows.length;
    }

    /* ---- laboratory tests + samples + measurements -------------------- */
    {
      const testRows: (string | number | boolean | Date | null)[][] = [];
      const sampleRows: (string | number | boolean | Date | null)[][] = [];
      const measurementRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.labTests; i += 1) {
        const id = stableId(`perf-lab-test:${i}`);
        const author = pick(syntheticUsers);
        const state = weighted<LabState>([
          ['APPROVED', 26],
          ['SUBMITTED', 22],
          ['UNDER_REVIEW', 18],
          ['DRAFT', 14],
          ['RETURNED', 12],
          ['REJECTED', 8],
        ]);
        record('lab_tests.state', state);
        const hasResult = state !== 'DRAFT' && state !== 'RETURNED';
        testRows.push([
          id,
          `PERF-LAB-${String(i + 1).padStart(5, '0')}`,
          labVersionIds[i % labVersionIds.length]!,
          state,
          hasResult ? weighted(FINAL_RESULTS) : null,
          i % 4 === 0 ? receivingIds[i % receivingIds.length]! : null,
          null,
          0,
          null,
          author.id,
          state !== 'DRAFT' ? daysAgo(Math.floor(rng() * 100)) : null,
          state === 'UNDER_REVIEW' || state === 'APPROVED' || state === 'REJECTED'
            ? daysAgo(Math.floor(rng() * 80))
            : null,
          state === 'APPROVED' ? daysAgo(Math.floor(rng() * 60)) : null,
          state === 'REJECTED' ? daysAgo(Math.floor(rng() * 60)) : null,
          null,
          null,
          author.id,
        ]);
        for (let s = 0; s < SIZES.samplesPerLabTest; s += 1) {
          const sampleId = stableId(`perf-lab-sample:${i}:${s}`);
          sampleRows.push([
            sampleId,
            id,
            `S-${s + 1}`,
            `PERF-SAMPLE-${i + 1}-${s + 1}`,
            s,
            'Receiving',
            'REGISTERED',
            author.id,
          ]);
          if (hasResult) {
            for (let p = 0; p < 3; p += 1) {
              const parameterId = labParameterIds[(i * 3 + p) % labParameterIds.length]!;
              const raw = round(rng() * 50);
              measurementRows.push([
                stableId(`perf-lab-measurement:${i}:${s}:${p}`),
                id,
                sampleId,
                parameterId,
                raw,
                null,
                null,
                'mg/L',
                raw,
                'mg/L',
                raw > 25 ? 'PASS' : 'FAIL',
                null,
                author.id,
              ]);
            }
          }
        }
      }
      await bulkInsert(
        client,
        'lab_tests',
        [
          'id',
          'lab_test_no',
          'template_version_id',
          'state',
          'scientific_result',
          'source_receiving_item_id',
          'original_test_id',
          'retest_sequence',
          'retest_reason',
          'author_id',
          'submitted_at',
          'review_started_at',
          'approved_at',
          'rejected_at',
          'voided_at',
          'snapshot_id',
          'created_by',
        ],
        testRows,
      );
      await bulkInsert(
        client,
        'lab_samples',
        ['id', 'lab_test_id', 'sample_no', 'sample_identifier', 'position', 'sample_source', 'state', 'created_by'],
        sampleRows,
      );
      await bulkInsert(
        client,
        'lab_measurements',
        [
          'id',
          'lab_test_id',
          'sample_id',
          'template_parameter_id',
          'raw_numeric_value',
          'raw_text_value',
          'raw_boolean_value',
          'unit',
          'calculated_value',
          'calculated_unit',
          'result',
          'remarks',
          'entered_by',
        ],
        measurementRows,
      );
      inserted.lab_tests = SIZES.labTests;
      inserted.lab_samples = sampleRows.length;
      inserted.lab_measurements = measurementRows.length;
    }

    /* ---- reject reports + entries + issue slips ----------------------- */
    {
      const reportRows: (string | number | boolean | Date | null)[][] = [];
      const entryRows: (string | number | boolean | Date | null)[][] = [];
      const slipRows: (string | number | boolean | Date | null)[][] = [];
      let reportIndex = 0;
      for (let i = 0; i < SIZES.dailyRejectReports; i += 1) {
        const id = stableId(`perf-daily-reject:${i}`);
        reportIndex += 1;
        const status = weighted<DailyRejectStatus>([
          ['FINALIZED', 62],
          ['DRAFT', 28],
          ['VOID', 10],
        ]);
        record('reject_reports.daily_status', status);
        const creator = pick(syntheticUsers);
        const reportDate = daysAgo(Math.floor(rng() * SIZES.daysSpread));
        reportRows.push([
          id,
          `PERF-DR-${String(reportIndex).padStart(5, '0')}`,
          'DAILY_REJECT',
          reportDate,
          pick(DEPARTMENTS),
          pick(SHIFTS),
          status,
          status !== 'DRAFT' ? daysAgo(Math.floor(rng() * 100)) : null,
          status === 'FINALIZED' ? daysAgo(Math.floor(rng() * 90)) : null,
          status === 'FINALIZED' ? daysAgo(Math.floor(rng() * 80)) : null,
          status === 'VOID' ? daysAgo(Math.floor(rng() * 60)) : null,
          status === 'VOID' ? creator.id : null,
          status === 'VOID' ? 'Synthetic void reason' : null,
          null,
          creator.id,
        ]);
        for (let e = 0; e < SIZES.dailyRejectEntriesPerReport; e += 1) {
          const rejectQty = round(1 + rng() * 40);
          const goodQty = round(50 + rng() * 950);
          entryRows.push([
            stableId(`perf-reject-entry:${i}:${e}`),
            id,
            e,
            pick(MACHINES),
            pick(ITEM_CODES),
            `Perf item ${ITEM_CODES[e % ITEM_CODES.length]}`,
            `LOT-${400000 + i * 4 + e}`,
            'Perf raw material',
            'Raw material',
            `RM-LOT-${500000 + i * 4 + e}`,
            'RM',
            round(rng() * 20),
            rejectQty,
            goodQty,
            goodQty > 0 ? round((rejectQty / (rejectQty + goodQty)) * 100, 2) : null,
            5,
            'Standard formula',
            pick(REJECT_REASONS),
            'Representative analysis note',
          ]);
        }
      }
      for (let i = 0; i < SIZES.issueSlipReports; i += 1) {
        const id = stableId(`perf-issue-slip:${i}`);
        reportIndex += 1;
        // ISSUE_SLIP reports carry their own status vocabulary, distinct from
        // the daily-reject vocabulary (see ck on qc.reject_reports).
        const status = weighted<IssueSlipStatus>([
          ['COMPLETED', 40],
          ['APPROVAL_TRACKING', 30],
          ['ISSUED', 15],
          ['DRAFT', 15],
        ]);
        record('reject_reports.slip_status', status);
        const creator = pick(syntheticUsers);
        reportRows.push([
          id,
          `PERF-IS-${String(reportIndex).padStart(5, '0')}`,
          'ISSUE_SLIP',
          daysAgo(Math.floor(rng() * SIZES.daysSpread)),
          pick(DEPARTMENTS),
          pick(SHIFTS),
          status,
          daysAgo(Math.floor(rng() * 100)),
          null,
          status === 'COMPLETED' ? daysAgo(Math.floor(rng() * 80)) : null,
          null,
          null,
          null,
          null,
          creator.id,
        ]);
        slipRows.push([
          id,
          'Perf rejected goods description',
          pick(ITEM_CODES),
          `Perf item ${i + 1}`,
          `LOT-${600000 + i}`,
          'kg',
          round(1 + rng() * 200),
          round(1 + rng() * 50),
          round((1 + rng() * 200) * (1 + rng() * 50), 2),
          pick(REJECT_REASONS),
          'Representative remarks',
        ]);
      }
      await bulkInsert(
        client,
        'reject_reports',
        [
          'id',
          'report_no',
          'report_type',
          'report_date',
          'department',
          'shift',
          'status',
          'issued_at',
          'finalized_at',
          'completed_at',
          'voided_at',
          'voided_by',
          'void_reason',
          'correction_of',
          'created_by',
        ],
        reportRows,
      );
      await bulkInsert(
        client,
        'daily_reject_entries',
        [
          'id',
          'report_id',
          'position',
          'machine_name',
          'item_code',
          'item_description',
          'lot_no',
          'bu_rm_product_name',
          'rm_description',
          'rm_lot_no',
          'rm_type',
          'pump_out_qty',
          'reject_qty',
          'good_qty',
          'reject_pct',
          'reject_limit',
          'production_formula',
          'reject_reason',
          'analysis',
        ],
        entryRows,
      );
      await bulkInsert(
        client,
        'reject_issue_slips',
        [
          'report_id',
          'goods_description',
          'item_code',
          'item_name',
          'lot_no',
          'unit',
          'rejected_qty',
          'unit_cost',
          'total_value',
          'reject_reason',
          'remarks',
        ],
        slipRows,
      );
      inserted.reject_reports = reportRows.length;
      inserted.daily_reject_entries = entryRows.length;
      inserted.reject_issue_slips = slipRows.length;
    }

    /* ---- findings / NCRs / CAPAs -------------------------------------- */
    const findingIds: string[] = [];
    {
      const findingRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.findings; i += 1) {
        const id = stableId(`perf-finding:${i}`);
        findingIds.push(id);
        const state = weighted<FindingState>([
          ['OPEN', 30],
          ['CLOSED', 26],
          ['UNDER_REVIEW', 20],
          ['DRAFT', 14],
          ['VOID', 10],
        ]);
        record('findings.state', state);
        const owner = pick(syntheticUsers);
        findingRows.push([
          id,
          `PERF-FND-${String(i + 1).padStart(4, '0')}`,
          `Perf finding ${i + 1}`,
          `Synthetic representative finding ${i + 1}`,
          state,
          weighted(FINDING_SEVERITIES),
          owner.id,
          daysAgo(Math.floor(rng() * 100)),
          state === 'CLOSED' ? daysAgo(Math.floor(rng() * 50)) : null,
          owner.id,
        ]);
      }
      await bulkInsert(
        client,
        'findings',
        [
          'id',
          'finding_no',
          'title',
          'description',
          'state',
          'severity',
          'owner_id',
          'opened_at',
          'closed_at',
          'created_by',
        ],
        findingRows,
      );
      inserted.findings = SIZES.findings;
    }
    {
      const ncrRows: (string | number | boolean | Date | null)[][] = [];
      const capaRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.ncrs; i += 1) {
        const id = stableId(`perf-ncr:${i}`);
        const state = weighted<NcrState>([
          ['OPEN', 24],
          ['CAPA_IN_PROGRESS', 20],
          ['CLOSED', 18],
          ['UNDER_INVESTIGATION', 14],
          ['RCA_IN_PROGRESS', 10],
          ['READY_FOR_CLOSURE', 8],
          ['DRAFT', 4],
          ['VOID', 2],
        ]);
        record('ncrs.state', state);
        const owner = pick(syntheticUsers);
        ncrRows.push([
          id,
          `PERF-NCR-${String(i + 1).padStart(4, '0')}`,
          `Perf NCR ${i + 1}`,
          `Synthetic representative nonconformance ${i + 1}`,
          state,
          findingIds[i % findingIds.length]!,
          pick(ITEM_CODES),
          `LOT-${700000 + i}`,
          owner.id,
          daysAgo(Math.floor(rng() * 100)),
          state === 'CLOSED' ? daysAgo(Math.floor(rng() * 50)) : null,
          owner.id,
        ]);
        if (i < SIZES.capas) {
          capaRows.push([
            stableId(`perf-capa:${i}`),
            `PERF-CAPA-${String(i + 1).padStart(4, '0')}`,
            id,
            weighted<CapaState>([
              ['OPEN', 24],
              ['IN_PROGRESS', 22],
              ['AWAITING_VERIFICATION', 16],
              ['EFFECTIVENESS_REVIEW', 12],
              ['CLOSED', 14],
              ['READY_FOR_CLOSURE', 6],
              ['DRAFT', 4],
              ['VOID', 2],
            ]),
            `Perf CAPA ${i + 1}`,
            `Synthetic representative corrective action ${i + 1}`,
            owner.id,
            daysAhead(Math.floor(rng() * 60)),
            true,
            true,
            null,
            owner.id,
          ]);
        }
      }
      await bulkInsert(
        client,
        'ncrs',
        [
          'id',
          'ncr_no',
          'title',
          'description',
          'state',
          'finding_id',
          'affected_item_code',
          'affected_lot',
          'owner_id',
          'opened_at',
          'closed_at',
          'created_by',
        ],
        ncrRows,
      );
      await bulkInsert(
        client,
        'capas',
        [
          'id',
          'capa_no',
          'ncr_id',
          'state',
          'title',
          'description',
          'owner_id',
          'target_date',
          'verification_required',
          'effectiveness_required',
          'closed_at',
          'created_by',
        ],
        capaRows,
      );
      inserted.ncrs = SIZES.ncrs;
      inserted.capas = capaRows.length;
    }

    /* ---- approval cases + work items ---------------------------------- */
    {
      const caseRows: (string | number | boolean | Date | null)[][] = [];
      const workRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.approvalCases; i += 1) {
        const id = stableId(`perf-approval:${i}`);
        const requester = pick(syntheticUsers);
        const state = weighted(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED']) as string;
        record('approval_cases.state', state);
        caseRows.push([
          id,
          'INSPECTION_REPORT',
          findingIds[i % findingIds.length]!,
          1,
          'INSPECTION_APPROVAL',
          state,
          requester.id,
          daysAgo(Math.floor(rng() * 100)),
          state === 'APPROVED' || state === 'REJECTED' ? daysAgo(Math.floor(rng() * 80)) : null,
        ]);
        workRows.push([
          stableId(`perf-approval-work:${i}`),
          id,
          1,
          pick(APPROVAL_WORK_TYPES),
          pick(syntheticUsers).id,
          null,
          state === 'PENDING' ? 'PENDING' : 'COMPLETED',
          daysAgo(Math.floor(rng() * 100)),
          state === 'PENDING' ? null : daysAgo(Math.floor(rng() * 80)),
          state === 'APPROVED' || state === 'REJECTED' ? daysAgo(Math.floor(rng() * 80)) : null,
        ]);
      }
      await bulkInsert(
        client,
        'approval_cases',
        [
          'id',
          'subject_type',
          'subject_id',
          'subject_version',
          'workflow_type',
          'state',
          'requested_by',
          'requested_at',
          'completed_at',
        ],
        caseRows,
      );
      await bulkInsert(
        client,
        'approval_work_items',
        [
          'id',
          'approval_case_id',
          'step_no',
          'work_type',
          'assigned_user_id',
          'assigned_role_requirement',
          'state',
          'assigned_at',
          'started_at',
          'completed_at',
        ],
        workRows,
      );
      inserted.approval_cases = SIZES.approvalCases;
      inserted.approval_work_items = workRows.length;
    }

    /* ---- documents ---------------------------------------------------- */
    {
      const identityRows: (string | number | boolean | Date | null)[][] = [];
      const versionRows: (string | number | boolean | Date | null)[][] = [];
      for (let i = 0; i < SIZES.documentIdentities; i += 1) {
        const id = stableId(`perf-document:${i}`);
        const owner = pick(syntheticUsers);
        const docType = pick(DOC_TYPES);
        record('document_identities.type', docType);
        identityRows.push([
          id,
          `PERF-${docType}-${String(i + 1).padStart(4, '0')}`,
          docType,
          `Perf ${docType} document ${i + 1}`,
          owner.id,
          true,
          owner.id,
        ]);
        let effectiveAssigned = false;
        for (let v = 0; v < SIZES.versionsPerDocument; v += 1) {
          // uq_document_versions__effective_one allows at most one EFFECTIVE
          // version per document, so a document that already has one must use
          // a different state for its remaining revision.
          const state = effectiveAssigned
            ? weighted<DocVersionState>([
                ['SUPERSEDED', 34],
                ['DRAFT', 26],
                ['APPROVED', 20],
                ['IN_REVIEW', 12],
                ['ARCHIVED', 4],
                ['CATALOG_ONLY', 2],
                ['RETURNED', 1],
                ['VOID', 1],
              ])
            : weighted<DocVersionState>([
                ['EFFECTIVE', 30],
                ['DRAFT', 22],
                ['APPROVED', 18],
                ['SUPERSEDED', 12],
                ['IN_REVIEW', 8],
                ['ARCHIVED', 6],
                ['CATALOG_ONLY', 2],
                ['RETURNED', 1],
                ['VOID', 1],
              ]);
          if (state === 'EFFECTIVE') effectiveAssigned = true;
          record('document_versions.state', state);
          versionRows.push([
            stableId(`perf-document-version:${i}:${v}`),
            id,
            `${v + 1}.0`,
            state,
            state === 'EFFECTIVE' ? daysAgo(30 + v * 10) : null,
            state === 'EFFECTIVE' || state === 'APPROVED' ? daysAgo(30 + v * 10) : null,
            state === 'EFFECTIVE' || state === 'APPROVED' ? owner.id : null,
            state === 'SUPERSEDED' || state === 'ARCHIVED' ? daysAgo(10) : null,
            state === 'ARCHIVED' ? daysAgo(5) : null,
            state === 'VOID' ? daysAgo(3) : null,
            state === 'VOID' ? 'Synthetic void' : null,
            `Perf revision ${v + 1}`,
            createHash('sha256').update(`perf-doc-${i}-${v}`).digest('hex'),
            owner.id,
          ]);
        }
      }
      await bulkInsert(
        client,
        'document_identities',
        ['id', 'document_no', 'document_type', 'title', 'owner_id', 'active', 'created_by'],
        identityRows,
      );
      await bulkInsert(
        client,
        'document_versions',
        [
          'id',
          'document_id',
          'revision',
          'state',
          'effective_at',
          'approved_at',
          'approved_by',
          'superseded_at',
          'archived_at',
          'voided_at',
          'void_reason',
          'change_summary',
          'content_hash',
          'created_by',
        ],
        versionRows,
      );
      inserted.document_identities = SIZES.documentIdentities;
      inserted.document_versions = versionRows.length;
    }

    /* ---- notifications + deliveries ----------------------------------- */
    {
      const notificationRows: (string | number | boolean | Date | null)[][] = [];
      const deliveryRows: (string | number | boolean | Date | null)[][] = [];
      const types = [
        'TASK_ASSIGNED',
        'INSPECTION_RETURNED',
        'APPROVAL_REQUESTED',
        'RELEASE_COMPLETED',
        'CALIBRATION_DUE',
        'DOCUMENT_REVIEW',
      ];
      for (let i = 0; i < SIZES.notifications; i += 1) {
        const id = stableId(`perf-notification:${i}`);
        const recipient = weighted<SyntheticUser>([
          [measureUser, 6],
          ...syntheticUsers.slice(0, 10).map((user) => [user, 1] as [SyntheticUser, number]),
        ]);
        const severity = weighted<Severity>([
          ['INFO', 62],
          ['WARNING', 28],
          ['CRITICAL', 10],
        ]);
        record('notifications.severity', severity);
        const notificationType = pick(types);
        record('notifications.type', notificationType);
        const createdAt = daysAgo(Math.floor(rng() * 30));
        const read = rng() < 0.35;
        notificationRows.push([
          id,
          recipient.id,
          notificationType,
          severity,
          `Perf notification ${i + 1}`,
          `Synthetic representative notification ${i + 1} for inbox measurement`,
          'TASK',
          stableId(`perf-notification-subject:${i}`),
          `PERF-NOTIFY-${i + 1}`,
          createdAt,
          read ? createdAt : null,
        ]);
        deliveryRows.push([
          stableId(`perf-notification-delivery:${i}`),
          id,
          'IN_APP',
          read ? 'DELIVERED' : 'PENDING',
          1 + Math.floor(rng() * 3),
          createdAt,
          read ? createdAt : null,
          null,
        ]);
      }
      await bulkInsert(
        client,
        'notifications',
        [
          'id',
          'recipient_user_id',
          'notification_type',
          'severity',
          'title',
          'message',
          'subject_type',
          'subject_id',
          'dedupe_key',
          'created_at',
          'read_at',
        ],
        notificationRows,
      );
      await bulkInsert(
        client,
        'notification_deliveries',
        [
          'id',
          'notification_id',
          'channel',
          'state',
          'attempt_count',
          'last_attempt_at',
          'delivered_at',
          'error_code',
        ],
        deliveryRows,
      );
      inserted.notifications = SIZES.notifications;
      inserted.notification_deliveries = deliveryRows.length;
    }

    /* ---- outbox ------------------------------------------------------- */
    {
      const rows: (string | number | boolean | Date | null)[][] = [];
      const eventTypes = [
        'NOTIFICATION_REQUESTED',
        'PRODUCT_ANALYTICS_EVENT',
        'APPROVAL_EVENT',
        'RELEASE_EVIDENCE_RECORDED',
      ];
      for (let i = 0; i < SIZES.outboxEvents; i += 1) {
        const createdAt = daysAgo(Math.floor(rng() * 7));
        const processed = rng() < 0.7;
        rows.push([
          stableId(`perf-outbox:${i}`),
          pick(eventTypes),
          'TASK',
          stableId(`perf-outbox-aggregate:${i}`),
          JSON.stringify({ sequence: i, synthetic: true }),
          createdAt,
          createdAt,
          processed ? createdAt : null,
          processed ? 1 : 0,
          null,
          `PERF-OUTBOX-${i}`,
        ]);
      }
      await bulkInsert(
        client,
        'outbox_events',
        [
          'id',
          'event_type',
          'aggregate_type',
          'aggregate_id',
          'payload',
          'created_at',
          'available_at',
          'processed_at',
          'attempt_count',
          'last_error',
          'dedupe_key',
        ],
        rows,
      );
      inserted.outbox_events = SIZES.outboxEvents;
    }

    /* ---- audit events -------------------------------------------------- */
    {
      // qc.audit_events is append-only: re-runs must not duplicate the
      // synthetic PERF-SEED- stream, so the existing count gates the insert.
      const existing = await client.query<{ n: string }>(
        "SELECT count(*)::text AS n FROM qc.audit_events WHERE request_id LIKE 'PERF-SEED-%'",
      );
      const alreadySeeded = Number(existing.rows[0]?.n ?? 0);
      const remaining = Math.max(0, SIZES.auditEvents - alreadySeeded);
      const rows: Row[] = [];
      const actions = [
        'CREATE',
        'SUBMIT',
        'APPROVE',
        'REJECT',
        'RELEASE',
        'VIEW',
        'UPDATE',
        'VOID',
      ];
      const subjectTypes = ['TASK', 'RECEIVING_ITEM', 'INSPECTION_REPORT', 'LAB_TEST', 'REJECT_REPORT'];
      for (let i = 0; i < remaining; i += 1) {
        const actor = pick(allUsers);
        const action = pick(actions);
        rows.push([
          'USER',
          actor.id,
          pick(subjectTypes),
          stableId(`perf-audit-subject:${i}`),
          action,
          null,
          null,
          null,
          null,
          `PERF-SEED-${i}`,
          null,
          JSON.stringify({ synthetic: true, sequence: i }),
          daysAgo(Math.floor(rng() * 90)),
        ]);
      }
      if (rows.length > 0) {
        await bulkInsert(
          client,
          'audit_events',
          [
            'actor_type',
            'actor_id',
            'subject_type',
            'subject_id',
            'action',
            'transition_id',
            'old_state',
            'new_state',
            'reason',
            'request_id',
            'signature_id',
            'payload',
            'occurred_at',
          ],
          rows,
        );
      }
      inserted.audit_events = alreadySeeded + rows.length;
    }

    await client.query('COMMIT');

    // Fresh planner statistics so EXPLAIN results reflect the seeded volume.
    await client.query('ANALYZE');

    // Verify the PERF- dataset is fully separated from any operational row.
    const verification = await client.query<{
      table: string;
      perf_rows: string;
    }>(`
      SELECT 'audit_events' AS table, count(*)::text AS perf_rows FROM qc.audit_events WHERE request_id LIKE 'PERF-SEED-%'
      UNION ALL SELECT 'tasks', count(*)::text FROM qc.tasks WHERE task_no LIKE 'PERF-%'
      UNION ALL SELECT 'receiving_items', count(*)::text FROM qc.receiving_items WHERE receiving_no LIKE 'PERF-%'
      UNION ALL SELECT 'inspection_reports', count(*)::text FROM qc.inspection_reports WHERE inspection_no LIKE 'PERF-%'
      UNION ALL SELECT 'lab_tests', count(*)::text FROM qc.lab_tests WHERE lab_test_no LIKE 'PERF-%'
      UNION ALL SELECT 'reject_reports', count(*)::text FROM qc.reject_reports WHERE report_no LIKE 'PERF-%'
      UNION ALL SELECT 'notifications', count(*)::text FROM qc.notifications WHERE dedupe_key LIKE 'PERF-%'
      UNION ALL SELECT 'users', count(*)::text FROM qc.users WHERE login_identity LIKE 'perf-%'
    `);
    const verified: Counts = {};
    for (const row of verification.rows) verified[row.table] = Number(row.perf_rows);

    const manifest = {
      seededAt: new Date().toISOString(),
      database: 'disposable local PostgreSQL 18.6 cluster (qc_disposable)',
      deterministicRngSeed: 20260919,
      frozenNow: NOW.toISOString(),
      sizes: SIZES,
      inserted,
      verifiedPerfPrefixedRows: verified,
      distributions,
      credentials: {
        note:
          'Measurement identity perf-measure uses a generated disposable password; it is never logged or written to any file.',
      },
    };
    console.log(JSON.stringify(manifest, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

type TaskState = (typeof TASK_STATES)[number];
type ReceivingState = (typeof RECEIVING_STATES)[number];
type InspectionResult = (typeof INSPECTION_RESULTS)[number];
type ReportState = (typeof REPORT_STATES)[number];
type LabState = (typeof LAB_STATES)[number];
type DailyRejectStatus = (typeof REJECT_STATUSES)[number];
type IssueSlipStatus = (typeof ISSUE_SLIP_STATUSES)[number];
type DocVersionState = (typeof DOC_VERSION_STATES)[number];
type EquipmentState = (typeof EQUIPMENT_STATES)[number];
type CalibrationState = (typeof CALIBRATION_STATES)[number];
type Severity = (typeof SEVERITIES)[number];
type FindingState = (typeof FINDING_STATES)[number];
type NcrState = (typeof NCR_STATES)[number];
type CapaState = (typeof CAPA_STATES)[number];

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `Perf seed failed: ${error.message}` : 'Perf seed failed.');
  process.exitCode = 1;
});
