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
  AiAdvisoryRequest,
  AiProviderAvailability,
} from '../ports/ai-provider.js';

export class DisabledAiProvider implements AiProvider {
  async availability(): Promise<AiProviderAvailability> {
    return { available: false, reason: 'NOT_CONFIGURED' };
  }

  async complete(request: AiAdvisoryRequest): Promise<unknown> {
    // The disabled provider never reads the request; it always reports
    // NOT_CONFIGURED. The parameter exists to satisfy the AiProvider contract.
    void request;
    throw new Error('AI advisory provider is not configured.');
  }
}
