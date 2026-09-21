import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-036-A — disposable fixture isolation guards.
 *
 * Every seed/cleanup script that can create or mutate disposable `verify-*` /
 * `uat-*` data must refuse a production runtime and a production-looking
 * database before it opens a connection. These tests execute the real scripts
 * with hostile environments; the refusal happens before any pool is created,
 * so no database is contacted.
 */

const SCRIPTS = [
  'scripts/verification/seed-verification-fixtures.ts',
  'scripts/verification/cleanup-verification-fixtures.ts',
  'scripts/uat/seed-uat-personas.ts',
  'scripts/uat/cleanup-uat-personas.ts',
];

const allowFlags = {
  QC_SEED_ALLOW_NON_PRODUCTION: 'true',
  QC_VERIFICATION_SEED_ALLOW: 'true',
  QC_UAT_SEED_ALLOW: 'true',
  QC_UAT_INGEST_ALLOW: 'true',
  QC_VERIFY_SYSTEM_OWNER_PASSWORD: 'x'.repeat(24),
  QC_VERIFY_SUPERVISOR_PASSWORD: 'x'.repeat(24),
  QC_VERIFY_MANAGER_PASSWORD: 'x'.repeat(24),
  QC_VERIFY_ADMIN_PASSWORD: 'x'.repeat(24),
  QC_VERIFY_EMPLOYEE_PASSWORD: 'x'.repeat(24),
  QC_VERIFY_LEAST_PASSWORD: 'x'.repeat(24),
  QC_UAT_SYSTEM_OWNER_PASSWORD: 'x'.repeat(24),
  QC_UAT_QCM_PASSWORD: 'x'.repeat(24),
  QC_UAT_SUPERVISOR_PASSWORD: 'x'.repeat(24),
  QC_UAT_QC01_PASSWORD: 'x'.repeat(24),
  QC_UAT_QC02_PASSWORD: 'x'.repeat(24),
  QC_UAT_QC03_PASSWORD: 'x'.repeat(24),
};

type Outcome = { status: number; message: string };

function runScript(script: string, env: Record<string, string>): Outcome {
  try {
    execFileSync('node', ['--import=tsx', script], {
      encoding: 'utf8',
      env: { ...process.env, ...env },
    });
    return { status: 0, message: '' };
  } catch (error) {
    const failure = error as { stderr?: string; status?: number };
    return { status: failure.status ?? 1, message: failure.stderr ?? '' };
  }
}

describe.each(SCRIPTS)('QC-100-FINAL-036-A isolation guard — %s', (script) => {
  it('refuses to run under NODE_ENV=production even with every allow flag set', () => {
    const outcome = runScript(script, {
      ...allowFlags,
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://operator:secret@127.0.0.1:5432/qc_operations',
    });
    expect(outcome.status).not.toBe(0);
    expect(outcome.message).toContain('NODE_ENV must be development or test');
  });

  it('refuses a production-looking DATABASE_URL even when NODE_ENV is test', () => {
    const outcome = runScript(script, {
      ...allowFlags,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://operator:secret@db.qclevel.top:5432/qc_operations',
    });
    expect(outcome.status).not.toBe(0);
    expect(outcome.message).toContain('looks like production');
  });

  it('refuses a Render-hosted production database host', () => {
    const outcome = runScript(script, {
      ...allowFlags,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://operator:secret@dpg-abc.oregon-postgres.render.com:5432/qc',
    });
    expect(outcome.status).not.toBe(0);
    expect(outcome.message).toContain('looks like production');
  });
});
