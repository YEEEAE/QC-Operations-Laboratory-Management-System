import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { routes } from '../../src/shared/routing/routes.js';
import { pageAccessDecision } from '../../src/shared/routing/page-access.js';
import type { ActorContext, AccountState } from '../../src/shared/authorization/types.js';
import { UAT_PERSONAS } from '../../tests/fixtures/uat-personas.js';
import {
  buildScenarios,
  digestInputs,
  evaluateEvidence,
  readAuditCards,
} from './route-acceptance.mjs';
import { evidenceIdentity } from './evidence-identity.mjs';

const auditPath = 'audit/2026-10-02/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html';
const cards = readAuditCards(await readFile(auditPath, 'utf8'));
const migrations = (await readdir('db/migrations'))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const schemaDigest = digestInputs(
  await Promise.all(
    migrations.map(async (name) => [name, await readFile(join('db/migrations', name))]),
  ),
);
const candidate = { ...(await evidenceIdentity()), schemaDigest, buildId: null as string | null };
let build = null;
try {
  const evidence = JSON.parse(await readFile('.ci-results/build.json', 'utf8'));
  if (
    evidence.candidate.gitSha === candidate.gitSha &&
    evidence.candidate.sourceFingerprint === candidate.sourceFingerprint
  )
    build = { artifactDigest: evidence.artifactDigest, runId: evidence.runId };
} catch {
  /* Absent build stays NV. */
}
candidate.buildId = build?.artifactDigest ?? null;
let taskProof: Record<string, unknown> | null = null;
try {
  const proof = JSON.parse(await readFile('.ci-results/task-direct-denial.json', 'utf8'));
  const buildEvidence = JSON.parse(await readFile('.ci-results/build.json', 'utf8'));
  if (
    proof.candidate.gitSha === candidate.gitSha &&
    proof.candidate.sourceFingerprint === candidate.sourceFingerprint &&
    proof.schemaDigest === schemaDigest &&
    proof.release.artifactSha256 === buildEvidence.entryArtifactDigest &&
    proof.routeId === 'RT-TASK-003' &&
    proof.status === 'PASS' &&
    JSON.stringify(proof.before) === JSON.stringify(proof.after)
  )
    taskProof = proof;
} catch {
  /* No current supporting proof; every runtime scenario stays NV. */
}
const inputIndex = process.argv.indexOf('--evidence');
const executions =
  inputIndex >= 0 ? JSON.parse(await readFile(process.argv[inputIndex + 1], 'utf8')) : [];
if (!Array.isArray(executions)) throw new Error('Evidence must be a JSON array');
if (new Set(executions.map((row) => row.scenarioId)).size !== executions.length)
  throw new Error('Duplicate scenario evidence');

const personaIds = UAT_PERSONAS.map((persona) => persona.id);
const pages = cards.map((card: { id: string; path: string; fields: Record<string, string> }) => {
  const frameworkError = ['/404', '/500'].includes(card.path);
  const route =
    routes.find((entry) => entry.id === card.id && entry.path === card.path) ??
    (frameworkError
      ? { id: card.id, path: card.path, page: `src/pages${card.path}.astro`, visibility: 'PUBLIC' }
      : null);
  if (!route || route.page !== card.fields['الملف'])
    throw new Error(`Registry/card drift: ${card.id}`);
  const pathname = route.path.replace(/\[[^\]]+\]/g, '01900000-0000-7000-8000-000000000001');
  const actors: Omit<ActorContext, 'accountState'>[] = UAT_PERSONAS.map((persona) => ({
    id: persona.id,
    loginIdentity: persona.loginIdentity,
    roles: [persona.foundationRole],
    permissions: [],
  }));
  actors.push(
    { id: 'admin-only', loginIdentity: 'verify-admin-only', roles: ['ADMIN'], permissions: [] },
    {
      id: 'noncanonical-owner',
      loginIdentity: 'verify-owner-like',
      roles: ['SYSTEM_OWNER'],
      permissions: [],
    },
  );
  const visibilityChecks = actors.flatMap((actor) =>
    (['ACTIVE', 'INACTIVE', 'DISABLED'] as AccountState[]).map((accountState) => {
      const expected =
        route.visibility === 'PUBLIC'
          ? 'ALLOWED'
          : accountState !== 'ACTIVE'
            ? 'AUTHENTICATION_REQUIRED'
            : route.visibility === 'YAZEED_ONLY' && actor.id !== 'system-owner'
              ? 'YAZEED_ONLY'
              : 'ALLOWED';
      const observed = pageAccessDecision({ ...actor, accountState } as ActorContext, pathname);
      if (observed !== expected)
        throw new Error(`Visibility mismatch: ${card.id}/${actor.id}/${accountState}`);
      return {
        persona: actor.id,
        accountState,
        expected,
        observed,
        layer: 'SOURCE FUNCTION',
        status: 'PASS',
      };
    }),
  );
  const guest = pageAccessDecision(undefined, pathname);
  if (guest !== (route.visibility === 'PUBLIC' ? 'ALLOWED' : 'AUTHENTICATION_REQUIRED'))
    throw new Error(`Guest mismatch: ${card.id}`);
  return {
    routeId: route.id,
    path: route.path,
    page: route.page,
    visibility: route.visibility,
    authorityBoundary:
      'Visibility does not authorize mutation; empty permissions deliberately used for page-access probes',
    registryKind: frameworkError
      ? 'ASTRO ERROR CONVENTION; unregistered pageAccessDecision fallback only'
      : 'CANONICAL',
    card: card.fields,
    guest: { expected: guest, observed: guest, layer: 'SOURCE FUNCTION', status: 'PASS' },
    visibilityChecks,
    supportingTechnicalEvidence:
      card.id === 'RT-TASK-003' && taskProof
        ? {
            status: 'PASS',
            reference: '.ci-results/task-direct-denial.json',
            persona: 'verify-least',
            boundary: 'Not the six UAT personas; does not close route acceptance',
          }
        : null,
    scenarios: buildScenarios(card, personaIds).map((scenario: { id: string }) => ({
      ...scenario,
      evaluation: evaluateEvidence(
        scenario,
        executions.find((row) => row.scenarioId === scenario.id),
        candidate,
      ),
    })),
    acceptanceStatus: 'NOT VERIFIED',
  };
});
const scenarioIds = new Set(
  pages.flatMap((page) => page.scenarios.map((scenario: { id: string }) => scenario.id)),
);
if (executions.some((row) => !scenarioIds.has(row.scenarioId)))
  throw new Error('Evidence has unknown scenario');
await mkdir('.ci-results', { recursive: true });
const result = {
  taskId: 'QC-ADP26-01',
  schemaVersion: 1,
  candidate,
  auditCandidate: '0b1bb21bb3b4eca77862dbba1da8623044e96355',
  auditPath,
  auditDigest: digestInputs([[auditPath, await readFile(auditPath)]]),
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  build,
  appliedSchema: taskProof
    ? {
        status: 'VERIFIED LOCAL LEDGER/CHECKSUMS ONLY',
        head: candidate.migrationHead,
        digest: schemaDigest,
        reference: '.ci-results/task-direct-denial.json',
      }
    : { status: 'NOT VERIFIED', head: null, digest: null },
  personas: UAT_PERSONAS.map((persona) => ({
    id: persona.id,
    label: persona.label,
    loginIdentity: persona.loginIdentity,
    foundationRole: persona.foundationRole,
    scopes: persona.scopes,
    teamValue: persona.teamValue,
    seedManaged: persona.seedManaged,
  })),
  pages,
  totals: {
    pages: pages.length,
    visibilitySourceChecks: pages.length * 25,
    runtimeScenarios: pages.reduce((count, page) => count + page.scenarios.length, 0),
    runtimePassed: pages
      .flatMap((page) => page.scenarios)
      .filter(
        (scenario: { evaluation: { status: string } }) => scenario.evaluation.status === 'PASS',
      ).length,
    humanAccepted: 0,
  },
  state: 'PARTIAL',
  findingStatus: 'OPEN',
  releaseDecision: 'NO-GO',
};
await writeFile('.ci-results/route-acceptance.json', `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify({
    ...result.totals,
    state: result.state,
    findingStatus: result.findingStatus,
    gitSha: candidate.gitSha,
    sourceFingerprint: candidate.sourceFingerprint,
    schemaDigest,
  }),
);
