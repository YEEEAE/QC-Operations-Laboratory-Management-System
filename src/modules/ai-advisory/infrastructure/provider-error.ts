export type AiProviderErrorKind =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION'
  | 'FORBIDDEN'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'TEMPORARY_FAILURE'
  | 'NETWORK'
  | 'INVALID_RESPONSE'
  | 'SAFETY_BLOCK'
  | 'NOT_CONFIGURED';

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiProviderErrorKind,
    readonly provider: 'groq' | 'gemini',
  ) {
    super(`AI provider ${kind.toLowerCase()}`);
    this.name = 'AiProviderError';
  }
}

export function isRetriableAiProviderError(error: unknown): boolean {
  return (
    error instanceof AiProviderError &&
    ['TIMEOUT', 'RATE_LIMIT', 'TEMPORARY_FAILURE', 'NETWORK', 'MODEL_UNAVAILABLE'].includes(
      error.kind,
    )
  );
}
