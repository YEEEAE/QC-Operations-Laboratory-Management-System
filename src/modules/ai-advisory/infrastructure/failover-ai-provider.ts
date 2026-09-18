import type {
  AiAdvisoryRequest,
  AiProvider,
  AiProviderAvailability,
} from '../ports/ai-provider.js';
import { DisabledAiProvider } from './disabled-ai-provider.js';
import { isRetriableAiProviderError } from './provider-error.js';

export class FailoverAiProvider implements AiProvider {
  private readonly disabled = new DisabledAiProvider();

  constructor(
    private readonly primary: AiProvider,
    private readonly fallback: AiProvider,
  ) {}

  async availability(): Promise<AiProviderAvailability> {
    const primary = await this.safeAvailability(this.primary);
    if (primary.available) return primary;
    const fallback = await this.safeAvailability(this.fallback);
    return fallback.available ? fallback : { available: false, reason: 'UNAVAILABLE' };
  }

  async complete(request: AiAdvisoryRequest): Promise<unknown> {
    const primary = await this.safeAvailability(this.primary);
    if (primary.available) {
      try {
        return this.decorate(await this.primary.complete(request), this.primary, false);
      } catch (error) {
        if (!isRetriableAiProviderError(error)) throw error;
      }
    }
    const fallback = await this.safeAvailability(this.fallback);
    if (fallback.available)
      return this.decorate(await this.fallback.complete(request), this.fallback, true);
    return this.disabled.complete(request);
  }

  private decorate(value: unknown, provider: AiProvider, fallbackUsed: boolean): unknown {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const metadata = provider.metadata?.();
    return metadata ? { ...value, providerMetadata: { ...metadata, fallbackUsed } } : value;
  }

  private async safeAvailability(provider: AiProvider): Promise<AiProviderAvailability> {
    try {
      return await provider.availability();
    } catch {
      return { available: false, reason: 'UNAVAILABLE' };
    }
  }
}
