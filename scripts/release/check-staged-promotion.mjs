/* global console */

/**
 * Staged release promotion gate (QC-100-FINAL-036-B).
 *
 * Read-only and fail-closed. It answers one release-engineering question with
 * evidence instead of assertion: *is the artifact being promoted to the target
 * environment the same artifact that was verified, and are the migration,
 * rollback and recovery preconditions actually present?*
 *
 * Checks (each item is independently reported; nothing is converted to PASS):
 *
 * 1. plan-shape              — versioned plan with candidate, ordered promotion
 *                              targets, migration step and rollback plan.
 * 2. candidate-evidence      — the candidate release identity is schema-valid,
 *                              bound to the expected checkout, and carries an
 *                              artifact digest.
 * 3. artifact-identity       — the local artifact bytes hash to the digest the
 *                              candidate evidence declares.
 * 4. promotion-parity        — every target environment's release identity
 *                              matches the candidate on Git SHA, versions,
 *                              migration head/checksum and artifact digest:
 *                              a rebuild is not the verified artifact
 *                              (DEP-002/DEP-003).
 * 5. migration-forward-only  — the plan's target head is the source migration
 *                              head, the starting head is a real ledger entry,
 *                              and the step never moves backwards (DEP-004/
 *                              DEP-005).
 * 6. rollback-preconditions  — the declared recovery mode is complete for the
 *                              failure mode it claims (DEP-006/DEP-012/DEP-033).
 * 7. recovery-precondition   — a declared high-risk migration, or a recovery
 *                              mode, requires a schema-valid recovery manifest
 *                              whose starting state is the pre-migration head
 *                              (DEP-018).
 *
 * A running health endpoint is deliberately NOT part of this gate: it proves
 * nothing about these prerequisites.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { assertReleaseMetadataShape, RELEASE_ENVIRONMENTS } from './release-id.mjs';
import { readRecoveryManifest } from '../recovery/verify-recovery-manifest.ts';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');

const ROLLBACK_MODES = ['code-rollback', 'forward-fix', 'recovery'];
const RISK_LEVELS = ['LOW', 'HIGH'];
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const MIGRATION_FILE_PATTERN = /^(\d{4}_[a-z0-9_]+)\.sql$/;

// --- Pure helpers (unit-tested) -------------------------------------------------

export function canonicalEnvironmentIndex(environment) {
  return RELEASE_ENVIRONMENTS.indexOf(environment);
}

/** Ordered, duplicate-free promotion targets following DEP-001's canonical flow. */
export function evaluatePromotionOrder(promotion) {
  const problems = [];
  const seen = new Set();
  let previous = -1;
  for (const [index, target] of promotion.entries()) {
    const position = canonicalEnvironmentIndex(target.environment);
    if (position === -1) {
      problems.push(`promotion[${index}] has unknown environment "${target.environment}"`);
      continue;
    }
    if (seen.has(target.environment)) {
      problems.push(`promotion[${index}] repeats environment "${target.environment}"`);
      continue;
    }
    seen.add(target.environment);
    if (position < previous)
      problems.push(
        `promotion[${index}] targets "${target.environment}" out of canonical order (${RELEASE_ENVIRONMENTS.join(' → ')})`,
      );
    previous = position;
  }
  return problems;
}

/** Identity fields that must be identical for the same artifact to be promoted. */
export const PROMOTION_IDENTITY_FIELDS = [
  'gitSha',
  'serviceVersion',
  'applicationVersion',
  'migrationHead',
  'migrationHeadChecksum',
  'artifactSha256',
];

export function comparePromotionIdentity(candidate, promoted) {
  const problems = [];
  for (const field of PROMOTION_IDENTITY_FIELDS) {
    if (!promoted[field]) {
      problems.push(`promotion identity is missing ${field}`);
      continue;
    }
    if (candidate[field] !== promoted[field])
      problems.push(
        `${field} mismatch: candidate ${String(candidate[field])}, promoted ${String(promoted[field])}`,
      );
  }
  return problems;
}

/** Forward-only migration ledger evaluation against the source migration set. */
export function evaluateMigrationStep(migration, ledger) {
  const problems = [];
  const indexOf = new Map(ledger.map((name, index) => [name, index]));
  const head = ledger.at(-1);
  if (migration.headAfter !== head)
    problems.push(
      `migration.headAfter "${migration.headAfter}" is not the source migration head "${head}"`,
    );
  const before = indexOf.get(migration.headBefore);
  const after = indexOf.get(migration.headAfter);
  if (before === undefined)
    problems.push(`migration.headBefore "${migration.headBefore}" is not in the source ledger`);
  if (after === undefined)
    problems.push(`migration.headAfter "${migration.headAfter}" is not in the source ledger`);
  if (before !== undefined && after !== undefined && after < before)
    problems.push(
      `migration step moves backwards: headBefore "${migration.headBefore}" is newer than headAfter "${migration.headAfter}"`,
    );
  const pending =
    before === undefined || after === undefined ? [] : ledger.slice(before + 1, after + 1);
  return { problems, pending };
}

/** Rollback/recovery preconditions for the failure mode the plan claims. */
export function evaluateRollbackPlan(rollback, candidate, { migrationRiskLevel }) {
  const problems = [];
  if (!ROLLBACK_MODES.includes(rollback.mode))
    problems.push(`rollback.mode "${rollback.mode}" is not one of ${ROLLBACK_MODES.join(', ')}`);
  if (rollback.mode === 'code-rollback') {
    if (rollback.schemaCompatible !== true)
      problems.push(
        'rollback.mode "code-rollback" requires rollback.schemaCompatible === true (DEP-006: code rollback needs prior-code/schema compatibility)',
      );
    if (!SHA256_PATTERN.test(rollback.priorArtifactSha256 ?? ''))
      problems.push(
        'rollback.mode "code-rollback" requires rollback.priorArtifactSha256 as a SHA-256 hex digest',
      );
    else if (rollback.priorArtifactSha256.toLowerCase() === candidate.artifactSha256)
      problems.push('rollback.priorArtifactSha256 must differ from the candidate artifact digest');
  }
  if (rollback.mode === 'forward-fix' || rollback.mode === 'recovery') {
    if (typeof rollback.owner !== 'string' || rollback.owner.trim() === '')
      problems.push(`rollback.mode "${rollback.mode}" requires a named rollback.owner`);
  }
  if (rollback.mode === 'recovery' && !rollback.recoveryManifestPath)
    problems.push(
      'rollback.mode "recovery" requires recovery.manifestPath for the pre-migration recovery posture',
    );
  const needsRecovery = migrationRiskLevel === 'HIGH' || rollback.mode === 'recovery';
  return { problems, needsRecovery };
}

// --- Repository checks ---------------------------------------------------------

async function readMigrationLedger() {
  return (await readdir(resolve(repositoryRoot, 'db/migrations')))
    .map((name) => MIGRATION_FILE_PATTERN.exec(name)?.[1])
    .filter(Boolean)
    .sort();
}

async function readIdentity(path) {
  const absolute = resolve(repositoryRoot, path);
  let metadata;
  try {
    metadata = JSON.parse(await readFile(absolute, 'utf8'));
  } catch {
    throw new Error(`Release identity is missing or unreadable: ${path}`);
  }
  assertReleaseMetadataShape(metadata);
  return { metadata, path: relative(repositoryRoot, absolute) };
}

async function hashArtifact(path) {
  return createHash('sha256')
    .update(await readFile(resolve(repositoryRoot, path)))
    .digest('hex');
}

export async function runPromotionChecks(planPath, options = {}) {
  const results = [];
  const record = (check, status, detail) => results.push({ check, status, detail });

  let plan;
  try {
    plan = JSON.parse(await readFile(resolve(repositoryRoot, planPath), 'utf8'));
  } catch {
    record('plan-shape', 'FAIL', `Promotion plan is missing or unreadable: ${planPath}`);
    return results;
  }

  // 1) plan shape
  const shapeProblems = [];
  if (plan.schemaVersion !== 1) shapeProblems.push('schemaVersion must be 1');
  if (typeof plan.candidate !== 'string' || plan.candidate.trim() === '')
    shapeProblems.push('candidate release identity path is required');
  if (!Array.isArray(plan.promotion) || plan.promotion.length === 0)
    shapeProblems.push('at least one promotion target is required');
  if (!plan.migration || typeof plan.migration !== 'object')
    shapeProblems.push('migration plan is required');
  if (!plan.rollback || typeof plan.rollback !== 'object')
    shapeProblems.push('rollback plan is required');
  if (plan.migration && !RISK_LEVELS.includes(plan.migration.riskLevel))
    shapeProblems.push(`migration.riskLevel must be one of ${RISK_LEVELS.join(', ')}`);
  if (Array.isArray(plan.promotion)) shapeProblems.push(...evaluatePromotionOrder(plan.promotion));
  record(
    'plan-shape',
    shapeProblems.length === 0 ? 'PASS' : 'FAIL',
    shapeProblems.length === 0
      ? `plan v1 for ${plan.promotion.map((target) => target.environment).join(' → ')}`
      : shapeProblems.join('; '),
  );
  if (shapeProblems.length > 0) return results;

  // 2) candidate evidence
  let candidate;
  const candidateProblems = [];
  try {
    const loaded = await readIdentity(plan.candidate);
    candidate = loaded.metadata;
    const expectedGitSha = options.expectedGitSha;
    if (expectedGitSha && candidate.gitSha !== expectedGitSha.toLowerCase())
      candidateProblems.push(
        `candidate Git SHA ${candidate.gitSha} is not the expected checkout ${expectedGitSha}`,
      );
    if (candidate.migrationHead !== plan.migration.headAfter)
      candidateProblems.push(
        `candidate migration head ${candidate.migrationHead} is not the planned target head ${plan.migration.headAfter}`,
      );
  } catch (error) {
    candidateProblems.push(error instanceof Error ? error.message : 'Invalid candidate evidence.');
  }
  record(
    'candidate-evidence',
    candidateProblems.length === 0 ? 'PASS' : 'FAIL',
    candidateProblems.length === 0
      ? `${plan.candidate} (${candidate.releaseId}, ${candidate.environment}, ${candidate.migrationHead})`
      : candidateProblems.join('; '),
  );
  if (candidateProblems.length > 0) return results;

  // 3) artifact identity
  const artifactProblems = [];
  const artifactPath = plan.artifact?.path ?? candidate.artifact?.path;
  if (!SHA256_PATTERN.test(candidate.artifactSha256 ?? ''))
    artifactProblems.push('candidate evidence does not declare artifactSha256');
  else if (artifactPath) {
    try {
      const actual = await hashArtifact(artifactPath);
      if (actual !== candidate.artifactSha256)
        artifactProblems.push(
          `artifact ${artifactPath} hashes to ${actual}, candidate evidence declares ${candidate.artifactSha256}`,
        );
    } catch {
      artifactProblems.push(
        `artifact ${artifactPath} is unavailable locally; the declared digest cannot be re-verified`,
      );
    }
  }
  record(
    'artifact-identity',
    artifactProblems.length === 0 ? 'PASS' : 'FAIL',
    artifactProblems.length === 0
      ? `${artifactPath ?? candidate.artifact?.path} matches ${candidate.artifactSha256}`
      : artifactProblems.join('; '),
  );

  // 4) promotion parity
  const parityProblems = [];
  for (const target of plan.promotion) {
    try {
      const { metadata, path } = await readIdentity(target.releaseIdentity);
      const mismatches = comparePromotionIdentity(candidate, metadata);
      if (metadata.environment !== target.environment)
        mismatches.push(
          `environment mismatch: plan says "${target.environment}", evidence says "${metadata.environment}"`,
        );
      if (mismatches.length > 0)
        parityProblems.push(`${target.environment} (${path}): ${mismatches.join(', ')}`);
    } catch (error) {
      parityProblems.push(
        `${target.environment}: ${error instanceof Error ? error.message : 'invalid evidence'}`,
      );
    }
  }
  record(
    'promotion-parity',
    parityProblems.length === 0 ? 'PASS' : 'FAIL',
    parityProblems.length === 0
      ? `${plan.promotion.length} target environment(s) promote the same artifact ${candidate.artifactSha256}`
      : parityProblems.join('; '),
  );

  // 5) migration step
  const ledger = await readMigrationLedger();
  const migration = evaluateMigrationStep(plan.migration, ledger);
  record(
    'migration-forward-only',
    migration.problems.length === 0 ? 'PASS' : 'FAIL',
    migration.problems.length === 0
      ? `${plan.migration.headBefore} → ${plan.migration.headAfter} (${migration.pending.length} migration(s) applied, forward-only)`
      : migration.problems.join('; '),
  );

  // 6) rollback preconditions
  const rollback = evaluateRollbackPlan(plan.rollback, candidate, {
    migrationRiskLevel: plan.migration.riskLevel,
  });
  record(
    'rollback-preconditions',
    rollback.problems.length === 0 ? 'PASS' : 'FAIL',
    rollback.problems.length === 0
      ? `mode ${plan.rollback.mode}${plan.rollback.owner ? ` owned by ${plan.rollback.owner}` : ''}`
      : rollback.problems.join('; '),
  );

  // 7) recovery precondition
  const recoveryProblems = [];
  let recoveryDetail = 'not required (LOW risk, non-recovery mode)';
  if (rollback.needsRecovery) {
    const manifestPath = plan.recovery?.manifestPath ?? plan.rollback.recoveryManifestPath;
    if (!manifestPath) {
      recoveryProblems.push(
        `a recovery manifest is required for ${plan.migration.riskLevel} risk / ${plan.rollback.mode} mode`,
      );
    } else {
      try {
        const manifest = await readRecoveryManifest(resolve(repositoryRoot, manifestPath));
        if (manifest.backupJobResult !== 'SUCCEEDED')
          recoveryProblems.push(
            `recovery manifest backupJobResult is ${manifest.backupJobResult}, not SUCCEEDED (backup job success is still not restore proof)`,
          );
        if (manifest.appContext.migrationHead !== plan.migration.headBefore)
          recoveryProblems.push(
            `recovery manifest head ${manifest.appContext.migrationHead} is not the pre-migration head ${plan.migration.headBefore}`,
          );
        if (manifest.environment === 'production')
          recoveryProblems.push(
            'recovery manifest must describe the pre-migration source environment, not production',
          );
        if (recoveryProblems.length === 0)
          recoveryDetail = `${manifest.backupSetId} (${manifest.database.restoreReference}, restore ${manifest.restoreVerificationStatus})`;
      } catch (error) {
        recoveryProblems.push(
          error instanceof Error ? error.message : 'recovery manifest is invalid',
        );
      }
    }
  }
  record(
    'recovery-precondition',
    recoveryProblems.length === 0 ? 'PASS' : 'FAIL',
    recoveryProblems.length === 0 ? recoveryDetail : recoveryProblems.join('; '),
  );

  return results;
}

// --- CLI ----------------------------------------------------------------------

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = [];
  let failed;
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== '--');
    const planPath = valueAfter(args, '--plan');
    if (!planPath) throw new Error('--plan is required.');
    const expectedGitSha =
      valueAfter(args, '--expected-git-sha') ??
      execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
    results.push(...(await runPromotionChecks(planPath, { expectedGitSha })));
    failed = results.filter((result) => result.status === 'FAIL').map((result) => result.check);
  } catch (error) {
    failed = ['cli'];
    results.push({
      check: 'cli',
      status: 'FAIL',
      detail: error instanceof Error ? error.message : 'Unable to evaluate the promotion plan.',
    });
  }
  for (const result of results) console.log(`[${result.status}] ${result.check}: ${result.detail}`);
  console.log(
    JSON.stringify({
      status: failed.length === 0 ? 'ok' : 'failed',
      checks: results.length,
      failed,
    }),
  );
  process.exit(failed.length === 0 ? 0 : 1);
}
