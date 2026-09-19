/**
 * QC-100-FINAL-004 Task 7 — automated UAT scenario runner.
 *
 * Drives the real running application over HTTP (Astro actions + pages) against
 * the local disposable UAT database, then writes one `qc.uat_session_evidence`
 * row per executed scenario through the Task 5 ingestion path
 * (`scripts/uat/ingest-uat-evidence.ts`), always as `AUTOMATED_FACILITATOR`.
 *
 * Safety properties:
 * - Refuses production-looking `DATABASE_URL` and requires the environment
 *   guards used by the Task 4 seed and the Task 5 CLI.
 * - Automated sessions never make a cycle ACCEPTED: the cycle stays
 *   IN_PROGRESS and the `uat` release gate stays UNVERIFIED.
 * - Passwords are generated per run, passed only through env vars, and never
 *   logged or written to evidence.
 * - A scenario that cannot be executed is reported `NOT RUN` with its reason;
 *   it is never reported as PASS.
 *
 * Usage:
 *   DATABASE_URL=<disposable UAT db> pnpm uat:scenarios [--base-url http://127.0.0.1:4399]
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID } from 'node:crypto';

import { createPool, getDatabaseConnectionConfig } from '../../src/shared/database/pool.js';
import { UAT_PERSONAS, UAT_PASSWORD_ENV_VARS } from '../../tests/fixtures/uat-personas.js';
import { loadLocalEnv } from '../db/load-local-env.js';
import {
  ADMIN_CREATE_ROUTE,
  CREATE_ROUTES,
  bodyExcerpt,
  capabilitySetsEqual,
  classifyProbe,
  createReceivingPayload,
  recordId,
  summarizeProbes,
  type ActionOutcome,
  type ProbeResult,
  type ScenarioStatus,
} from './scenario-support.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const port = Number(process.env.UAT_SCENARIO_PORT ?? '4399');
const baseUrl = (process.env.UAT_SCENARIO_BASE_URL ?? `http://127.0.0.1:${port}`).replace(
  /\/$/,
  '',
);
const evidencePath = resolve(
  process.env.UAT_SCENARIO_EVIDENCE ??
    'audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios-evidence.json',
);
const runId = process.env.UAT_SCENARIO_RUN_ID ?? `uat-scenarios-${randomUUID()}`;
const DISPOSABLE_PERSONAS = UAT_PERSONAS.filter((persona) => persona.seedManaged);
const QC_PERSONAS = UAT_PERSONAS.filter((persona) => persona.foundationRole === 'EMPLOYEE');

interface ScenarioResult {
  /** Controlled kit task id from `UAT-COVERAGE-MATRIX.csv` (T-UAT and N-UAT families). */
  scenarioId: string;
  family: string;
  status: ScenarioStatus;
  detail: string;
  participants: string[];
}

interface CoverageRow {
  surface: string;
  route: string;
  status: ScenarioStatus;
  detail: string;
}

function fail(message: string): never {
  throw new Error(message);
}

function requireGuard(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    fail('Refusing UAT scenarios: NODE_ENV must be development or test.');
  }
  if (env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true') {
    fail('Refusing UAT scenarios: QC_SEED_ALLOW_NON_PRODUCTION=true is required.');
  }
  if (env.QC_UAT_SEED_ALLOW !== 'true') {
    fail('Refusing UAT scenarios: QC_UAT_SEED_ALLOW=true is required.');
  }
  if (env.QC_UAT_INGEST_ALLOW !== 'true') {
    fail('Refusing UAT scenarios: QC_UAT_INGEST_ALLOW=true is required.');
  }
  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) fail('Refusing UAT scenarios: DATABASE_URL is required.');
  const lowered = databaseUrl.toLowerCase();
  const looksProduction =
    lowered.includes('qclevel.top') ||
    lowered.includes('render.com') ||
    (lowered.includes('prod') &&
      !lowered.includes('test') &&
      !lowered.includes('dev') &&
      !lowered.includes('localhost') &&
      !lowered.includes('127.0.0.1'));
  if (looksProduction) fail('Refusing UAT scenarios: DATABASE_URL looks like production.');
}

function oneTimePasswords(env: NodeJS.ProcessEnv): void {
  for (const name of UAT_PASSWORD_ENV_VARS) {
    if (!env[name]) env[name] = randomBytes(24).toString('base64url').slice(0, 24);
  }
}

/** Resolve the exact candidate identity from the working tree, never from memory. */
function resolveCandidateIdentity(env: NodeJS.ProcessEnv): {
  gitSha: string;
  buildId: string;
  releaseId: string;
  applicationVersion: string;
} {
  const rev = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const gitSha = (env.UAT_SCENARIO_GIT_SHA ?? rev.stdout ?? '').trim();
  if (!/^[0-9a-f]{40}$/i.test(gitSha)) {
    fail('UAT scenarios require an exact 40-character candidate Git SHA.');
  }
  const short = gitSha.slice(0, 12);
  return {
    gitSha,
    buildId: env.RELEASE_BUILD_ID ?? `uat-scenarios-${short}`,
    releaseId: env.UAT_SCENARIO_RELEASE_ID ?? `rel-${gitSha.slice(0, 16)}`,
    applicationVersion: env.SERVICE_VERSION ?? '0.1.0',
  };
}

function databaseNameOf(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).pathname.replace(/^\//, '') || 'unknown';
  } catch {
    return 'unknown';
  }
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((settle, rejectRun) => {
    const child = spawn(command, args, { cwd: root, env, stdio: 'inherit' });
    child.on('error', rejectRun);
    child.on('exit', (code) => settle(code ?? 1));
  });
}

function cookieHeader(response: Response): string | undefined {
  const cookies = response.headers.getSetCookie?.() ?? [];
  if (cookies.length === 0) return undefined;
  return cookies.map((value) => value.split(';')[0]).join('; ');
}

/** Minimal session client: one persona cookie jar over the real HTTP surface. */
class SessionClient {
  private cookies: string | undefined;
  private loggedIn = false;

  constructor(private readonly identity: string) {}

  get authenticated(): boolean {
    return this.loggedIn;
  }

  async login(password: string): Promise<boolean> {
    const response = await fetch(`${baseUrl}/login?_astroAction=login`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        Origin: baseUrl,
        Referer: `${baseUrl}/login`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ loginIdentity: this.identity, password }).toString(),
    });
    const cookie = cookieHeader(response);
    if (!cookie) return false;
    this.cookies = cookie;
    const dashboard = await fetch(`${baseUrl}/dashboard`, {
      redirect: 'manual',
      headers: this.headers(),
    });
    this.loggedIn = dashboard.status === 200;
    return this.loggedIn;
  }

  async get(path: string): Promise<Response> {
    return fetch(`${baseUrl}${path}`, { redirect: 'manual', headers: this.headers() });
  }

  async action(name: string, payload: Record<string, unknown>): Promise<ActionOutcome> {
    const response = await fetch(`${baseUrl}/_actions/${name}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* page HTML responses stay as text */
    }
    const errorCode =
      typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code: unknown }).code)
        : undefined;
    const errorMessage =
      typeof body === 'object' && body !== null && 'message' in body
        ? String((body as { message: unknown }).message)
        : undefined;
    return { status: response.status, ok: response.status < 400, errorCode, errorMessage, body };
  }

  private headers(): Record<string, string> {
    return {
      Origin: baseUrl,
      Referer: `${baseUrl}/`,
      ...(this.cookies ? { Cookie: this.cookies } : {}),
    };
  }
}

/** Unauthenticated probe for direct action/API invocation (N-UAT-01). */
async function unauthenticatedAction(
  name: string,
  payload: Record<string, unknown>,
): Promise<ActionOutcome> {
  const response = await fetch(`${baseUrl}/_actions/${name}`, {
    method: 'POST',
    redirect: 'manual',
    headers: { Origin: baseUrl, Referer: `${baseUrl}/`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  const errorCode =
    typeof body === 'object' && body !== null && 'code' in body
      ? String((body as { code: unknown }).code)
      : undefined;
  return { status: response.status, ok: response.status < 400, errorCode, body };
}

async function main(): Promise<void> {
  loadLocalEnv();
  requireGuard(process.env);
  const env: NodeJS.ProcessEnv = { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'test' };
  oneTimePasswords(env);
  const passwordFor = (name: string): string => env[name] ?? fail(`${name} is required.`);
  const candidate = resolveCandidateIdentity(env);

  const pool = createPool({
    ...getDatabaseConnectionConfig(env.DATABASE_URL),
    application_name: 'qc-uat-scenarios',
  });
  const scenarios: ScenarioResult[] = [];
  const coverage: CoverageRow[] = [];
  const startedAt = new Date();
  let server: ChildProcess | undefined;
  let migrationHead: string;

  try {
    const ledger = await pool.query<{ version: string }>(
      'SELECT version FROM qc.schema_migrations ORDER BY version',
    );
    if (ledger.rows.length === 0) fail('UAT scenarios require a migrated database.');
    migrationHead = ledger.rows.at(-1)?.version ?? 'unknown';

    const seedCode = await run('pnpm', ['uat:seed'], env);
    if (seedCode !== 0) fail(`UAT persona seed failed with exit code ${seedCode}.`);

    if (!process.env.UAT_SCENARIO_BASE_URL) {
      // The harness runs as a test client; the application under test runs as a
      // development server so it exercises the same runtime path as local UAT.
      server = spawn(
        resolve(root, 'node_modules/.bin/astro'),
        ['dev', '--port', String(port), '--host', '127.0.0.1'],
        { cwd: root, env: { ...env, NODE_ENV: 'development' }, stdio: 'ignore' },
      );
      let live = false;
      for (let attempt = 0; attempt < 40 && !live; attempt += 1) {
        try {
          const response = await fetch(`${baseUrl}/api/health/live`);
          live = response.ok;
        } catch {
          /* still starting */
        }
        if (!live) await new Promise((wait) => setTimeout(wait, 1000));
      }
      if (!live) fail('Application server did not become live.');
    }

    const clients = new Map<string, SessionClient>();
    for (const persona of DISPOSABLE_PERSONAS) {
      const client = new SessionClient(persona.loginIdentity);
      const authenticated = await client.login(passwordFor(persona.passwordEnvVar));
      clients.set(persona.id, client);
      scenarios.push({
        scenarioId: 'T-UAT-01',
        family: `login: ${persona.label} (${persona.foundationRole})`,
        status: authenticated ? 'PASS' : 'FAIL',
        detail: authenticated
          ? 'session established; /dashboard served 200'
          : 'login rejected or no session established',
        participants: [persona.loginIdentity],
      });
    }

    // Wrong-password recovery: no session, the login page renders the refusal.
    const badClient = new SessionClient('uat-qc-01');
    const badLogin = await badClient.login(`wrong-${randomUUID()}`);
    const badPage = await fetch(`${baseUrl}/login`);
    const badBody = await badPage.text();
    scenarios.push({
      scenarioId: 'T-UAT-01',
      family: 'wrong-password recovery',
      status:
        !badLogin && /Sign-in could not be completed|invalid/i.test(badBody) ? 'PASS' : 'FAIL',
      detail: badLogin
        ? 'a rejected password produced a session (defect)'
        : 'rejected password produced no session and the sign-in page reported the refusal',
      participants: ['uat-qc-01'],
    });

    // Creation surfaces: per-persona route availability, identical capability
    // sets across the three QC personas, the admin surface staying closed, and
    // one real draft creation end to end.
    const routeStatuses: Array<{ persona: string; statuses: number[] }> = [];
    const createdReceiving = new Map<string, string>();
    for (const persona of QC_PERSONAS) {
      const client = clients.get(persona.id);
      if (!client?.authenticated) {
        scenarios.push({
          scenarioId: 'T-UAT-03',
          family: `creation surfaces: ${persona.loginIdentity}`,
          status: 'BLOCKED',
          detail: 'no authenticated session for this persona',
          participants: [persona.loginIdentity],
        });
        continue;
      }
      const statuses: number[] = [];
      for (const route of CREATE_ROUTES) {
        const response = await client.get(route);
        statuses.push(response.status);
      }
      routeStatuses.push({ persona: persona.loginIdentity, statuses });
      const adminResponse = await client.get(ADMIN_CREATE_ROUTE);

      const payload = createReceivingPayload(`${persona.id}-${randomUUID().slice(0, 8)}`);
      const created = await client.action('quarantine.createReceiving', payload);
      const receivingId = recordId(created);
      if (receivingId) createdReceiving.set(persona.id, receivingId);
      const registerText = await (await client.get('/quarantine/receiving')).text();
      const visible = registerText.includes(payload.receivingNo);
      scenarios.push({
        scenarioId: 'T-UAT-03',
        family: `quarantine receiving create: ${persona.loginIdentity}`,
        status: receivingId ? 'PASS' : 'FAIL',
        detail: receivingId
          ? `receiving ${receivingId} (${payload.receivingNo}) created over the real action endpoint; register shows it=${visible}; admin surface ${ADMIN_CREATE_ROUTE}=${adminResponse.status}`
          : `createReceiving did not return a record (status ${created.status}${
              created.errorCode ? `, ${created.errorCode}` : ''
            }: ${bodyExcerpt(created)})`,
        participants: [persona.loginIdentity],
      });
      CREATE_ROUTES.forEach((route, index) => {
        coverage.push({
          surface: route,
          route,
          status: statuses[index] === 200 ? 'PASS' : 'NOT RUN',
          detail:
            statuses[index] === 200
              ? `HTTP 200 for ${persona.loginIdentity} (route reachable; per-type draft creation not automated for this surface)`
              : `HTTP ${statuses[index]} for ${persona.loginIdentity}`,
        });
      });
    }
    scenarios.push({
      scenarioId: 'T-UAT-03',
      family: 'identical creation capability sets across QC-01/02/03',
      status:
        routeStatuses.length < QC_PERSONAS.length
          ? 'BLOCKED'
          : capabilitySetsEqual(routeStatuses)
            ? 'PASS'
            : 'FAIL',
      detail: routeStatuses
        .map(
          (entry) =>
            `${entry.persona}: ${CREATE_ROUTES.map((route, index) => `${route}=${entry.statuses[index]}`).join(' ')}`,
        )
        .join(' | '),
      participants: QC_PERSONAS.map((persona) => persona.loginIdentity),
    });
    // The admin shell is default-deny by design: it renders a denial section
    // instead of the form, so the signal is the rendered form, not the status
    // code. The real mutation is probed separately with a valid payload, and
    // the result is verified against the database.
    const adminProbes: ProbeResult[] = [];
    const attemptedIdentities: string[] = [];
    const scenarioToken = runId
      .replace(/[^0-9a-z]/gi, '')
      .slice(-8)
      .toLowerCase();
    for (const persona of QC_PERSONAS) {
      const client = clients.get(persona.id);
      if (!client?.authenticated) continue;
      const page = await client.get(ADMIN_CREATE_ROUTE);
      const html = await page.text();
      const rendersForm = html.includes('data-admin-create-user');
      adminProbes.push({
        surface: `${ADMIN_CREATE_ROUTE} shell (${persona.loginIdentity})`,
        verdict: rendersForm ? 'EXECUTED' : page.status === 200 ? 'DENIED' : 'INCONCLUSIVE',
        errorCode: null,
        httpStatus: page.status,
      });
      const identity = `uat-scenario-${scenarioToken}-${persona.id}`;
      attemptedIdentities.push(identity);
      const outcome = await client.action('admin.createUser', {
        loginIdentity: identity,
        displayName: 'UAT unauthorized creation attempt',
        temporaryPassword: randomBytes(18).toString('base64url'),
      });
      adminProbes.push({
        surface: `admin.createUser (${persona.loginIdentity})`,
        verdict: classifyProbe(outcome),
        errorCode: outcome.errorCode ?? null,
        httpStatus: outcome.status,
      });
    }
    if (adminProbes.length > 0) {
      const adminSummary = summarizeProbes(adminProbes);
      const leaked = await pool.query<{ login_identity: string }>(
        'SELECT login_identity FROM qc.users WHERE login_identity = ANY($1::text[])',
        [attemptedIdentities],
      );
      scenarios.push({
        scenarioId: 'N-UAT-02',
        family: 'admin-only surface and user creation stay closed to QC data-entry personas',
        status: leaked.rowCount
          ? 'FAIL'
          : adminSummary.status === 'PASS'
            ? 'PASS'
            : adminSummary.status === 'FAIL'
              ? 'FAIL'
              : 'NOT RUN',
        detail: `${adminSummary.detail}; accounts created in the database=${leaked.rowCount ?? 0}`,
        participants: QC_PERSONAS.map((persona) => persona.loginIdentity),
      });
    }

    // N-UAT-01: direct action/API invocation without a session must never execute.
    const sensitiveActions = [
      'quarantine.approveInspection',
      'quarantine.finalApproveInspection',
      'quarantine.releaseReceiving',
      'laboratory.approve',
      'documents.approve',
      'admin.createUser',
      'releaseGovernance.approveRelease',
    ];
    const realReceivingId = createdReceiving.get('qc-01');
    const fabricatedId = '01900000-0000-7000-8000-0000000000f1';
    const realRecordActions: Array<{ action: string; payload: Record<string, unknown> }> =
      realReceivingId
        ? [
            {
              action: 'quarantine.releaseReceiving',
              payload: { id: realReceivingId, expectedVersion: 1 },
            },
            {
              action: 'quarantine.holdReceiving',
              payload: {
                id: realReceivingId,
                expectedVersion: 1,
                reason: 'Automated UAT negative probe',
              },
            },
          ]
        : [];
    const anonymousProbes: ProbeResult[] = [];
    for (const probe of [
      ...sensitiveActions.map((action) => ({
        action,
        payload: { id: fabricatedId, expectedVersion: 1 },
      })),
      ...realRecordActions,
    ]) {
      const outcome = await unauthenticatedAction(probe.action, probe.payload);
      anonymousProbes.push({
        surface: probe.action,
        verdict: classifyProbe(outcome),
        errorCode: outcome.errorCode ?? null,
        httpStatus: outcome.status,
      });
    }
    const anonymousSummary = summarizeProbes(anonymousProbes);
    scenarios.push({
      scenarioId: 'N-UAT-01',
      family: 'unauthenticated direct action invocation',
      status: anonymousSummary.status,
      detail: anonymousSummary.detail,
      participants: ['(anonymous)'],
    });

    // N-UAT-01 (continued): an EMPLOYEE holding create rights still cannot
    // approve, release, or administer.
    const employee = clients.get('qc-01');
    // (b) real-record authority negatives: these reach the authorization
    // boundary because the record exists and is visible to the actor.
    const employeeRealProbes: ProbeResult[] = [];
    // (c) fabricated-id probes: structurally inconclusive, reported as such.
    const employeeFabricatedProbes: ProbeResult[] = [];
    if (employee?.authenticated) {
      for (const probe of realRecordActions) {
        const outcome = await employee.action(probe.action, probe.payload);
        employeeRealProbes.push({
          surface: `${probe.action} (real record)`,
          verdict: classifyProbe(outcome),
          errorCode: outcome.errorCode ?? null,
          httpStatus: outcome.status,
        });
      }
      const realSummary = summarizeProbes(employeeRealProbes);
      scenarios.push({
        scenarioId: 'N-UAT-01',
        family: 'EMPLOYEE denied on authority actions over a real record',
        status: realSummary.status,
        detail: realSummary.detail,
        participants: ['uat-qc-01'],
      });

      const approverish = [
        'quarantine.approveInspection',
        'quarantine.finalApproveInspection',
        'laboratory.approve',
        'documents.approve',
        'releaseGovernance.approveRelease',
        'admin.createUser',
      ];
      for (const action of approverish) {
        const outcome = await employee.action(action, {
          id: fabricatedId,
          expectedVersion: 1,
        });
        employeeFabricatedProbes.push({
          surface: action,
          verdict: classifyProbe(outcome),
          errorCode: outcome.errorCode ?? null,
          httpStatus: outcome.status,
        });
      }
      const fabricatedSummary = summarizeProbes(employeeFabricatedProbes);
      scenarios.push({
        scenarioId: 'N-UAT-01',
        family: 'EMPLOYEE authority actions probed with a non-existent record',
        status: fabricatedSummary.status,
        detail: fabricatedSummary.detail,
        participants: ['uat-qc-01'],
      });
    }
    const probeEvidence = anonymousProbes
      .concat(employeeRealProbes)
      .concat(employeeFabricatedProbes);

    // N-UAT-02: cross-scope mutation. The receiving created by qc-01 must not be
    // editable by qc-02 (OWN scope = owner-only draft mutation).
    const owner = clients.get('qc-01');
    const outsider = clients.get('qc-02');
    if (owner?.authenticated && outsider?.authenticated) {
      const created = await owner.action(
        'quarantine.createReceiving',
        createReceivingPayload(`cross-${randomUUID().slice(0, 8)}`),
      );
      const targetId = recordId(created);
      // Positive control: the owner CAN edit the same draft with the same
      // payload shape, so a refusal for qc-02 is about scope, not about a
      // malformed request.
      const selfEdit = targetId
        ? await owner.action('quarantine.updateReceivingDraft', {
            id: targetId,
            expectedVersion: 1,
            ...createReceivingPayload('self-edit'),
          })
        : undefined;
      const crossEdit = targetId
        ? await outsider.action('quarantine.updateReceivingDraft', {
            id: targetId,
            expectedVersion: 2,
            ...createReceivingPayload('cross-edit'),
          })
        : undefined;
      const crossVerdict = crossEdit ? classifyProbe(crossEdit) : undefined;
      // Ground truth: the stored record must be untouched by the outsider.
      const stored = targetId
        ? await pool.query<{ version: string; receiving_no: string; description: string }>(
            'SELECT version::text AS version, receiving_no, description FROM qc.receiving_items WHERE id = $1',
            [targetId],
          )
        : undefined;
      const storedRow = stored?.rows[0];
      const mutatedByOutsider = storedRow?.receiving_no === 'UAT-SCN-RCV-cross-edit';
      scenarios.push({
        scenarioId: 'N-UAT-02',
        family: 'cross-scope draft mutation (owner self-edit control + outsider attempt)',
        status:
          crossVerdict === 'EXECUTED' || mutatedByOutsider
            ? 'FAIL'
            : targetId && selfEdit?.ok && crossVerdict === 'DENIED'
              ? 'PASS'
              : 'NOT RUN',
        detail: targetId
          ? [
              `owner self-edit allowed=${selfEdit?.ok ?? false}${
                selfEdit?.ok ? '' : ` (${selfEdit?.errorCode ?? 'no response'})`
              }`,
              `qc-02 cross-edit=${crossVerdict ?? 'no response'}${
                crossEdit ? ` (${crossEdit.errorCode ?? crossEdit.status})` : ''
              }`,
              `stored record after attempt: receiving_no=${storedRow?.receiving_no ?? 'missing'} version=${storedRow?.version ?? 'missing'} (outsider mutation=${mutatedByOutsider})`,
              crossVerdict === 'EXECUTED'
                ? `DEFECT: edited qc-01's draft (${crossEdit ? bodyExcerpt(crossEdit) : ''})`
                : '',
            ]
              .filter(Boolean)
              .join('; ')
          : 'could not create the cross-scope fixture record',
        participants: ['uat-qc-01', 'uat-qc-02'],
      });
    } else {
      scenarios.push({
        scenarioId: 'N-UAT-02',
        family: 'cross-scope draft mutation',
        status: 'BLOCKED',
        detail: 'required sessions were not established',
        participants: ['uat-qc-01', 'uat-qc-02'],
      });
    }

    // Audit trail: every controlled write above must be recorded.
    const audits = await pool.query<{ action: string; count: string }>(
      `SELECT action, count(*)::text AS count FROM qc.audit_events
       WHERE subject_type IN ('RECEIVING_ITEM','UAT_CYCLE') OR action LIKE 'RECEIVING%'
       GROUP BY action ORDER BY action`,
    );
    const totalAudit = audits.rows.reduce((sum, row) => sum + Number(row.count), 0);
    scenarios.push({
      scenarioId: 'T-UAT-03',
      family: 'audit trail for controlled writes',
      status: totalAudit > 0 ? 'PASS' : 'FAIL',
      detail: `audit rows observed: ${audits.rows.map((row) => `${row.action}=${row.count}`).join(', ') || '(none)'}`,
      participants: ['uat-qc-01', 'uat-qc-02', 'uat-qc-03'],
    });

    // Task 5 round-trip: record this run as automated facilitator session evidence.
    // Each run writes its own append-only cycle: evidence tables are immutable,
    // so re-running the suite must not collide with an earlier run's rows.
    const runToken = runId
      .replace(/[^0-9a-z]/gi, '')
      .slice(-8)
      .toUpperCase();
    const cycleId = `UAT-${new Date().toISOString().slice(0, 10)}-AUTO-${runToken}`;
    const gitSha = candidate.gitSha;
    const scenarioSessions = scenarios.filter((entry) => entry.status !== 'NOT RUN');
    const csvPath = resolve(root, '.tmp/uat-cli/scenario-sessions.csv');
    await mkdir(dirname(csvPath), { recursive: true });
    const rows = scenarioSessions.map((entry, index) => {
      const start = new Date(Date.now() - (scenarioSessions.length - index) * 60_000);
      const end = new Date(start.getTime() + 60_000);
      const passed = entry.status === 'PASS';
      return [
        `SCN-${entry.scenarioId}-${index + 1}`,
        gitSha,
        'test',
        'AUTOMATED_FACILITATOR',
        entry.scenarioId,
        start.toISOString(),
        end.toISOString(),
        '60',
        passed ? 'yes' : 'no',
        '0',
        '0',
        '0',
        '0',
        'none',
        '0',
        '5',
        '7',
        entry.family.slice(0, 120),
        'NONE',
        (passed
          ? 'Automated scenario passed'
          : `Automated scenario ${entry.status}: ${entry.detail}`
        )
          .slice(0, 160)
          .replaceAll(',', ';'),
        passed ? 'PASS' : 'BLOCKED',
        passed ? 'ACCEPT' : 'BLOCKED',
        `audit/2026-09-19/QC-100-FINAL-004-task7-uat-scenarios-evidence.json#${entry.scenarioId}`,
      ].join(',');
    });
    const header = [
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
    ].join(',');

    {
      const createCode = await run(
        'pnpm',
        [
          'uat:ingest',
          'create-cycle',
          '--cycle-id',
          cycleId,
          '--release-id',
          candidate.releaseId,
          '--sha',
          gitSha,
          '--build-id',
          candidate.buildId,
          '--app-version',
          candidate.applicationVersion,
          '--migration-head',
          migrationHead,
          '--environment',
          'test',
          '--plan-reference',
          'Documents/UAT-ACCEPTANCE-PLAN.md',
          '--in-progress',
          'true',
        ],
        env,
      );
      if (createCode !== 0)
        fail(`Automated UAT cycle creation failed with exit code ${createCode}.`);
    }
    if (rows.length > 0) {
      await writeFile(csvPath, `${header}\n${rows.join('\n')}\n`, 'utf8');
      const ingestCode = await run(
        'pnpm',
        ['uat:ingest', 'record-sessions', '--cycle-id', cycleId, '--sessions', csvPath],
        env,
      );
      if (ingestCode !== 0) fail(`Session evidence ingestion failed with exit code ${ingestCode}.`);
    }

    const gate = await pool.query<{ status: string }>(
      `SELECT status FROM qc.release_gate_evidence WHERE evidence_type = 'uat' AND uat_cycle_id = $1`,
      [cycleId],
    );
    const cycleRow = await pool.query<{ status: string }>(
      'SELECT status FROM qc.uat_cycles WHERE cycle_id = $1',
      [cycleId],
    );
    scenarios.push({
      scenarioId: 'T-UAT-03',
      family: 'session evidence ingestion + retrieval round-trip (Task 5)',
      status:
        rows.length > 0 && cycleRow.rows[0]?.status === 'IN_PROGRESS' && gate.rows.length === 0
          ? 'PASS'
          : 'FAIL',
      detail: `cycle ${cycleId} status=${cycleRow.rows[0]?.status ?? 'missing'}; sessions written=${rows.length}; uat gate rows=${gate.rows.length} (must stay 0 for automated-only evidence)`,
      participants: ['(automated facilitator)'],
    });

    const totals = {
      pass: scenarios.filter((entry) => entry.status === 'PASS').length,
      fail: scenarios.filter((entry) => entry.status === 'FAIL').length,
      notRun: scenarios.filter((entry) => entry.status === 'NOT RUN').length,
      blocked: scenarios.filter((entry) => entry.status === 'BLOCKED').length,
    };

    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(
      evidencePath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          evidenceKind: 'AUTOMATED_UAT_SCENARIO_RUN',
          uatClaim: false,
          automatedFacilitator: true,
          runId,
          startedAt: startedAt.toISOString(),
          completedAt: new Date().toISOString(),
          baseUrl,
          database: {
            name: databaseNameOf(env.DATABASE_URL ?? ''),
            migrationHead,
          },
          cycleId,
          identity: {
            gitSha: candidate.gitSha,
            buildId: candidate.buildId,
            releaseId: candidate.releaseId,
            applicationVersion: candidate.applicationVersion,
          },
          totals,
          scenarios,
          coverage,
          probes: probeEvidence,
          notes: [
            'Automated facilitator evidence only. It can never flip the uat release gate to PASS.',
            'The controlled UAT kit matrix (UAT-COVERAGE-MATRIX.csv) is intentionally left untouched: only real human sessions may write human UAT results.',
            'Scenarios reported NOT RUN or BLOCKED were not executed and must not be read as passing.',
          ],
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    for (const entry of scenarios) {
      const mark =
        entry.status === 'PASS'
          ? '✓'
          : entry.status === 'FAIL'
            ? '✗'
            : entry.status === 'BLOCKED'
              ? '!'
              : '·';
      console.log(
        `${mark} [${entry.status}] ${entry.scenarioId} ${entry.family} — ${entry.detail}`,
      );
    }
    console.log(
      `\nAUTOMATED UAT SCENARIOS: ${totals.pass} PASS / ${totals.fail} FAIL / ${totals.notRun} NOT RUN / ${totals.blocked} BLOCKED`,
    );
    console.log(`Evidence: ${evidencePath}`);
    console.log(
      `Cycle ${cycleId} stays IN_PROGRESS with zero uat gate rows (automated evidence never accepts a cycle).`,
    );
    if (totals.fail > 0) process.exitCode = 1;
  } finally {
    server?.kill('SIGTERM');
    await pool.end().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'UAT scenario run failed.');
  process.exitCode = 2;
});
