import { getAiConfiguration } from '../infrastructure/ai-configuration.js';

export function aiAdvisoryPageAvailability() {
  const configuration = getAiConfiguration();
  return {
    configuredProviders: Object.keys(configuration.providers).join(' and '),
    externalProcessingApproved: configuration.externalProcessingApproved,
    processingPolicy: configuration.processingPolicy
      ? {
          policyId: configuration.processingPolicy.policyId,
          version: configuration.processingPolicy.version,
          sourceReference: configuration.processingPolicy.sourceReference,
          providers: configuration.processingPolicy.providers,
          processingLocation: configuration.processingPolicy.processingLocation,
          retentionDays: configuration.processingPolicy.retentionDays,
          deletionTerms: configuration.processingPolicy.deletionTerms,
          consentVersion: configuration.processingPolicy.consentVersion,
          permittedDataClasses: configuration.processingPolicy.permittedDataClasses,
        }
      : undefined,
  };
}
