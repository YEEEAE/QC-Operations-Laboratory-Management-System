/**
 * AI Advisory provider port.
 *
 * The port is deliberately credential-free and SDK-free: the system ships
 * with no provider selected, and any future adapter is injected behind this
 * contract. Implementations receive only the explicitly authorized question
 * and context segments; they must never receive database handles, session
 * material, or credentials (SECURITY-ARCHITECTURE.md sections 156-160).
 */
import type { AdvisoryMode } from '../domain/advisory-response.js';

export interface AdvisoryContextSegment {
  /** Short human-readable label of the authorized source record. */
  label: string;
  /** Pre-authorized, minimized content excerpt. */
  content: string;
}

export interface AiAdvisoryRequest {
  mode: AdvisoryMode;
  question: string;
  context: readonly AdvisoryContextSegment[];
}

export type AiProviderUnavailableReason = 'NOT_CONFIGURED' | 'DISABLED' | 'UNAVAILABLE';

export interface AiProviderAvailability {
  available: boolean;
  reason?: AiProviderUnavailableReason;
}

export interface AiProvider {
  availability(): Promise<AiProviderAvailability>;
  /**
   * Returns a raw, unvalidated provider payload. Callers must pass it
   * through the domain advisory-response validation before any use.
   */
  complete(request: AiAdvisoryRequest): Promise<unknown>;
}
