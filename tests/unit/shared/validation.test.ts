import { describe, expect, it } from 'vitest';
import { parsePageInput } from '../../../src/shared/pagination/page';
import { isUuid, uuidv7 } from '../../../src/shared/id/uuid';
import { AppError } from '../../../src/shared/errors/app-error';
import { errorToProblemDetails } from '../../../src/shared/errors/problem-details';
import { parseUuid, parseDateOnly, parseQuery } from '../../../src/shared/validation/parse';
import { commonSchemas } from '../../../src/shared/validation/common-schemas';
import { createRequestContext } from '../../../src/shared/http/request-context';
import { toRiyadhParts } from '../../../src/shared/time/riyadh';
import { InvalidEnvironmentError, parseServerEnv } from '../../../src/config/env';

describe('shared validation and technical primitives', () => {
  it('generates UUIDv7 technical ids and rejects malformed ids before lookup', () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(parseUuid(id)).toBe(id);
    expect(() => parseUuid('not-an-id')).toThrow(AppError);
  });

  it('keeps pagination bounded and normalizes malformed input', () => {
    expect(parsePageInput({ page: '2', pageSize: '50' })).toMatchObject({
      page: 2,
      pageSize: 50,
      offset: 50,
    });
    expect(parsePageInput({ page: '-2', pageSize: '999999' })).toMatchObject({
      page: 1,
      pageSize: 100,
      offset: 0,
    });
    expect(() => parsePageInput({ page: 'abc' })).toThrow(AppError);
  });

  it('validates date-only and query inputs canonically', () => {
    expect(parseDateOnly('2026-09-04')).toBe('2026-09-04');
    expect(() => parseDateOnly('04/09/2026')).toThrow(AppError);
    expect(parseQuery({ q: '  sample  ' }, commonSchemas.searchQuery)).toEqual({ q: 'sample' });
  });

  it('maps stale version and field errors to safe RFC 9457 details', () => {
    const error = new AppError('CONFLICT_STALE_VERSION', { safeMetadata: { currentVersion: 4 } });
    const problem = errorToProblemDetails(error, '/tasks/123', 'req-1');
    expect(problem).toMatchObject({
      status: 409,
      code: 'CONFLICT_STALE_VERSION',
      requestId: 'req-1',
    });
    expect(JSON.stringify(problem)).not.toContain('stack');
  });

  it('uses trusted UTC timestamps while displaying Riyadh rollover correctly', () => {
    expect(toRiyadhParts(new Date('2026-09-04T21:30:00.000Z'))).toMatchObject({
      date: '2026-09-05',
      time: '00:30:00',
    });
  });

  it('parses server configuration without echoing secret values', () => {
    expect(() => parseServerEnv({ NODE_ENV: 'production', SESSION_SECRET: 'short' })).toThrow(
      InvalidEnvironmentError,
    );
    try {
      parseServerEnv({ NODE_ENV: 'production', SESSION_SECRET: 'short' });
    } catch (error) {
      expect(String(error)).not.toContain('short');
    }
    expect(parseServerEnv({ NODE_ENV: 'test', SESSION_SECRET: 'a'.repeat(32) }).NODE_ENV).toBe(
      'test',
    );
  });

  it('preserves safe request correlation without trusting actor data', () => {
    const context = createRequestContext(
      new Request('https://example.test/tasks', {
        headers: {
          'x-request-id': 'req-client-123',
          traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
        },
      }),
    );
    expect(context.requestId).toBe('req-client-123');
    expect(context.traceId).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(context.actor).toBeUndefined();
  });
});
