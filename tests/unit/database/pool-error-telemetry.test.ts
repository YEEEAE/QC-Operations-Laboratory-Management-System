import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

import { attachPoolErrorTelemetry } from '../../../src/shared/database/pool.js';

describe('asynchronous pool error telemetry', () => {
  it('routes an injected idle-client failure to a bounded, searchable signal', async () => {
    const reportFailure = vi.fn().mockResolvedValue(undefined);
    const pool = new EventEmitter();
    attachPoolErrorTelemetry(pool as never, reportFailure);
    pool.emit('error', new Error('postgresql://user:secret@host/db SELECT private_rows'));

    expect(reportFailure).toHaveBeenCalledOnce();
    const [signal] = reportFailure.mock.calls[0] as [
      {
        dependency: string;
        operation: string;
        error: { code?: string; cause?: unknown };
      },
    ];
    expect(signal).toMatchObject({
      dependency: 'postgres',
      operation: 'pool_client',
      error: { code: 'SYSTEM_DATABASE_UNAVAILABLE' },
    });
    expect(
      JSON.stringify({
        dependency: signal.dependency,
        operation: signal.operation,
        code: signal.error.code,
      }),
    ).not.toMatch(/secret|private_rows|postgresql:|host/);
  });
});
