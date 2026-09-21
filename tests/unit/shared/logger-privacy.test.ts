import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { createRequestLogger } from '../../../src/shared/observability/logger.js';

describe('structured logger privacy redaction', () => {
  it('redacts personal identifiers, query values, form values, and AI content', async () => {
    let output = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });
    const logger = createRequestLogger(undefined, destination);
    logger.info(
      {
        email: 'person@example.test',
        request: { query: 'private search', formValues: { note: 'QC record text' } },
        prompt: 'private advisory question',
        response: { content: 'sensitive provider response' },
      },
      'request handled',
    );

    await new Promise<void>((resolve) => destination.end(resolve));
    expect(output).not.toContain('person@example.test');
    expect(output).not.toContain('private search');
    expect(output).not.toContain('QC record text');
    expect(output).not.toContain('private advisory question');
    expect(output).not.toContain('sensitive provider response');
    expect(output).toContain('[REDACTED]');
  });
});
