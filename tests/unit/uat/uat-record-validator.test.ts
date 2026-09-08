import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const validator = resolve(process.cwd(), 'audit/100-percent/uat/validate-uat-records.mjs');

const HEADER =
  'session_id,release_sha,environment,participant_role,task_id,start_time,end_time,time_on_task_seconds,task_success,error_count,backtracking_count,failed_navigation_count,form_correction_count,assistance,wrong_action_attempts,confidence_1_to_5,seq_1_to_7,observations,severity,participant_comments,scenario_status,task_accept_reject';

function validRow(overrides = ''): string {
  const base =
    'S-001,1d0ef756e4e3ab76af5a1af8e5aadaedc3ccc7c5,staging-uastest,QC Inspector,T-UAT-03,2026-09-08T10:00:00+03:00,2026-09-08T10:12:30+03:00,750,yes,1,0,0,0,none,0,4,6,completed receiving inspection without workaround,NONE,no issues observed,PASS,ACCEPT';
  return overrides || base;
}

function runValidator(
  files: Record<string, string>,
  args: string[] = [],
): { exitCode: number; output: string } {
  const root = mkdtempSync(join(tmpdir(), 'qc-uat-'));
  const paths: string[] = [];
  for (const [name, content] of Object.entries(files)) {
    const p = join(root, name);
    writeFileSync(p, content);
    paths.push(p);
  }
  try {
    const output = execFileSync('node', [validator, ...args, ...paths], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: String(output) };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: err.status ?? 1,
      output: String(err.stdout ?? '') + String(err.stderr ?? ''),
    };
  }
}

describe('UAT record validator', () => {
  it('ACCEPTS a structurally valid session file with one real session row', () => {
    const result = runValidator({ 'sessions.csv': `${HEADER}\n${validRow()}\n` }, ['--session']);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('sessions=1');
  });

  it('REPORTS UAT EXECUTION REQUIRED on a header-only file without inventing results', () => {
    const result = runValidator({ 'sessions.csv': `${HEADER}\n` }, ['--session']);
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('UAT EXECUTION REQUIRED');
    expect(result.output).toContain('sessions=0');
  });

  it('REJECTS a session file with a wrong header', () => {
    const result = runValidator({ 'sessions.csv': 'foo,bar,baz\n1,2,3\n' }, ['--session']);
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/header/i);
  });

  it('REJECTS end_time before start_time', () => {
    const row = validRow().replace('2026-09-08T10:12:30+03:00', '2026-09-08T09:00:00+03:00');
    const result = runValidator({ 'sessions.csv': `${HEADER}\n${row}\n` }, ['--session']);
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/end_time/i);
  });

  it('REJECTS an invalid scenario_status enum value', () => {
    const row = validRow().replace(',PASS,ACCEPT', ',PASSED,ACCEPT');
    const result = runValidator({ 'sessions.csv': `${HEADER}\n${row}\n` }, ['--session']);
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/scenario_status/i);
  });

  it('REJECTS rows when --release pins a different SHA', () => {
    const result = runValidator({ 'sessions.csv': `${HEADER}\n${validRow()}\n` }, [
      '--session',
      '--release',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/release_sha/i);
  });
});
