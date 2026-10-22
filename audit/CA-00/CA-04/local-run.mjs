// Test-only process launcher. Never reads .env or uses provider credentials.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const fixture = resolve('.tmp/ca04-fixture-env.json');
if (!existsSync(fixture)) {
  const values = { SESSION_SECRET: randomUUID() + randomUUID(), QC_E2E_LEAST_SESSION_TOKEN: randomUUID() + randomUUID() };
  for (const role of ['SUPERVISOR', 'MANAGER', 'ADMIN', 'EMPLOYEE', 'LEAST']) values[`QC_VERIFY_${role}_PASSWORD`] = randomUUID() + randomUUID();
  writeFileSync(fixture, JSON.stringify(values), { mode: 0o600 });
}
const env = {
  PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR,
  ...JSON.parse(readFileSync(fixture, 'utf8')),
  NODE_ENV: 'development', HOST: '127.0.0.1', PORT: '4331',
  DATABASE_URL: `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${resolve('.tmp/pg18/tls/ca.crt')}`,
  QC_SEED_ALLOW_NON_PRODUCTION: 'true', QC_VERIFICATION_SEED_ALLOW: 'true',
};
const child = spawn(process.argv[2], process.argv.slice(3), { env, stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 1));
