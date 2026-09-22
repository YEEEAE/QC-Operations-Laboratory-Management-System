import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('../..', import.meta.url).pathname);
const excluded = /^(?:\.ci-results\/|dist\/|node_modules\/|test-results\/|playwright-report\/)/;

export function gitSha() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
}

export async function sourceFingerprint() {
  const hash = createHash('sha256');
  const diff = execFileSync('git', ['diff', '--binary', 'HEAD', '--', '.', ':!.ci-results'], {
    cwd: root,
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  hash.update(diff);
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter((path) => path && !excluded.test(path))
    .sort();
  for (const path of untracked) {
    hash.update(path);
    hash.update(await readFile(resolve(root, path)));
  }
  return hash.digest('hex');
}

export async function migrationHead() {
  const paths = await readdir(resolve(root, 'db/migrations'));
  return (
    paths
      .filter((path) => /^\d+_.+\.sql$/.test(path))
      .sort()
      .at(-1) ?? 'unknown'
  );
}

export async function evidenceIdentity() {
  return {
    gitSha: gitSha(),
    sourceFingerprint: await sourceFingerprint(),
    migrationHead: await migrationHead(),
    nodeVersion: process.version,
    generatedAt: new Date().toISOString(),
    executionEnvironment: {
      kind: process.env.CI === 'true' ? 'ci' : 'local',
      platform: process.platform,
      architecture: process.arch,
    },
  };
}

export async function verificationRun() {
  const context = JSON.parse(await readFile(resolve(root, '.ci-results/run-context.json'), 'utf8'));
  const current = await evidenceIdentity();
  if (
    !context?.runId ||
    context.candidate.gitSha !== current.gitSha ||
    context.candidate.sourceFingerprint !== current.sourceFingerprint
  ) {
    throw new Error(
      'Verification run context is absent or belongs to another candidate. Start a fresh verification run.',
    );
  }
  return { runId: context.runId, candidate: current };
}
