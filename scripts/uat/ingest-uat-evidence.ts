/**
 * QC-100-FINAL-004 Task 5 — Operator CLI: controlled UAT evidence ingestion.
 *
 * The ONLY authorized write path into `qc.uat_cycles`, `qc.uat_session_evidence`,
 * `qc.uat_defects` and — exclusively inside the acceptance transaction — into
 * `qc.release_gate_evidence(source='SIGNED_UAT_CYCLE')`.
 *
 * Safety properties:
 * - Refuses production-looking DATABASE_URL and requires explicit guards
 *   (NODE_ENV=development|test, QC_SEED_ALLOW_NON_PRODUCTION, QC_UAT_INGEST_ALLOW).
 * - Session/defect CSV rows must match the controlled kit rules used by
 *   `audit/100-percent/uat/validate-uat-records.mjs` (headers, enums, task ids,
 *   timestamps, PASS/FAIL/ACCEPT consistency, release pinning).
 * - Every write is transactional and audited.
 * - Acceptance requires an explicit e-signature id bound to the cycle and a
 *   signer with release authority; without real human sessions the cycle can
 *   never be accepted and the `uat` gate stays UNVERIFIED.
 *
 * Usage:
 *   tsx scripts/uat/ingest-uat-evidence.ts create-cycle --cycle-id UAT-2026-09-19-001 \
 *       --release-id <release_candidates.id> --sha <40-hex> --build-id <id> \
 *       --app-version <v> --migration-head <head> --environment test \
 *       --plan-reference Documents/UAT-ACCEPTANCE-PLAN.md [--in-progress]
 *   tsx scripts/uat/ingest-uat-evidence.ts record-sessions --cycle-id <id> --sessions <csv>
 *   tsx scripts/uat/ingest-uat-evidence.ts record-defects --cycle-id <id> --defects <csv>
 *   tsx scripts/uat/ingest-uat-evidence.ts show --cycle-id <id>
 *   tsx scripts/uat/ingest-uat-evidence.ts accept --cycle-id <id> --outcome ACCEPTED \
 *       --release-row-id <uuid> --release-version 1 --evidence-version 1 \
 *       --request-id <id>  # secrets via QC_UAT_ACCEPT_PASSWORD only
 */
import { readFileSync } from 'node:fs';

import { loadLocalEnv } from '../db/load-local-env.js';
import { uatEvidenceActionDependencies } from '../../src/modules/uat-evidence/application/dependencies.js';
import {
  AUTOMATED_PARTICIPANT_CODE,
  UAT_PARTICIPANT_ROLES,
  type UatDefectInput,
  type UatSessionInput,
} from '../../src/modules/uat-evidence/domain/uat-evidence.js';

// Controlled kit contract (must stay aligned with validate-uat-records.mjs).
const SESSION_HEADER = [
  'session_id',
  'release_sha',
  'environment',
  'participant_role',
  'task_id',
  'start_time',
  'end_time',
  'time_on_task_seconds',
  'task_success',
  'error_count',
  'backtracking_count',
  'failed_navigation_count',
  'form_correction_count',
  'assistance',
  'wrong_action_attempts',
  'confidence_1_to_5',
  'seq_1_to_7',
  'observations',
  'severity',
  'participant_comments',
  'scenario_status',
  'task_accept_reject',
  'evidence_reference',
] as const;
const DEFECT_HEADER = [
  'defect_id',
  'session_id',
  'task_id',
  'severity',
  'title',
  'observed_evidence',
  'expected_business_outcome',
  'actual_business_outcome',
  'request_id_or_ref',
  'status',
] as const;
const KIT_TASK_IDS = new Set([
  ...Array.from({ length: 19 }, (_, index) => `T-UAT-${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, index) => `N-UAT-${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 4 }, (_, index) => `A-UAT-${String(index + 1).padStart(2, '0')}`),
]);
const KIT_ENVIRONMENTS = new Set(['test', 'staging', 'staging-uastest']);
const KIT_SEVERITIES = new Set(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC', 'NONE']);
const KIT_DEFECT_SEVERITIES = new Set(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC']);
const KIT_SCENARIO_STATUSES = new Set([
  'PASS',
  'FAIL',
  'BLOCKED',
  'NOT EXECUTED',
  'NOT APPLICABLE',
]);
const KIT_ACCEPT_REJECT = new Set(['ACCEPT', 'REJECT', 'BLOCKED', 'NOT EXECUTED']);
const KIT_ASSISTANCE = new Set(['none', 'clarification', 'coaching']);
const KIT_DEFECT_STATUSES = new Set([
  'OPEN',
  'ACCEPTED_RISK',
  'FIXED',
  'RETEST_REQUIRED',
  'CLOSED',
]);
const SHA_40 = /^[0-9a-f]{40}$/i;
const INT = /^\d+$/;

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(): void {
  const env = process.env;
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    fail('Refusing UAT ingestion: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing UAT ingestion: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_UAT_INGEST_ALLOW !== 'true') {
    fail('Refusing UAT ingestion: QC_UAT_INGEST_ALLOW=true is required.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) fail('Refusing UAT ingestion: DATABASE_URL is required.');
  const lowered = databaseUrl.toLowerCase();
  const looksProduction =
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'));
  if (looksProduction) fail('Refusing UAT ingestion: DATABASE_URL looks like production.');
}

function parseCsv(text: string, expectedHeader: readonly string[]): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (ch === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (quoted) fail('unterminated quoted CSV field');
  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  if (rows.length === 0) fail('empty CSV: header row is required');
  if (
    rows[0].length !== expectedHeader.length ||
    rows[0].some((value, i) => value !== expectedHeader[i])
  ) {
    fail(`invalid CSV header: expected exactly ${expectedHeader.join(',')}`);
  }
  return rows.slice(1).map((cells, line) => {
    if (cells.length !== expectedHeader.length) {
      fail(`CSV line ${line + 2}: expected ${expectedHeader.length} columns, got ${cells.length}`);
    }
    return Object.fromEntries(expectedHeader.map((column, i) => [column, cells[i]]));
  });
}

function kitParticipantRole(role: string, line: number): string {
  if ((UAT_PARTICIPANT_ROLES as readonly string[]).includes(role)) return role;
  // Automated harness rows keep the dedicated facilitator role + code.
  if (role === 'AUTOMATED_FACILITATOR') return role;
  fail(`CSV line ${line}: participant_role is not controlled`);
}

function parseSessionRow(record: Record<string, string>, line: number): UatSessionInput {
  for (const field of [
    'session_id',
    'release_sha',
    'environment',
    'participant_role',
    'task_id',
    'start_time',
    'end_time',
    'observations',
    'participant_comments',
    'evidence_reference',
  ]) {
    if (!record[field]) fail(`CSV line ${line}: required column ${field} is empty`);
  }
  if (!SHA_40.test(record.release_sha)) {
    fail(`CSV line ${line}: release_sha must be an exact 40-character Git SHA`);
  }
  const pinned = process.env.QC_UAT_PINNED_RELEASE_SHA;
  if (pinned && record.release_sha.toLowerCase() !== pinned.toLowerCase()) {
    fail(`CSV line ${line}: release_sha does not match pinned release`);
  }
  if (!KIT_ENVIRONMENTS.has(record.environment)) {
    fail(`CSV line ${line}: environment is not a UAT environment`);
  }
  if (!KIT_TASK_IDS.has(record.task_id))
    fail(`CSV line ${line}: unknown task_id ${record.task_id}`);
  const startedAt = new Date(record.start_time);
  const endedAt = new Date(record.end_time);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    fail(`CSV line ${line}: start_time/end_time are invalid timestamps`);
  }
  if (endedAt.getTime() < startedAt.getTime()) {
    fail(`CSV line ${line}: end_time is before start_time`);
  }
  const counters: Array<[keyof typeof record, number]> = [
    ['time_on_task_seconds', Number(record.time_on_task_seconds)],
    ['error_count', Number(record.error_count)],
    ['backtracking_count', Number(record.backtracking_count)],
    ['failed_navigation_count', Number(record.failed_navigation_count)],
    ['form_correction_count', Number(record.form_correction_count)],
    ['wrong_action_attempts', Number(record.wrong_action_attempts)],
  ];
  for (const [field, value] of counters) {
    if (!INT.test(record[field])) fail(`CSV line ${line}: ${field} must be a non-negative integer`);
    if (value < 0) fail(`CSV line ${line}: ${field} must be a non-negative integer`);
  }
  if (
    Number(record.time_on_task_seconds) !==
    Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)
  ) {
    fail(`CSV line ${line}: time_on_task_seconds must match start/end timestamps`);
  }
  if (
    !INT.test(record.confidence_1_to_5) ||
    +record.confidence_1_to_5 < 1 ||
    +record.confidence_1_to_5 > 5
  ) {
    fail(`CSV line ${line}: confidence_1_to_5 must be 1..5`);
  }
  if (!INT.test(record.seq_1_to_7) || +record.seq_1_to_7 < 1 || +record.seq_1_to_7 > 7) {
    fail(`CSV line ${line}: seq_1_to_7 must be 1..7`);
  }
  if (!KIT_ASSISTANCE.has(record.assistance))
    fail(`CSV line ${line}: assistance has invalid value`);
  if (!KIT_SEVERITIES.has(record.severity)) fail(`CSV line ${line}: severity has invalid value`);
  if (!KIT_SCENARIO_STATUSES.has(record.scenario_status)) {
    fail(`CSV line ${line}: scenario_status has invalid value`);
  }
  if (!KIT_ACCEPT_REJECT.has(record.task_accept_reject)) {
    fail(`CSV line ${line}: task_accept_reject has invalid value`);
  }
  const taskSuccess = record.task_success === 'yes';
  if (!['yes', 'no'].includes(record.task_success)) {
    fail(`CSV line ${line}: task_success must be yes|no`);
  }
  if (
    record.scenario_status === 'PASS' &&
    (record.task_success !== 'yes' || record.task_accept_reject !== 'ACCEPT')
  ) {
    fail(`CSV line ${line}: PASS requires success=yes and acceptance=ACCEPT`);
  }
  if (record.scenario_status === 'FAIL' && record.task_accept_reject !== 'REJECT') {
    fail(`CSV line ${line}: FAIL requires acceptance=REJECT`);
  }
  if (record.scenario_status === 'BLOCKED' && record.task_accept_reject !== 'BLOCKED') {
    fail(`CSV line ${line}: BLOCKED requires acceptance=BLOCKED`);
  }
  const automated = record.participant_role === 'AUTOMATED_FACILITATOR';
  return {
    sessionId: record.session_id,
    taskId: record.task_id,
    participantRole: automated
      ? 'AUTOMATED_FACILITATOR'
      : kitParticipantRole(record.participant_role, line),
    participantCode: automated
      ? AUTOMATED_PARTICIPANT_CODE
      : record.participant_code || record.session_id,
    startedAt,
    endedAt,
    timeOnTaskSeconds: Number(record.time_on_task_seconds),
    taskSuccess,
    errorCount: Number(record.error_count),
    backtrackingCount: Number(record.backtracking_count),
    failedNavigationCount: Number(record.failed_navigation_count),
    formCorrectionCount: Number(record.form_correction_count),
    assistance: record.assistance as UatSessionInput['assistance'],
    wrongActionAttempts: Number(record.wrong_action_attempts),
    confidence1To5: Number(record.confidence_1_to_5),
    seq1To7: Number(record.seq_1_to_7),
    observations: record.observations,
    severity: record.severity as UatSessionInput['severity'],
    participantComments: record.participant_comments,
    scenarioStatus: record.scenario_status as UatSessionInput['scenarioStatus'],
    taskAcceptReject: record.task_accept_reject as UatSessionInput['taskAcceptReject'],
    evidenceReference: record.evidence_reference,
  };
}

function parseDefectRow(record: Record<string, string>, line: number): UatDefectInput {
  for (const field of [
    'defect_id',
    'session_id',
    'task_id',
    'title',
    'observed_evidence',
    'request_id_or_ref',
  ]) {
    if (!record[field]) fail(`CSV line ${line}: required column ${field} is empty`);
  }
  if (!KIT_DEFECT_SEVERITIES.has(record.severity)) {
    fail(`CSV line ${line}: severity has invalid value`);
  }
  if (!KIT_DEFECT_STATUSES.has(record.status)) fail(`CSV line ${line}: status has invalid value`);
  if (!KIT_TASK_IDS.has(record.task_id))
    fail(`CSV line ${line}: unknown task_id ${record.task_id}`);
  return {
    defectId: record.defect_id,
    sessionId: record.session_id,
    taskId: record.task_id,
    severity: record.severity as UatDefectInput['severity'],
    title: record.title,
    observedEvidence: record.observed_evidence,
    expectedBusinessOutcome: record.expected_business_outcome,
    actualBusinessOutcome: record.actual_business_outcome,
    requestIdOrRef: record.request_id_or_ref,
    status: record.status as UatDefectInput['status'],
  };
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`${flag} requires a value.`);
  return value;
}

async function main(): Promise<void> {
  loadLocalEnv();
  requireGuard();
  const [command, ...rest] = process.argv.slice(2);
  const dependencies = uatEvidenceActionDependencies();
  const cycleId = valueAfter(rest, '--cycle-id');

  if (command === 'create-cycle') {
    const releaseId = valueAfter(rest, '--release-id');
    const gitSha = (valueAfter(rest, '--sha') ?? '').toLowerCase();
    const buildId = valueAfter(rest, '--build-id');
    const applicationVersion = valueAfter(rest, '--app-version');
    const migrationHead = valueAfter(rest, '--migration-head');
    const environment = valueAfter(rest, '--environment');
    const planReference = valueAfter(rest, '--plan-reference');
    const requestId = valueAfter(rest, '--request-id') ?? `uat-ingest-${Date.now()}`;
    if (
      !releaseId ||
      !gitSha ||
      !buildId ||
      !applicationVersion ||
      !migrationHead ||
      !environment ||
      !planReference
    ) {
      fail(
        'create-cycle requires --release-id --sha --build-id --app-version --migration-head --environment --plan-reference',
      );
    }
    if (!SHA_40.test(gitSha)) fail('--sha must be an exact 40-character Git SHA');
    const cycle = await dependencies.createCycle.execute({
      identity: {
        cycleId: cycleId ?? fail('--cycle-id is required'),
        releaseId,
        gitSha,
        buildId,
        applicationVersion,
        migrationHead,
        environment: environment as 'test' | 'staging',
        planReference,
      },
      requestId,
      ...(valueAfter(rest, '--in-progress') === 'true' ? { status: 'IN_PROGRESS' as const } : {}),
    });
    console.log(
      `UAT cycle created: id=${cycle.id} cycleId=${cycle.cycleId} status=${cycle.status} snapshotHash=${cycle.evidenceSnapshotHash}`,
    );
  } else if (command === 'record-sessions') {
    const file = valueAfter(rest, '--sessions');
    if (!cycleId || !file) fail('record-sessions requires --cycle-id and --sessions <csv>');
    const rows = parseCsv(readFileSync(file, 'utf8'), SESSION_HEADER);
    const seen = new Set<string>();
    let recorded = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const session = parseSessionRow(rows[index], index + 2);
      const key = `${session.sessionId}\u0000${session.taskId}`;
      if (seen.has(key)) fail(`CSV line ${index + 2}: duplicate session_id/task_id evidence`);
      seen.add(key);
      await dependencies.recordSession.execute({
        cycleId,
        session,
        requestId: `uat-ingest-${session.sessionId}-${session.taskId}`,
      });
      recorded += 1;
    }
    console.log(`UAT sessions recorded: ${recorded}`);
  } else if (command === 'record-defects') {
    const file = valueAfter(rest, '--defects');
    if (!cycleId || !file) fail('record-defects requires --cycle-id and --defects <csv>');
    const rows = parseCsv(readFileSync(file, 'utf8'), DEFECT_HEADER);
    let recorded = 0;
    for (let index = 0; index < rows.length; index += 1) {
      const defect = parseDefectRow(rows[index], index + 2);
      await dependencies.recordDefect.execute({
        cycleId,
        defect,
        requestId: `uat-ingest-defect-${defect.defectId}`,
      });
      recorded += 1;
    }
    console.log(`UAT defects recorded: ${recorded}`);
  } else if (command === 'show') {
    if (!cycleId) fail('show requires --cycle-id');
    const evidence = await dependencies.getEvidence.execute({
      actor: {
        id: 'system-read-model',
        loginIdentity: 'system',
        accountState: 'ACTIVE',
        roles: ['SYSTEM_OWNER'],
        permissions: [
          { code: 'PERM-RPT-VIEW', scopes: ['GLOBAL'], active: true },
          { code: 'PERM-APR-APPROVE', scopes: ['GLOBAL'], active: true },
        ],
      },
      cycleId,
    });
    console.log(
      JSON.stringify(
        {
          cycle: evidence.cycle,
          summary: evidence.summary,
          releaseGateStatus: evidence.releaseGateStatus,
          sessions: evidence.sessions.length,
          defects: evidence.defects.length,
        },
        null,
        2,
      ),
    );
  } else if (command === 'accept') {
    const outcome = valueAfter(rest, '--outcome');
    const releaseRowId = valueAfter(rest, '--release-row-id');
    const releaseVersion = valueAfter(rest, '--release-version');
    const evidenceVersion = valueAfter(rest, '--evidence-version');
    const requestId = valueAfter(rest, '--request-id');
    const secret = process.env.QC_UAT_ACCEPT_PASSWORD;
    const signerIdentity = process.env.QC_UAT_ACCEPT_SIGNER_IDENTITY ?? 'yazeed';
    if (
      !cycleId ||
      !outcome ||
      !releaseRowId ||
      !releaseVersion ||
      !evidenceVersion ||
      !requestId
    ) {
      fail(
        'accept requires --cycle-id --outcome --release-row-id --release-version --evidence-version --request-id',
      );
    }
    if (!['ACCEPTED', 'REJECTED', 'BLOCKED'].includes(outcome)) fail('--outcome is not controlled');
    if (!secret) fail('QC_UAT_ACCEPT_PASSWORD is required for the reauthentication ceremony.');
    // Resolve the signer server-side; identity never comes from the command line.
    const { identityDependencies, resolveActor } =
      await import('../../src/modules/identity/application/identity-dependencies.js');
    const { getDatabase } = await import('../../src/shared/database/database.js');
    const identity = identityDependencies(getDatabase());
    const user = await identity.users.findByLoginIdentity(signerIdentity);
    if (!user) fail('Signer account was not found.');
    const actor = await resolveActor(getDatabase(), user.id);
    if (!actor) fail('Signer authorization could not be resolved.');
    const result = await dependencies.acceptCycle.execute({
      actor,
      signer: {
        id: user.id,
        loginIdentity: user.loginIdentity,
        accountState: user.accountState,
        roles: actor.roles,
      },
      cycleId,
      outcome: outcome as 'ACCEPTED' | 'REJECTED' | 'BLOCKED',
      releaseRowId,
      releaseVersion: BigInt(releaseVersion),
      evidenceVersion: BigInt(evidenceVersion),
      reauthenticationSecret: secret,
      requestId,
    });
    console.log(
      `UAT acceptance recorded: acceptanceId=${result.acceptanceId} outcome=${result.outcome} signatureId=${result.signatureId}`,
    );
    if (outcome === 'ACCEPTED') {
      console.log(
        'release_gate_evidence(uat, SIGNED_UAT_CYCLE) committed inside the acceptance transaction.',
      );
    } else {
      console.log('No gate evidence written: only ACCEPTED outcomes feed the uat release gate.');
    }
  } else {
    fail('Unknown command. Use create-cycle | record-sessions | record-defects | show | accept.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'UAT ingestion failed.');
    process.exit(1);
  });
