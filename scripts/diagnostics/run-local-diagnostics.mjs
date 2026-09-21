/* global console, process */

/**
 * Read-only local diagnostics (QC-100-FINAL-035-B).
 *
 * Prints the local toolchain, repository identity, schema head, and
 * configuration-validation state without exposing any secret value. Exits
 * non-zero when a declared contract is violated (fail-closed), so the command
 * is safe to wire into a local bring-up checklist. It never mutates the
 * repository, the database, or any external system.
 */

import { readdir, readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parseServerEnv } from '../../src/config/env.ts';
import { CRITICAL_ENV_KEYS } from '../../src/config/constants.ts';
import { parseLocalEnvFile } from '../db/load-local-env.ts';

const results = [];
const record = (check, status, detail) => {
  results.push({ check, status, detail });
  console.log(`[${status}] ${check}: ${detail}`);
};

const parseVersion = (value) => {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(value);
  return match ? { major: +match[1], minor: +match[2], patch: +match[3] } : undefined;
};

const satisfiesEngines = (version, engines) => {
  const current = parseVersion(version);
  if (!current) return false;
  for (const clause of engines.trim().split(/\s+/)) {
    const match = /^(>=|<=|>|<|=)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(clause);
    if (!match) continue;
    const [, operator = '=', major, minor = '0', patch = '0'] = match;
    const target = { major: +major, minor: +minor, patch: +patch };
    const order =
      Math.sign(current.major - target.major) ||
      Math.sign(current.minor - target.minor) ||
      Math.sign(current.patch - target.patch);
    if (operator === '>=' && order < 0) return false;
    if (operator === '<=' && order > 0) return false;
    if (operator === '>' && order <= 0) return false;
    if (operator === '<' && order >= 0) return false;
    if (operator === '=' && order !== 0) return false;
  }
  return true;
};

const manifest = JSON.parse(await readFile('package.json', 'utf8'));

const nodeOk = satisfiesEngines(process.version, manifest.engines.node);
record(
  'node-runtime',
  nodeOk ? 'PASS' : 'FAIL',
  `${process.version} ${nodeOk ? 'satisfies' : 'violates'} engines "${manifest.engines.node}"`,
);

let pnpmVersion;
try {
  pnpmVersion = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim();
} catch {
  pnpmVersion = 'unavailable';
}
const expectedPnpm = manifest.packageManager?.split('@')[1];
const pnpmOk = pnpmVersion === expectedPnpm;
record(
  'pnpm-version',
  pnpmOk ? 'PASS' : 'FAIL',
  `${pnpmVersion} ${pnpmOk ? 'matches' : 'does not match'} packageManager "${manifest.packageManager}"`,
);

let gitSha;
let dirtyCount;
try {
  gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  dirtyCount = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean).length;
  record(
    'repository-identity',
    'INFO',
    `HEAD ${gitSha}; ${dirtyCount} uncommitted path(s) (dirty tree is non-production evidence)`,
  );
} catch {
  record('repository-identity', 'FAIL', 'git metadata unavailable');
}

const migrations = (await readdir('db/migrations'))
  .filter((name) => /^\d{4}_.*\.sql$/.test(name))
  .sort();
record(
  'migration-source-head',
  'INFO',
  `${migrations.length} migrations; head ${migrations.at(-1) ?? 'none'}`,
);

const dotEnvPresent = await access('.env').then(
  () => true,
  () => false,
);

if (dotEnvPresent) {
  // Validate the same allowlisted .env merge the local db scripts apply, so a
  // fail-closed configuration stops here with key names instead of surfacing
  // mid-command. Values are never printed.
  const merged = { ...parseLocalEnvFile(await readFile('.env', 'utf8')), ...process.env };
  try {
    const env = parseServerEnv(merged);
    record(
      'dotenv-configuration',
      'PASS',
      `merged .env environment valid for NODE_ENV=${env.NODE_ENV}`,
    );
  } catch (error) {
    const missing = Array.isArray(error?.missing) ? error.missing : [];
    const invalid = Array.isArray(error?.invalid) ? error.invalid : [];
    record(
      'dotenv-configuration',
      'FAIL',
      `.env-driven scripts will fail closed; missing=[${missing.join(', ')}] invalid=[${invalid.join(', ')}]`,
    );
  }
}

try {
  const env = parseServerEnv(process.env);
  record(
    'configuration-validation',
    'PASS',
    `NODE_ENV=${env.NODE_ENV}; critical keys present: ${CRITICAL_ENV_KEYS.map(
      (key) => `${key}=${Boolean(env[key])}`,
    ).join(', ')}`,
  );
} catch (error) {
  const missing = Array.isArray(error?.missing) ? error.missing : [];
  const invalid = Array.isArray(error?.invalid) ? error.invalid : [];
  record(
    'configuration-validation',
    'FAIL',
    // Names only — values are never printed.
    `invalid environment; missing=[${missing.join(', ')}] invalid=[${invalid.join(', ')}]`,
  );
}
record(
  'local-env-file',
  'INFO',
  dotEnvPresent
    ? '.env present (untracked; values are never inspected)'
    : '.env absent; .env.example carries variable names only',
);

const failed = results.filter((result) => result.status === 'FAIL');
console.log(
  JSON.stringify({
    status: failed.length === 0 ? 'ok' : 'failed',
    checks: results.length,
    failed: failed.map((result) => result.check),
  }),
);
process.exit(failed.length === 0 ? 0 : 1);
