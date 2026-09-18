import { z } from 'zod';
import { ENV_KEYS } from '../../../config/constants.js';

const providerSchema = z.enum(['groq', 'gemini']);
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'must be an HTTPS URL')
  .optional();

const configurationSchema = z.object({
  primaryProvider: providerSchema.default('groq'),
  fallbackProvider: providerSchema.default('gemini'),
  groqApiKey: z.string().trim().min(1).optional(),
  groqModel: z.string().trim().min(1).max(200).optional(),
  groqBaseUrl: optionalUrl,
  geminiApiKey: z.string().trim().min(1).optional(),
  geminiModel: z.string().trim().min(1).max(200).optional(),
  geminiBaseUrl: optionalUrl,
});

export interface AiProviderConfig {
  kind: 'groq' | 'gemini';
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AiConfiguration {
  primaryProvider: 'groq' | 'gemini';
  fallbackProvider: 'groq' | 'gemini';
  providers: Partial<Record<'groq' | 'gemini', AiProviderConfig>>;
  invalidFields: readonly string[];
}

const value = (input: Record<string, string | undefined>, canonical: string, legacy: string) =>
  input[canonical]?.trim() || input[legacy]?.trim();

const defaultGroqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';
const defaultGeminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

function parseCandidate(input: Record<string, string | undefined>) {
  const parsed = configurationSchema.safeParse({
    primaryProvider: input[ENV_KEYS.aiPrimaryProvider] || undefined,
    fallbackProvider: input[ENV_KEYS.aiFallbackProvider] || undefined,
    groqApiKey: value(input, ENV_KEYS.groqApiKey, 'API_groq_Key'),
    groqModel: value(input, ENV_KEYS.groqModel, 'groq_model'),
    groqBaseUrl: value(input, ENV_KEYS.groqBaseUrl, 'URL_groq'),
    geminiApiKey: value(input, ENV_KEYS.geminiApiKey, 'API_gemini_Key'),
    geminiModel: value(input, ENV_KEYS.geminiModel, 'gemini_model'),
    geminiBaseUrl: value(input, ENV_KEYS.geminiBaseUrl, 'URL_gemini'),
  });
  return parsed;
}

export function parseAiConfiguration(input: Record<string, string | undefined>): AiConfiguration {
  const parsed = parseCandidate(input);
  if (!parsed.success) {
    const invalidFields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    return {
      primaryProvider: 'groq',
      fallbackProvider: 'gemini',
      providers: {},
      invalidFields,
    };
  }

  const data = parsed.data;
  const providers: Partial<Record<'groq' | 'gemini', AiProviderConfig>> = {};
  if (data.groqApiKey && data.groqModel) {
    providers.groq = {
      kind: 'groq',
      apiKey: data.groqApiKey,
      model: data.groqModel,
      baseUrl: data.groqBaseUrl || defaultGroqBaseUrl,
    };
  }
  if (data.geminiApiKey && data.geminiModel) {
    providers.gemini = {
      kind: 'gemini',
      apiKey: data.geminiApiKey,
      model: data.geminiModel,
      baseUrl: data.geminiBaseUrl || defaultGeminiBaseUrl,
    };
  }
  return {
    primaryProvider: data.primaryProvider,
    fallbackProvider: data.fallbackProvider,
    providers,
    invalidFields: [],
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
