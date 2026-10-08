import { describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  localDrillConnection,
  assertSeparateDrillDatabases,
  runLocalRestoreDrill,
} from '../../../scripts/recovery/run-monthly-restore-drill.js';
vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }));
const connection = (host = '127.0.0.1', name = 'qc_local_drill_source') =>
  `postgresql://operator:secret@${host}:55439/${name}`;
describe('isolated restore drill connection boundary', () => {
  it.each(['provider.example', '127.0.0.2', 'evil.localhost'])('denies non-loopback %s', (host) =>
    expect(() => localDrillConnection(connection(host))).toThrow('LOCAL_ISOLATED_TARGET_REQUIRED'),
  );
  it.each(['production', 'qc_test', 'qc_local_drill_source/other'])(
    'denies non-isolated database %s',
    (database) => expect(() => localDrillConnection(connection('127.0.0.1', database))).toThrow(),
  );
  it('denies libpq host or service override', () => {
    expect(() => localDrillConnection(`${connection()}?host=provider.example`)).toThrow();
    expect(() => localDrillConnection(`${connection()}?service=production`)).toThrow();
  });
  it('does not inherit runtime/provider environment or put a password into public identity', () => {
    const parsed = localDrillConnection(connection());
    expect(parsed.database).toBe('qc_local_drill_source');
    expect(parsed.env.PGPASSWORD).toBe('secret');
    expect(parsed.user).toBe('operator');
    expect(parsed.env.DATABASE_URL).toBeUndefined();
    expect(parsed.env.PGSERVICE).toBeUndefined();
    expect(parsed.env.PGPASSFILE).toBe('/dev/null');
  });
  it('rejects source/target loopback aliases for the same database', () => {
    expect(() =>
      assertSeparateDrillDatabases(
        localDrillConnection(connection()),
        localDrillConnection(connection('localhost')),
      ),
    ).toThrow('SOURCE_TARGET_MUST_DIFFER');
  });
  it('accepts a different isolated target', () => {
    expect(() =>
      assertSeparateDrillDatabases(
        localDrillConnection(connection()),
        localDrillConnection(connection('localhost', 'qc_local_drill_restore')),
      ),
    ).not.toThrow();
  });
});
describe('restore execution refusal', () => {
  const input = () => ({
    source: connection(),
    target: connection('127.0.0.1', 'qc_local_drill_restore'),
    evidenceDir: mkdtempSync(join(tmpdir(), 'qc-local-drill-test-')),
    pgBin: '/synthetic/pg18',
  });
  it('refuses a nonempty target before dumping or restoring', () => {
    vi.mocked(spawnSync)
      .mockReset()
      .mockReturnValue({ status: 0, stdout: '1\n' } as never);
    expect(() => runLocalRestoreDrill(input())).toThrow('ISOLATED_TARGET_NOT_EMPTY');
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });
  it('rejects archive inspection failure without restore or exposing diagnostics', () => {
    vi.mocked(spawnSync)
      .mockReset()
      .mockImplementation((tool, args) => {
        if (String(tool).endsWith('pg_restore'))
          return { status: 1, stdout: '', stderr: 'secret provider details' } as never;
        const query = (args as string[])?.at(-1) ?? '';
        return {
          status: 0,
          stdout: query.startsWith('SELECT count(*) FROM pg_class') ? '0\n' : '',
        } as never;
      });
    expect(() => runLocalRestoreDrill(input())).toThrow('LOCAL_DRILL_PG_RESTORE_FAILED');
    const restoreCalls = vi
      .mocked(spawnSync)
      .mock.calls.filter((call) => String(call[0]).endsWith('pg_restore'));
    expect(restoreCalls).toHaveLength(1);
    expect(restoreCalls[0]?.[1]).toContain('--list');
  });
});
