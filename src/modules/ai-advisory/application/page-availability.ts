import { getAiConfiguration } from '../infrastructure/ai-configuration.js';

export function aiAdvisoryPageAvailability() {
  const configuration = getAiConfiguration();
  return {
    configuredProviders: Object.keys(configuration.providers).join(' and '),
    externalProcessingApproved: configuration.externalProcessingApproved,
  };
}
