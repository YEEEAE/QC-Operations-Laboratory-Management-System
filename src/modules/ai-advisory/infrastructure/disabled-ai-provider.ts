/**
 * Default AI advisory adapter: disabled.
 *
 * No provider has been approved or configured. This adapter never performs
 * network I/O, never loads an SDK, and never holds credentials. The
 * advisory capability reports NOT_CONFIGURED and the core QC system runs
 * unaffected (OBSERVABILITY-ARCHITECTURE.md section 47).
 */
import type {
  AiProvider,
  AiProviderAvailability,
} from '../ports/ai-provider.js';

export class DisabledAiProvider implements AiProvider {
  async availability(): Promise<AiProviderAvailability> {
    return { available: false, reason: 'NOT_CONFIGURED' };
  }

  async complete(): Promise<unknown> {
    throw new Error('AI advisory provider is not configured.');
  }
}
