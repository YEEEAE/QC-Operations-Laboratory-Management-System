import { DisabledAiProvider } from '../infrastructure/disabled-ai-provider.js';
import { GetAdvisoryUseCase } from './get-advisory.js';

export function aiAdvisoryDependencies() {
  return { requestAdvisory: new GetAdvisoryUseCase(new DisabledAiProvider()) };
}
