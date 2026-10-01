import { getAiConfiguration } from '../infrastructure/ai-configuration.js';

export function aiAdvisoryPageAvailability() {
  const configuration = getAiConfiguration();
  const processingPolicy = configuration.processingPolicy;
  const providersToCheck = processingPolicy?.providers ?? [
    configuration.primaryProvider,
    configuration.fallbackProvider,
  ];
  const missingCredentials = [...new Set(providersToCheck)].flatMap((provider) => {
    const presence = configuration.credentialPresence[provider];
    const prefix = provider === 'groq' ? 'GROQ' : 'GEMINI';
    return [
      ...(!presence.apiKey ? [`${prefix}_API_KEY`] : []),
      ...(!presence.model ? [`${prefix}_MODEL`] : []),
    ];
  });
  return {
    configuredProviders: Object.keys(configuration.providers).join(' and '),
    primaryProvider: configuration.primaryProvider,
    fallbackProvider: configuration.fallbackProvider,
    credentialProviders: (['groq', 'gemini'] as const)
      .filter((provider) => {
        const credentials = configuration.credentialPresence[provider];
        return credentials.apiKey && credentials.model;
      })
      .join(' and '),
    externalProcessingApproved: configuration.externalProcessingApproved,
    approvalFlagGranted: process.env.AI_EXTERNAL_PROCESSING_APPROVED?.trim() === 'true',
    policyConfigured: Boolean(process.env.AI_PROCESSING_POLICY_JSON?.trim()),
    policyValid: Boolean(processingPolicy),
    invalidConfiguration: configuration.invalidFields.length > 0,
    invalidFields: configuration.invalidFields,
    missingCredentials,
    processingPolicy: processingPolicy
      ? {
          policyId: processingPolicy.policyId,
          version: processingPolicy.version,
          sourceReference: processingPolicy.sourceReference,
          providers: processingPolicy.providers,
          processingLocation: processingPolicy.processingLocation,
          retentionDays: processingPolicy.retentionDays,
          deletionTerms: processingPolicy.deletionTerms,
          consentVersion: processingPolicy.consentVersion,
          permittedDataClasses: processingPolicy.permittedDataClasses,
        }
      : undefined,
  };
}
