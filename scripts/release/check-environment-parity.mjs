/* global console */

/**
 * Environment parity and isolation guard (QC-100-FINAL-036-A).
 *
 * Read-only, fail-closed contract checks across the environments declared by
 * the release evidence contract (local / test / ci / staging / production):
 *
 * 1. runtime-contract     — local Node satisfies package.json engines; pnpm
 *                           matches packageManager.
 * 2. ci-runtime-parity    — the CI workflow pins the same Node/pnpm the
 *                           package contract declares.
 * 3. schema-identity      — the documented migration head matches the source
 *                           head (schema identity travels with the candidate).
 * 4. env-example-contract — every server-contract variable is documented in
 *                           .env.example with names only; no secret-shaped key
 *                           carries a value; .env is never tracked by git.
 * 5. fixture-isolation    — src/ never imports test fixtures or verification
 *                           seed tooling; every disposable seed/cleanup script
 *                           keeps its production-refusal guards.
 * 6. artifact-identity    — when dist/release-identity.json exists it satisfies
 *                           the release-evidence schema and contains none of
 *                           the current secret values.
 *
 * Values of secrets are never printed; failures name keys and files only.
 */

import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { ENV_KEYS } from '../../src/config/constants.ts';
import { assertReleaseMetadataShape } from './release-id.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');

const SECRET_KEY_PATTERN = /(SECRET|PASSWORD|API_KEY|ACCESS_KEY|DATABASE_URL|TOKEN|PRIVATE_KEY)/;
const SECRET_VALUE_PATTERN =
  /(-----BEGIN [A-Z ]*PRIVATE KEY-----|argon2\$|postgres(ql)?:\/\/[^/\s:]+:[^@\s]+@)/i;

const FIXTURE_SEED_SCRIPTS = [
  'scripts/verification/seed-verification-fixtures.ts',
  'scripts/verification/cleanup-verification-fixtures.ts',
  'scripts/uat/seed-uat-personas.ts',
  'scripts/uat/cleanup-uat-personas.ts',
];

const GUARD_MARKERS = ['NODE_ENV must be development or test', 'looks like production'];

// --- Pure helpers (unit-tested) ------------------------------------------------

export function parseEnvExample(source) {
  return source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      if (separator === -1) return { key: line, value: undefined, malformed: true };
      return {
        key: line.slice(0, separator).trim(),
        value: line.slice(separator + 1).trim(),
        malformed: false,
      };
    });
}

export function findSecretValuedEntries(entries) {
  return entries
    .filter((entry) => !entry.malformed && SECRET_KEY_PATTERN.test(entry.key) && entry.value !== '')
    .map((entry) => entry.key);
}

export function findUndocumentedKeys(entries, contractKeys) {
  const documented = new Set(entries.map((entry) => entry.key));
  return contractKeys.filter((key) => !documented.has(key));
}

export function extractCiToolchain(workflowSource) {
  const node = /node-version:\s*['"]?([0-9.]+)['"]?/.exec(workflowSource);
  const pnpm = /pnpm\/action-setup[\s\S]{0,200}?version:\s*['"]?([0-9.]+)['"]?/.exec(
    workflowSource,
  );
  return { nodeVersion: node?.[1], pnpmVersion: pnpm?.[1] };
}

export function parseVersion(value) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(value);
  return match ? { major: +match[1], minor: +match[2], patch: +match[3] } : undefined;
}

export function satisfiesEngines(version, engines) {
  const current = parseVersion(version);
  if (!current) return false;
  for (const clause of engines.trim().split(/\s+/)) {
    const match = /^(>=|<=|>|<)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(clause);
    if (!match) continue;
    const [, operator, major, minor = '0', patch = '0'] = match;
    const target = { major: +major, minor: +minor, patch: +patch };
    const order =
      Math.sign(current.major - target.major) ||
      Math.sign(current.minor - target.minor) ||
      Math.sign(current.patch - target.patch);
    if (operator === '>=' && order < 0) return false;
    if (operator === '<=' && order > 0) return false;
    if (operator === '>' && order <= 0) return false;
    if (operator === '<' && order >= 0) return false;
  }
  return true;
}

export function collectStringValues(value, found = []) {
  if (typeof value === 'string') found.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStringValues(item, found);
  else if (value && typeof value === 'object')
    for (const item of Object.values(value)) collectStringValues(item, found);
  return found;
}

/**
 * Returns the number of strings that reproduce a current secret value or match
 * a secret-shaped pattern. Values themselves are never returned or printed.
 */
export function countLeakedSecrets(strings, secretValues) {
  const secrets = secretValues.filter((value) => value && value.length >= 8);
  let leaks = 0;
  for (const value of strings) {
    if (SECRET_VALUE_PATTERN.test(value)) leaks += 1;
    else if (secrets.some((secret) => value.includes(secret))) leaks += 1;
  }
  return leaks;
}

export function findFixtureImports(source, filePath) {
  const forbidden = /(tests\/|scripts\/verification|scripts\/uat|verification-personas)/;
  const imports = [];
  const pattern = /(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    if (forbidden.test(match[1])) imports.push(`${filePath}: ${match[1]}`);
  }
  return imports;
}

// --- Repository checks ---------------------------------------------------------

async function listFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext)))
    .map((entry) => resolve(entry.parentPath ?? entry.path, entry.name));
}

export async function runChecks(root = repositoryRoot, env = process.env) {
  const results = [];
  const record = (check, status, detail) => results.push({ check, status, detail });

  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

  // 1) local runtime contract
  const nodeOk = satisfiesEngines(process.version, manifest.engines.node);
  record(
    'runtime-contract',
    nodeOk ? 'PASS' : 'FAIL',
    `Node ${process.version} ${nodeOk ? 'satisfies' : 'violates'} engines "${manifest.engines.node}"`,
  );
  let pnpmVersion = 'unavailable';
  try {
    pnpmVersion = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim();
  } catch {
    /* pnpm unavailable — reported as FAIL below */
  }
  const expectedPnpm = manifest.packageManager?.split('@')[1];
  record(
    'runtime-pnpm',
    pnpmVersion === expectedPnpm ? 'PASS' : 'FAIL',
    `pnpm ${pnpmVersion} ${pnpmVersion === expectedPnpm ? 'matches' : 'does not match'} packageManager "${manifest.packageManager}"`,
  );

  // 2) CI runtime parity
  const workflow = await readFile(resolve(root, '.github/workflows/ci.yml'), 'utf8');
  const ci = extractCiToolchain(workflow);
  const ciNodeOk =
    Boolean(ci.nodeVersion) && satisfiesEngines(`v${ci.nodeVersion}`, manifest.engines.node);
  const ciPnpmOk = ci.pnpmVersion === expectedPnpm;
  record(
    'ci-runtime-parity',
    ciNodeOk && ciPnpmOk ? 'PASS' : 'FAIL',
    `CI pins Node ${ci.nodeVersion ?? 'unparsed'} / pnpm ${ci.pnpmVersion ?? 'unparsed'} against engines "${manifest.engines.node}" / packageManager "${manifest.packageManager}"`,
  );

  // 3) schema identity (source head vs documented head)
  const migrations = (await readdir(resolve(root, 'db/migrations')))
    .filter((name) => /^\d{4}_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  const head = migrations.at(-1)?.replace(/\.sql$/, '');
  const extendingDoc = await readFile(resolve(root, 'Documents/EXTENDING-THE-SYSTEM.md'), 'utf8');
  const headDocumented = Boolean(head) && extendingDoc.includes(head);
  record(
    'schema-identity',
    headDocumented ? 'PASS' : 'FAIL',
    `source migration head ${head}; ${headDocumented ? 'documented' : 'NOT documented'} in EXTENDING-THE-SYSTEM.md (${migrations.length} migrations)`,
  );

  // 4) .env.example contract (names only; no secret values; .env untracked)
  const entries = parseEnvExample(await readFile(resolve(root, '.env.example'), 'utf8'));
  const malformed = entries.filter((entry) => entry.malformed).map((entry) => entry.key);
  const secretValued = findSecretValuedEntries(entries);
  const undocumented = findUndocumentedKeys(entries, Object.values(ENV_KEYS));
  let dotEnvTracked;
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '.env'], { cwd: root, stdio: 'pipe' });
    dotEnvTracked = true;
  } catch {
    dotEnvTracked = false;
  }
  const envProblems = [];
  if (malformed.length) envProblems.push(`malformed lines: ${malformed.join(', ')}`);
  if (secretValued.length) envProblems.push(`secret-valued keys: ${secretValued.join(', ')}`);
  if (undocumented.length)
    envProblems.push(`contract keys missing from example: ${undocumented.join(', ')}`);
  if (dotEnvTracked) envProblems.push('.env is tracked by git');
  record(
    'env-example-contract',
    envProblems.length === 0 ? 'PASS' : 'FAIL',
    envProblems.length === 0
      ? `${entries.length} documented keys; ${Object.values(ENV_KEYS).length} contract keys covered; no secret values; .env untracked`
      : envProblems.join('; '),
  );

  // 5) fixture isolation
  const sourceFiles = await listFiles(resolve(root, 'src'), ['.ts', '.astro', '.tsx', '.mts']);
  const violations = [];
  for (const file of sourceFiles) {
    violations.push(
      ...findFixtureImports(
        await readFile(file, 'utf8'),
        relative(root, file).split(sep).join('/'),
      ),
    );
  }
  const missingGuards = [];
  for (const script of FIXTURE_SEED_SCRIPTS) {
    const source = await readFile(resolve(root, script), 'utf8');
    for (const marker of GUARD_MARKERS) {
      if (!source.includes(marker)) missingGuards.push(`${script} lacks "${marker}"`);
    }
  }
  const isolationProblems = [...violations, ...missingGuards];
  record(
    'fixture-isolation',
    isolationProblems.length === 0 ? 'PASS' : 'FAIL',
    isolationProblems.length === 0
      ? `src/ free of fixture imports across ${sourceFiles.length} files; ${FIXTURE_SEED_SCRIPTS.length} seed/cleanup scripts keep production-refusal guards`
      : isolationProblems.join('; '),
  );

  // 6) artifact identity (only when a build produced evidence)
  let artifactSource;
  try {
    artifactSource = await readFile(resolve(root, 'dist/release-identity.json'), 'utf8');
  } catch {
    artifactSource = undefined;
  }
  if (artifactSource === undefined) {
    record(
      'artifact-identity',
      'INFO',
      'dist/release-identity.json absent; release:evidence:check --require-release owns the mandatory check',
    );
  } else {
    try {
      const metadata = JSON.parse(artifactSource);
      assertReleaseMetadataShape(metadata);
      const contractKeys = Object.values(ENV_KEYS);
      const secretValues = contractKeys
        .filter((key) => SECRET_KEY_PATTERN.test(key))
        .map((key) => env[key]);
      const leaks = countLeakedSecrets(collectStringValues(metadata), secretValues);
      record(
        'artifact-identity',
        leaks === 0 ? 'PASS' : 'FAIL',
        leaks === 0
          ? `release evidence ${metadata.releaseId} (${metadata.environment}) schema-valid and secret-free`
          : `release evidence contains ${leaks} secret-shaped or secret-matching value(s)`,
      );
    } catch (error) {
      record(
        'artifact-identity',
        'FAIL',
        error instanceof Error ? error.message : 'Invalid release evidence artifact.',
      );
    }
  }

  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = await runChecks();
  for (const result of results) console.log(`[${result.status}] ${result.check}: ${result.detail}`);
  const failed = results.filter((result) => result.status === 'FAIL');
  console.log(
    JSON.stringify({
      status: failed.length === 0 ? 'ok' : 'failed',
      checks: results.length,
      failed: failed.map((result) => result.check),
    }),
  );
  process.exit(failed.length === 0 ? 0 : 1);
}
