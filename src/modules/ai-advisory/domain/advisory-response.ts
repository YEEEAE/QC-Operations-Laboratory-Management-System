/**
 * AI Advisory domain — advisory-only boundary.
 *
 * AI is untrusted advisory computation (SECURITY-ARCHITECTURE.md sections
 * 154-163; DOMAIN-MAP.md section 27). It can summarize, suggest, draft,
 * explain, and identify patterns; it can never approve, reject, release,
 * sign, or set official PASS/FAIL. This module is the single place where a
 * raw provider payload becomes an advisory response, so structured output
 * validation and the authority rejection live here — never in Delivery.
 */

export const ADVISORY_MODES = ['SUMMARIZE', 'SUGGEST', 'DRAFT'] as const;
export type AdvisoryMode = (typeof ADVISORY_MODES)[number];

export const ADVISORY_NOTICE =
  'AI ADVISORY — Suggestions and analysis only — not an approval authority.';
export const ADVISORY_UNAVAILABLE_NOTICE =
  'AI advisory is not available. Advisory capability is optional: core QC workflows are unaffected and remain authoritative.';
export const ADVISORY_REFUSAL_NOTICE =
  'The AI response was rejected because it attempted to encode an authoritative decision. Advisory output cannot approve, reject, release, sign, or set official PASS/FAIL.';

export const MAX_ADVISORY_TEXT_LENGTH = 20_000;

export class AdvisoryAuthorityViolationError extends Error {
  constructor() {
    super('Advisory output attempted to encode an authoritative decision.');
    this.name = 'AdvisoryAuthorityViolationError';
  }
}

export interface AdvisoryResponse {
  mode: AdvisoryMode;
  text: string;
}

export function isAdvisoryMode(value: unknown): value is AdvisoryMode {
  return typeof value === 'string' && (ADVISORY_MODES as readonly string[]).includes(value);
}

const AUTHORITY_KEYS = [
  'approve',
  'approved',
  'approve_with_ai',
  'reject',
  'rejected',
  'release',
  'released',
  'sign',
  'signature',
  'pass',
  'passed',
  'fail',
  'failed',
  'decision',
  'official_result',
  'final_result',
  'verdict',
  'apply',
  'execute',
  'authorize',
  'permission',
  'permissions',
  'role',
  'roles',
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function assertNoAuthorityEncoding(node: unknown, depth: number): void {
  if (depth > 4 || !isPlainObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    if (AUTHORITY_KEYS.includes(key.toLowerCase())) {
      throw new AdvisoryAuthorityViolationError();
    }
    assertNoAuthorityEncoding(value, depth + 1);
  }
}

/**
 * Validates a raw provider payload into a plain advisory response. Provider
 * output is untrusted: any structured field that encodes approval, release,
 * signature, PASS/FAIL, or authorization vocabulary is rejected outright,
 * and only a bounded plain text body survives (SECURITY-ARCHITECTURE.md
 * sections 155, 161-162).
 */
export function parseProviderAdvisory(raw: unknown): AdvisoryResponse {
  if (!isPlainObject(raw)) {
    throw new AdvisoryAuthorityViolationError();
  }
  assertNoAuthorityEncoding(raw, 0);
  const text = raw.text;
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new AdvisoryAuthorityViolationError();
  }
  if (text.length > MAX_ADVISORY_TEXT_LENGTH) {
    throw new AdvisoryAuthorityViolationError();
  }
  return { mode: 'SUMMARIZE', text };
}
