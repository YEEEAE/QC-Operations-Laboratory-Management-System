import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  aiConfigurationDefaults,
  parseAiConfiguration,
} from '../../../src/modules/ai-advisory/infrastructure/ai-configuration.js';
import { GeminiAiProvider } from '../../../src/modules/ai-advisory/infrastructure/gemini-ai-provider.js';
import { GroqAiProvider } from '../../../src/modules/ai-advisory/infrastructure/groq-ai-provider.js';
import { FailoverAiProvider } from '../../../src/modules/ai-advisory/infrastructure/failover-ai-provider.js';
import type { AiProvider } from '../../../src/modules/ai-advisory/ports/ai-provider.js';
import { GetAdvisoryUseCase } from '../../../src/modules/ai-advisory/application/get-advisory.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const config = {
  kind: 'groq' as const,
  apiKey: 'groq-secret-test',
  model: 'llama-test',
  baseUrl: 'https://groq.test/v1/chat/completions',
};
const geminiConfig = {
  kind: 'gemini' as const,
  apiKey: 'gemini-secret-test',
  model: 'gemini-test',
  baseUrl: 'https://gemini.test/v1beta',
};
const request = { mode: 'SUMMARIZE' as const, question: 'Summarize this.', context: [] };
const actor: ActorContext = {
  id: '01900000-0000-7000-8000-0000000000e1',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: ['PERM-AI-USE', 'PERM-AI-SUMMARIZE'].map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes: ['GLOBAL'],
  })),
};

afterEach(() => vi.restoreAllMocks());

describe('AI provider configuration', () => {
  it('uses canonical names and defaults without exposing secret values', () => {
    const result = parseAiConfiguration({
      AI_PRIMARY_PROVIDER: 'groq',
      AI_FALLBACK_PROVIDER: 'gemini',
      GROQ_API_KEY: 'canonical-groq-secret',
      GROQ_MODEL: 'llama-3',
      GEMINI_API_KEY: 'canonical-gemini-secret',
      GEMINI_MODEL: 'gemini-2',
    });
    expect(result.primaryProvider).toBe('groq');
    expect(result.providers.groq?.model).toBe('llama-3');
    expect(result.providers.gemini?.baseUrl).toBe(aiConfigurationDefaults.geminiBaseUrl);
    expect(JSON.stringify(result)).toContain('canonical-groq-secret');
  });

  it('supports legacy names during transition and rejects non-HTTPS endpoints', () => {
    const legacy = parseAiConfiguration({
      API_groq_Key: 'legacy-groq-secret',
      groq_model: 'legacy-model',
      URL_groq: 'https://legacy.test/chat/completions',
      API_gemini_Key: 'legacy-gemini-secret',
      gemini_model: 'legacy-gemini',
    });
    expect(legacy.providers.groq?.apiKey).toBe('legacy-groq-secret');
    expect(legacy.providers.gemini?.model).toBe('legacy-gemini');
    expect(parseAiConfiguration({ GROQ_BASE_URL: 'http://unsafe.test' }).invalidFields).toContain(
      'groqBaseUrl',
    );
  });
});

describe('Groq and Gemini HTTP contracts', () => {
  it('normalizes Groq success and uses bearer authentication', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'Groq advisory.' } }] }), {
        status: 200,
      }),
    );
    await expect(new GroqAiProvider(config).complete(request)).resolves.toEqual({
      text: 'Groq advisory.',
    });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({ authorization: 'Bearer groq-secret-test' }),
    });
  });

  it.each([
    [401, 'AUTHENTICATION'],
    [429, 'RATE_LIMIT'],
    [500, 'TEMPORARY_FAILURE'],
  ] as const)('maps Groq HTTP %s without exposing provider body', async (status, kind) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'secret provider detail' } }), { status }),
    );
    await expect(new GroqAiProvider(config).complete(request)).rejects.toMatchObject({ kind });
  });

  it('normalizes Gemini success and sends the key only in a server-side header', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Gemini advisory.' }] } }] }),
          { status: 200 },
        ),
      );
    await expect(new GeminiAiProvider(geminiConfig).complete(request)).resolves.toEqual({
      text: 'Gemini advisory.',
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain('gemini-secret-test');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: expect.objectContaining({ 'x-goog-api-key': 'gemini-secret-test' }),
    });
    expect(JSON.stringify(fetchMock.mock.calls[0]?.[1]?.body)).not.toContain('gemini-secret-test');
  });

  it('rejects Gemini safety blocks and malformed output', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{}] }), { status: 200 }));
    await expect(new GeminiAiProvider(geminiConfig).complete(request)).rejects.toMatchObject({
      kind: 'SAFETY_BLOCK',
    });
    await expect(new GeminiAiProvider(geminiConfig).complete(request)).rejects.toMatchObject({
      kind: 'INVALID_RESPONSE',
    });
  });
});

describe('bounded provider failover', () => {
  const available = (complete: AiProvider['complete']): AiProvider => ({
    availability: async () => ({ available: true }),
    complete,
  });

  it('Groq success does not call Gemini', async () => {
    const groq = vi.fn(async () => ({ text: 'primary' }));
    const gemini = vi.fn(async () => ({ text: 'fallback' }));
    await expect(
      new FailoverAiProvider(available(groq), available(gemini)).complete(request),
    ).resolves.toEqual({
      text: 'primary',
    });
    expect(gemini).not.toHaveBeenCalled();
  });

  it('falls back once for a retriable provider failure', async () => {
    const groq = vi.fn(async () => {
      throw new Error('network');
    });
    const gemini = vi.fn(async () => ({ text: 'fallback' }));
    const primary = available(groq);
    const fallback = available(gemini);
    // A real provider error is required for retry classification.
    primary.complete = async () => {
      const { AiProviderError } =
        await import('../../../src/modules/ai-advisory/infrastructure/provider-error.js');
      throw new AiProviderError('NETWORK', 'groq');
    };
    await expect(new FailoverAiProvider(primary, fallback).complete(request)).resolves.toEqual({
      text: 'fallback',
    });
    expect(gemini).toHaveBeenCalledTimes(1);
  });

  it('returns the fixed degraded outcome when both providers are unavailable', async () => {
    const unavailable: AiProvider = {
      availability: async () => ({ available: false, reason: 'UNAVAILABLE' }),
      complete: async () => ({ text: 'must not run' }),
    };
    const result = await new GetAdvisoryUseCase(
      new FailoverAiProvider(unavailable, unavailable),
    ).execute({
      actor,
      mode: 'SUMMARIZE',
      question: 'What changed?',
      context: [],
      requestId: 'provider-test',
    });
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.message).toContain('temporarily unavailable');
  });
});
