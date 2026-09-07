import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const renderConfig = parse(readFileSync(resolve(process.cwd(), 'render.yaml'), 'utf8')) as {
  services: Array<{
    healthCheckPath: string;
    buildCommand: string;
    startCommand: string;
    envVars: Array<{ key: string; value?: string; sync?: boolean }>;
  }>;
};

describe('Render production contract', () => {
  const service = renderConfig.services[0];
  const envKeys = new Set(service.envVars.map((env) => env.key));

  it('uses the canonical internal database contract and explicit runtime entrypoint', () => {
    expect(envKeys.has('DATABASE_URL')).toBe(true);
    expect(envKeys.has('INTERNAL_DATABASE_URL')).toBe(false);
    expect(envKeys.has('Internal_Database_URL')).toBe(false);
    expect(service.startCommand).toBe('node dist/server/entry.mjs');
    expect(service.buildCommand).not.toMatch(/db:(migrate|seed)|bootstrap:admin/);
  });

  it('does not expose one-time bootstrap inputs in the Web Service contract', () => {
    expect([...envKeys].filter((key) => key.startsWith('BOOTSTRAP_ADMIN_'))).toEqual([]);
  });

  it('points Render health checks at the canonical readiness endpoint', () => {
    expect(service.healthCheckPath).toBe('/api/health/ready');
  });
});
