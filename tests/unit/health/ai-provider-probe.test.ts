import { afterEach, describe, expect, it, vi } from 'vitest';

const availability = vi.hoisted(() => vi.fn());
vi.mock('../../../src/modules/ai-advisory/application/dependencies.js', () => ({
  configuredAiProvider: () => ({ availability }),
}));

import { resetAiConfigurationForTests } from '../../../src/modules/ai-advisory/infrastructure/ai-configuration.js';
import { PostgresSystemHealthProbes } from '../../../src/modules/system-health/infrastructure/postgres-health-probes.js';

const syntheticPolicy = JSON.stringify({
  status: 'APPROVED',
  policyId: 'synthetic-policy',
  version: '1',
  sourceReference: 'synthetic-test-only',
  approvedBy: 'synthetic-test-only',
  approvedAt: '2026-10-01T00:00:00Z',
  providers: ['groq'],
  processingLocation: 'synthetic-test-only',
  retentionDays: 0,
  deletionTerms: 'synthetic-test-only',
  providerTraining: false,
  consentVersion: '1',
  permittedDataClasses: ['SYNTHETIC'],
  prohibitedDataClasses: [
    'PERSONAL_DATA',
    'CREDENTIALS',
    'CONFIDENTIAL_QC',
    'CONTROLLED_RECORDS',
    'UNAUTHORIZED_CONTENT',
  ],
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  resetAiConfigurationForTests();
});

describe('AI provider system-health probe', () => {
  it('classifies an enabled, configured but unavailable provider without exposing configuration', async () => {
    vi.stubEnv('AI_EXTERNAL_PROCESSING_APPROVED', 'true');
    vi.stubEnv('AI_PROCESSING_POLICY_JSON', syntheticPolicy);
    vi.stubEnv('GROQ_API_KEY', 'synthetic-not-a-credential');
    vi.stubEnv('GROQ_MODEL', 'synthetic-model');
    availability.mockResolvedValue({ available: false });

    const health = await new PostgresSystemHealthProbes().aiProvider();

    expect(health).toMatchObject({ status: 'UNAVAILABLE', detail: 'PROVIDER_UNAVAILABLE' });
    expect(JSON.stringify(health)).not.toMatch(/synthetic-not-a-credential|synthetic-model/);
    expect(availability).toHaveBeenCalledOnce();
  });
});
