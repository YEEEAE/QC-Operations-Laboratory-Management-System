import { getAiConfiguration, type AiProviderConfig } from '../infrastructure/ai-configuration.js';
import { DisabledAiProvider } from '../infrastructure/disabled-ai-provider.js';
import { FailoverAiProvider } from '../infrastructure/failover-ai-provider.js';
import { GeminiAiProvider } from '../infrastructure/gemini-ai-provider.js';
import { GroqAiProvider } from '../infrastructure/groq-ai-provider.js';
import type { AiProvider } from '../ports/ai-provider.js';
import { GetAdvisoryUseCase } from './get-advisory.js';

function providerFor(kind: 'groq' | 'gemini', config: AiProviderConfig | undefined): AiProvider {
  if (!config) return new DisabledAiProvider();
  return kind === 'groq' ? new GroqAiProvider(config) : new GeminiAiProvider(config);
}

export function configuredAiProvider(): AiProvider {
  const config = getAiConfiguration();
  if (Object.keys(config.providers).length === 0) return new DisabledAiProvider();
  return new FailoverAiProvider(
    providerFor(config.primaryProvider, config.providers[config.primaryProvider]),
    providerFor(config.fallbackProvider, config.providers[config.fallbackProvider]),
  );
}

export function aiAdvisoryDependencies() {
  return { requestAdvisory: new GetAdvisoryUseCase(configuredAiProvider()) };
}
