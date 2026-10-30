import { DisabledAiProvider } from '../infrastructure/disabled-ai-provider.js';
import type { AiProvider } from '../ports/ai-provider.js';
import { GetAdvisoryUseCase } from './get-advisory.js';

export function configuredAiProvider(): AiProvider {
  return new DisabledAiProvider();
}

export function aiAdvisoryDependencies() {
  return { requestAdvisory: new GetAdvisoryUseCase(configuredAiProvider()) };
}
