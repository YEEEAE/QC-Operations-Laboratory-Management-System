import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRequestLogger: vi.fn(),
  loggerError: vi.fn(),
  recordCounter: vi.fn(),
  withSpan: vi.fn(),
}));

vi.mock('../../../src/shared/observability/logger.js', () => ({
  createRequestLogger: (...args: unknown[]) => {
    mocks.createRequestLogger(...args);
    return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: mocks.loggerError };
  },
}));
vi.mock('../../../src/shared/observability/telemetry.js', () => ({
  currentCorrelation: () => ({
    requestId: 'request-123',
    traceId: 'trace-123',
    spanId: 'span-123',
  }),
  recordCounter: mocks.recordCounter,
  withSpan: async (_name: string, fn: () => Promise<void>) => fn(),
}));

import { reportDependencyFailure } from '../../../src/shared/observability/dependency-failure.js';

describe('dependency failure reporting', () => {
  it('emits correlated searchable log and metric fields without raw error content', async () => {
    await reportDependencyFailure({
      dependency: 'ai-provider',
      operation: 'availability_probe',
      error: new Error('credential=secret-value prompt=private-payload'),
    });

    expect(mocks.recordCounter).toHaveBeenCalledWith('qc_dependency_failures_total', 1, {
      dependency: 'ai-provider',
      operation: 'availability_probe',
      error_family: 'SYSTEM_DATABASE_UNAVAILABLE',
      outcome: 'error',
    });
    expect(mocks.loggerError).toHaveBeenCalledOnce();
    expect(mocks.createRequestLogger).toHaveBeenCalledWith({
      requestId: 'request-123',
      traceId: 'trace-123',
      spanId: 'span-123',
    });
    const [fields] = mocks.loggerError.mock.calls[0] as [Record<string, unknown>];
    expect(fields).toMatchObject({
      event: 'dependency.failure',
      dependency: 'ai-provider',
      operation: 'availability_probe',
      error_family: 'SYSTEM_DATABASE_UNAVAILABLE',
      outcome: 'error',
    });
    expect(JSON.stringify(fields)).not.toMatch(/secret-value|private-payload/);
  });
});
