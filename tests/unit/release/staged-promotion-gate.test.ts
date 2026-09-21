import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  comparePromotionIdentity,
  evaluateMigrationStep,
  evaluatePromotionOrder,
} from '../../../scripts/release/check-staged-promotion.mjs';

/**
 * QC-100-FINAL-036-B — staged release promotion gate.
 *
 * Exercises the real CLI. A promotion that cannot prove it is moving the
 * verified artifact, a migration step that is not forward-only, an incomplete
 * rollback plan, or a high-risk migration without recovery posture must all
 * fail closed. Nothing here invents a PASS from missing evidence.
 *
 * The fixture artifact is task-owned and lives outside `dist/`, so the contract
 * holds on a clean checkout that has never been built. Production evidence is
 * deliberately not used: release evidence refuses a dirty working tree, which
 * is exactly why a real promotion must run from a clean committed candidate.
 */

type Run = { status: number; result: { status: string; failed: string[] }; lines: string[] };

const workdir = mkdtempSync(join(tmpdir(), 'qc-promotion-'));
const currentSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const migrationFiles = readdirSync('db/migrations').filter((name) =>
  /^\d{4}_[a-z0-9_]+\.sql$/.test(name),
);
const head = migrationFiles
  .sort()
  .at(-1)!
  .replace(/\.sql$/, '');

function write(name: string, value: unknown): string {
  const path = join(workdir, name);
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  return path;
}

const artifactPath = write('artifact.mjs', 'export const entry = 1;\n');
const artifactSha256 = createHash('sha256').update(readFileSync(artifactPath)).digest('hex');

function identity(name: string, overrides: Record<string, unknown> = {}): string {
  const path = join(workdir, name);
  execFileSync(
    'node',
    [
      'scripts/release/release-id.mjs',
      '--environment',
      'local',
      '--build-id',
      'qc036-test',
      '--build-timestamp',
      '2026-09-21T00:00:00.000Z',
      '--output',
      path,
    ],
    { encoding: 'utf8' },
  );
  const metadata = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(
    path,
    JSON.stringify(
      {
        ...metadata,
        artifactSha256,
        artifact: { path: artifactPath, sha256: artifactSha256 },
        ...overrides,
      },
      null,
      2,
    ),
  );
  return path;
}

function run(planPath: string): Run {
  try {
    const stdout = execFileSync(
      'node',
      [
        '--import=tsx',
        'scripts/release/check-staged-promotion.mjs',
        '--plan',
        planPath,
        '--expected-git-sha',
        currentSha,
      ],
      { encoding: 'utf8', env: process.env },
    );
    return { status: 0, ...parse(stdout) };
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };
    return { status: failure.status ?? 1, ...parse(failure.stdout ?? '') };
  }
}

function parse(stdout: string): { result: { status: string; failed: string[] }; lines: string[] } {
  const lines = stdout.trim().split('\n').filter(Boolean);
  return { result: JSON.parse(lines.at(-1) ?? '{}'), lines };
}

const detail = (lines: string[], check: string) =>
  lines.find((line) => line.includes(` ${check}:`)) ?? '';

const candidatePath = identity('candidate.json');
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8'));
const promoted = (name: string, environment: string, overrides: Record<string, unknown> = {}) =>
  identity(name, { environment, ...overrides });

const basePlan = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  candidate: candidatePath,
  artifact: { path: artifactPath },
  promotion: [
    { environment: 'test', releaseIdentity: promoted('test.json', 'test') },
    { environment: 'staging', releaseIdentity: promoted('staging.json', 'staging') },
  ],
  migration: { headBefore: head, headAfter: head, riskLevel: 'LOW' },
  rollback: { mode: 'forward-fix', owner: 'release authority' },
  ...overrides,
});

const recoveryManifestPath = write('recovery.json', {
  manifestVersion: 1,
  backupSetId: 'qc036-fixture-backup',
  environment: 'staging',
  createdAt: '2026-09-21T00:00:00.000Z',
  backupJobResult: 'SUCCEEDED',
  restoreVerificationStatus: 'NOT_VERIFIED',
  database: {
    restoreReference: 'qc036-fixture-restore',
    postgresqlVersion: '18.6',
    migrationLedger: [{ version: head.split('_')[0], name: head, checksum: 'b'.repeat(64) }],
    coreRelations: ['receiving_items'],
    historyRelations: ['audit_events'],
  },
  fileObjects: [],
  appContext: { gitCommitSha: currentSha, releaseId: candidate.releaseId, migrationHead: head },
  knownGaps: [],
});

describe('QC-100-FINAL-036-B staged promotion gate', () => {
  it('passes when every target promotes the verified artifact', () => {
    const outcome = run(write('plan-ok.json', basePlan()));
    expect(outcome.status).toBe(0);
    expect(outcome.result).toMatchObject({ status: 'ok', checks: 7 });
    expect(outcome.result.failed).toEqual([]);
    expect(detail(outcome.lines, 'promotion-parity')).toContain('same artifact');
    expect(detail(outcome.lines, 'artifact-identity')).toContain(artifactSha256);
    expect(detail(outcome.lines, 'recovery-precondition')).toContain('not required');
  });

  it('fails closed when a target environment rebuilt the artifact', () => {
    const plan = basePlan();
    plan.promotion = [
      plan.promotion[0],
      {
        environment: 'staging',
        releaseIdentity: promoted('staging-rebuilt.json', 'staging', {
          artifactSha256: 'a'.repeat(64),
        }),
      },
    ];
    const outcome = run(write('plan-rebuild.json', plan));
    expect(outcome.status).toBe(1);
    expect(outcome.result.failed).toContain('promotion-parity');
    expect(detail(outcome.lines, 'promotion-parity')).toContain('artifactSha256 mismatch');
  });

  it('rejects promotion targets that move backwards through the environment flow', () => {
    const plan = basePlan({
      promotion: [
        { environment: 'staging', releaseIdentity: promoted('s.json', 'staging') },
        { environment: 'ci', releaseIdentity: promoted('c.json', 'ci') },
      ],
    });
    const outcome = run(write('plan-order.json', plan));
    expect(outcome.status).toBe(1);
    expect(outcome.result.failed).toContain('plan-shape');
    expect(detail(outcome.lines, 'plan-shape')).toContain('out of canonical order');
  });

  it('requires a real starting migration head', () => {
    const unknown = run(
      write(
        'plan-unknown-head.json',
        basePlan({
          migration: { headBefore: '9999_not_a_real_migration', headAfter: head, riskLevel: 'LOW' },
        }),
      ),
    );
    expect(unknown.status).toBe(1);
    expect(unknown.result.failed).toContain('migration-forward-only');
    expect(detail(unknown.lines, 'migration-forward-only')).toContain('not in the source ledger');
  });

  it('requires schema compatibility and a prior artifact for a code rollback', () => {
    const incomplete = run(
      write(
        'plan-rollback.json',
        basePlan({ rollback: { mode: 'code-rollback', schemaCompatible: false } }),
      ),
    );
    expect(incomplete.status).toBe(1);
    expect(incomplete.result.failed).toContain('rollback-preconditions');
    const message = detail(incomplete.lines, 'rollback-preconditions');
    expect(message).toContain('schemaCompatible');
    expect(message).toContain('priorArtifactSha256');

    const sameArtifact = run(
      write(
        'plan-rollback-same.json',
        basePlan({
          rollback: {
            mode: 'code-rollback',
            schemaCompatible: true,
            priorArtifactSha256: artifactSha256,
          },
        }),
      ),
    );
    expect(sameArtifact.status).toBe(1);
    expect(detail(sameArtifact.lines, 'rollback-preconditions')).toContain(
      'must differ from the candidate artifact digest',
    );
  });

  it('requires recovery posture for a high-risk migration and binds it to the pre-migration head', () => {
    const highRisk = {
      migration: { headBefore: head, headAfter: head, riskLevel: 'HIGH' },
    };

    const missing = run(write('plan-high-risk.json', basePlan(highRisk)));
    expect(missing.status).toBe(1);
    expect(missing.result.failed).toContain('recovery-precondition');
    expect(detail(missing.lines, 'recovery-precondition')).toContain(
      'recovery manifest is required',
    );

    const bound = run(
      write(
        'plan-high-risk-bound.json',
        basePlan({ ...highRisk, recovery: { manifestPath: recoveryManifestPath } }),
      ),
    );
    expect(bound.status).toBe(0);
    expect(detail(bound.lines, 'recovery-precondition')).toContain('qc036-fixture-backup');

    const failedBackup = run(
      write(
        'plan-high-risk-failed-backup.json',
        basePlan({
          ...highRisk,
          recovery: {
            manifestPath: write('recovery-failed.json', {
              ...JSON.parse(readFileSync(recoveryManifestPath, 'utf8')),
              backupJobResult: 'FAILED',
            }),
          },
        }),
      ),
    );
    expect(failedBackup.status).toBe(1);
    expect(detail(failedBackup.lines, 'recovery-precondition')).toContain('not SUCCEEDED');

    const wrongHead = run(
      write(
        'plan-high-risk-wrong-head.json',
        basePlan({
          migration: { headBefore: '9999_other_migration', headAfter: head, riskLevel: 'HIGH' },
          recovery: { manifestPath: recoveryManifestPath },
        }),
      ),
    );
    expect(wrongHead.status).toBe(1);
    expect(detail(wrongHead.lines, 'recovery-precondition')).toContain('pre-migration head');
  });

  it('evaluates the migration step and promotion order as pure contracts', () => {
    const ledger = ['0001_alpha', '0002_beta', '0003_gamma'];

    expect(
      evaluateMigrationStep({ headBefore: '0002_beta', headAfter: '0003_gamma' }, ledger),
    ).toEqual({ problems: [], pending: ['0003_gamma'] });
    expect(
      evaluateMigrationStep({ headBefore: '0003_gamma', headAfter: '0001_alpha' }, ledger).problems,
    ).toEqual([
      expect.stringContaining('not the source migration head'),
      expect.stringContaining('moves backwards'),
    ]);
    expect(
      evaluateMigrationStep({ headBefore: '9999_missing', headAfter: '0003_gamma' }, ledger)
        .problems,
    ).toEqual([expect.stringContaining('not in the source ledger')]);

    expect(evaluatePromotionOrder([{ environment: 'test' }, { environment: 'staging' }])).toEqual(
      [],
    );
    expect(evaluatePromotionOrder([{ environment: 'test' }, { environment: 'test' }])).toEqual([
      expect.stringContaining('repeats environment'),
    ]);

    const candidate = {
      gitSha: 'a'.repeat(40),
      serviceVersion: '0.1.0',
      applicationVersion: '0.1.0',
      migrationHead: '0003_gamma',
      migrationHeadChecksum: 'c'.repeat(64),
      artifactSha256: 'b'.repeat(64),
    };
    expect(comparePromotionIdentity(candidate, { ...candidate })).toEqual([]);
    expect(comparePromotionIdentity(candidate, { ...candidate, gitSha: 'a'.repeat(39) })).toEqual([
      expect.stringContaining('gitSha mismatch'),
    ]);
    expect(comparePromotionIdentity(candidate, { ...candidate, gitSha: undefined })).toEqual([
      'promotion identity is missing gitSha',
    ]);
  });

  it('fails closed when the plan or candidate evidence is missing', () => {
    const absent = run(join(workdir, 'no-such-plan.json'));
    expect(absent.status).toBe(1);
    expect(absent.result.failed).toContain('plan-shape');
  });
});
