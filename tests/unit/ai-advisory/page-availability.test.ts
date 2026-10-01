import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAiConfiguration,
  resetAiConfigurationForTests,
} from '../../../src/modules/ai-advisory/infrastructure/ai-configuration.js';
import { aiAdvisoryPageAvailability } from '../../../src/modules/ai-advisory/application/page-availability.js';

afterEach(() => {
  vi.unstubAllEnvs();
  resetAiConfigurationForTests();
});

describe('AI advisory page availability', () => {
  it('keeps provider-selection defaults separate from credentials and owner approval', () => {
    vi.stubEnv('AI_EXTERNAL_PROCESSING_APPROVED', 'false');
    vi.stubEnv('AI_PRIMARY_PROVIDER', 'groq');
    vi.stubEnv('AI_FALLBACK_PROVIDER', 'gemini');
    vi.stubEnv('AI_PROCESSING_POLICY_JSON', '');
    vi.stubEnv('GROQ_API_KEY', '');
    vi.stubEnv('GROQ_MODEL', '');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GEMINI_MODEL', '');
    resetAiConfigurationForTests();

    const result = aiAdvisoryPageAvailability();

    expect(getAiConfiguration().primaryProvider).toBe('groq');
    expect(result.approvalFlagGranted).toBe(false);
    expect(result.policyConfigured).toBe(false);
    expect(result.policyValid).toBe(false);
    expect(result.configuredProviders).toBe('');
    expect(result.missingCredentials).toEqual([
      'GROQ_API_KEY',
      'GROQ_MODEL',
      'GEMINI_API_KEY',
      'GEMINI_MODEL',
    ]);
    expect(JSON.stringify(result)).not.toContain('secret value');
  });

  it('reports invalid configuration by variable name without values', () => {
    vi.stubEnv('GROQ_BASE_URL', 'https://unapproved.example/');
    vi.stubEnv('GROQ_API_KEY', 'synthetic-secret-value');
    vi.stubEnv('GROQ_MODEL', 'synthetic-model');
    resetAiConfigurationForTests();

    const result = aiAdvisoryPageAvailability();

    expect(result.invalidConfiguration).toBe(true);
    expect(result.invalidFields).toContain('groqBaseUrl');
    expect(JSON.stringify(result)).not.toContain('synthetic-secret-value');
    expect(JSON.stringify(result)).not.toContain('unapproved.example');
  });

  it('reports credentials independently from the absent approval and policy gates', () => {
    vi.stubEnv('AI_EXTERNAL_PROCESSING_APPROVED', 'false');
    vi.stubEnv('AI_PROCESSING_POLICY_JSON', '');
    vi.stubEnv('GROQ_API_KEY', 'synthetic-secret-value');
    vi.stubEnv('GROQ_MODEL', 'synthetic-model');
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GEMINI_MODEL', '');
    resetAiConfigurationForTests();

    const result = aiAdvisoryPageAvailability();

    expect(result.credentialProviders).toBe('groq');
    expect(result.configuredProviders).toBe('');
    expect(result.approvalFlagGranted).toBe(false);
    expect(result.policyValid).toBe(false);
    expect(result.missingCredentials).toEqual(['GEMINI_API_KEY', 'GEMINI_MODEL']);
    expect(JSON.stringify(result)).not.toContain('synthetic-secret-value');
    expect(JSON.stringify(result)).not.toContain('synthetic-model');
  });
});
