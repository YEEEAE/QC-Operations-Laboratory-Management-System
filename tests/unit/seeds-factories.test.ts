import { describe, expect, it } from 'vitest';
import { assertNonProductionSeedEnvironment, stableSeedUuid } from '../../db/seeds/common.js';
import { receivingFactory, taskFactory, userFactory } from '../helpers/factories.js';

describe('non-production seeds and deterministic factories', () => {
  it('requires an explicit environment guard and rejects production', () => {
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'development',
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'production',
        QC_SEED_ALLOW_NON_PRODUCTION: 'true',
      } as NodeJS.ProcessEnv),
    ).toThrow();
    expect(() =>
      assertNonProductionSeedEnvironment('development', {
        NODE_ENV: 'development',
        QC_SEED_ALLOW_NON_PRODUCTION: 'true',
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });

  it('returns reproducible fixtures with explicit state/version/scope overrides', () => {
    expect(stableSeedUuid('same')).toBe(stableSeedUuid('same'));
    expect(taskFactory(2, { state: 'COMPLETED', version: 7, scope: 'site-a' })).toMatchObject({
      state: 'COMPLETED',
      version: 7,
      scope: 'site-a',
    });
    expect(receivingFactory(2, { inspection_result: 'PASS', release_system: false })).toMatchObject(
      { inspection_result: 'PASS', release_system: false },
    );
    expect(userFactory(2, { account_state: 'DISABLED' })).toMatchObject({
      account_state: 'DISABLED',
    });
  });
});
