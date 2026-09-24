import { z } from 'zod';
import { ENV_KEYS } from '../../../config/constants.js';
import type { AdvisoryDataClass } from '../ports/ai-provider.js';

const providerSchema = z.enum(['groq', 'gemini']);
const groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta';

const optionalHttpsEndpoint = (allowedEndpoint: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === allowedEndpoint,
      `must exactly match the approved provider endpoint`,
    )
    .optional();

const configurationSchema = z.object({
  externalProcessingApproved: z.enum(['true', 'false']).default('false'),
  primaryProvider: providerSchema.default('groq'),
  fallbackProvider: providerSchema.default('gemini'),
  groqApiKey: z.string().trim().min(1).optional(),
  groqModel: z.string().trim().min(1).max(200).optional(),
  groqBaseUrl: optionalHttpsEndpoint(groqEndpoint),
  geminiApiKey: z.string().trim().min(1).optional(),
  geminiModel: z.string().trim().min(1).max(200).optional(),
  geminiBaseUrl: optionalHttpsEndpoint(geminiEndpoint),
  processingPolicyJson: z.string().min(2).max(10_000).optional(),
});

const processingPolicySchema = z.object({
  status: z.literal('APPROVED'),
  policyId: z.string().trim().min(1).max(120),
  version: z.string().trim().min(1).max(40),
  sourceReference: z.string().trim().min(1).max(500),
  approvedBy: z.string().trim().min(1).max(120),
  approvedAt: z
    .string()
    .refine(
      (value) => !Number.isNaN(Date.parse(value)) && /(?:Z|[+-]\d\d:\d\d)$/.test(value),
      'must be an ISO timestamp with timezone',
    ),
  providers: z.array(providerSchema).min(1).max(2),
  processingLocation: z.string().trim().min(1).max(120),
  retentionDays: z.number().int().min(0).max(3650),
  deletionTerms: z.string().trim().min(1).max(500),
  providerTraining: z.literal(false),
  consentVersion: z.string().trim().min(1).max(40),
  permittedDataClasses: z
    .array(z.enum(['PUBLIC', 'SYNTHETIC', 'AUTHORIZED_NONCONFIDENTIAL_EXCERPT']))
    .min(1),
  prohibitedDataClasses: z
    .array(
      z.enum([
        'PERSONAL_DATA',
        'CREDENTIALS',
        'CONFIDENTIAL_QC',
        'CONTROLLED_RECORDS',
        'UNAUTHORIZED_CONTENT',
      ]),
    )
    .refine((values) => new Set(values).size === 5),
});

export type AiProcessingPolicy = z.infer<typeof processingPolicySchema>;

export interface AiProviderConfig {
  kind: 'groq' | 'gemini';
  apiKey: string;
  model: string;
  baseUrl: string;
  permittedDataClasses: readonly AdvisoryDataClass[];
}

export interface AiConfiguration {
  externalProcessingApproved: boolean;
  primaryProvider: 'groq' | 'gemini';
  fallbackProvider: 'groq' | 'gemini';
  providers: Partial<Record<'groq' | 'gemini', AiProviderConfig>>;
  invalidFields: readonly string[];
  processingPolicy?: AiProcessingPolicy;
}

const value = (input: Record<string, string | undefined>, canonical: string, legacy: string) =>
  input[canonical]?.trim() || input[legacy]?.trim();

const defaultGroqBaseUrl = groqEndpoint;
const defaultGeminiBaseUrl = geminiEndpoint;

function parseCandidate(input: Record<string, string | undefined>) {
  const parsed = configurationSchema.safeParse({
    externalProcessingApproved: input[ENV_KEYS.aiExternalProcessingApproved] || undefined,
    primaryProvider: input[ENV_KEYS.aiPrimaryProvider] || undefined,
    fallbackProvider: input[ENV_KEYS.aiFallbackProvider] || undefined,
    groqApiKey: value(input, ENV_KEYS.groqApiKey, 'API_groq_Key'),
    groqModel: value(input, ENV_KEYS.groqModel, 'groq_model'),
    groqBaseUrl: value(input, ENV_KEYS.groqBaseUrl, 'URL_groq'),
    geminiApiKey: value(input, ENV_KEYS.geminiApiKey, 'API_gemini_Key'),
    geminiModel: value(input, ENV_KEYS.geminiModel, 'gemini_model'),
    geminiBaseUrl: value(input, ENV_KEYS.geminiBaseUrl, 'URL_gemini'),
    processingPolicyJson: input[ENV_KEYS.aiProcessingPolicyJson],
  });
  return parsed;
}

export function parseAiConfiguration(input: Record<string, string | undefined>): AiConfiguration {
  const parsed = parseCandidate(input);
  if (!parsed.success) {
    const invalidFields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    return {
      externalProcessingApproved: false,
      primaryProvider: 'groq',
      fallbackProvider: 'gemini',
      providers: {},
      invalidFields,
    };
  }

  const data = parsed.data;
  let processingPolicy: AiProcessingPolicy | undefined;
  if (data.processingPolicyJson) {
    try {
      const policy = processingPolicySchema.safeParse(JSON.parse(data.processingPolicyJson));
      if (policy.success) processingPolicy = policy.data;
    } catch {
      // A missing, malformed, or incomplete policy source keeps every provider disabled.
    }
  }
  const providers: Partial<Record<'groq' | 'gemini', AiProviderConfig>> = {};
  if (
    data.externalProcessingApproved === 'true' &&
    processingPolicy?.providers.includes('groq') &&
    data.groqApiKey &&
    data.groqModel
  ) {
    providers.groq = {
      kind: 'groq',
      apiKey: data.groqApiKey,
      model: data.groqModel,
      baseUrl: data.groqBaseUrl || defaultGroqBaseUrl,
      permittedDataClasses: processingPolicy!.permittedDataClasses,
    };
  }
  if (
    data.externalProcessingApproved === 'true' &&
    processingPolicy?.providers.includes('gemini') &&
    data.geminiApiKey &&
    data.geminiModel
  ) {
    providers.gemini = {
      kind: 'gemini',
      apiKey: data.geminiApiKey,
      model: data.geminiModel,
      baseUrl: data.geminiBaseUrl || defaultGeminiBaseUrl,
      permittedDataClasses: processingPolicy!.permittedDataClasses,
    };
  }
  return {
    externalProcessingApproved:
      data.externalProcessingApproved === 'true' && Boolean(processingPolicy),
    primaryProvider: data.primaryProvider,
    fallbackProvider: data.fallbackProvider,
    providers,
    invalidFields: [],
    ...(processingPolicy ? { processingPolicy } : {}),
  };
}

let cachedConfiguration: AiConfiguration | undefined;
export function getAiConfiguration(): AiConfiguration {
  return (cachedConfiguration ??= parseAiConfiguration(process.env));
}

export function resetAiConfigurationForTests(): void {
  cachedConfiguration = undefined;
}

export const aiConfigurationDefaults = {
  groqBaseUrl: defaultGroqBaseUrl,
  geminiBaseUrl: defaultGeminiBaseUrl,
} as const;
