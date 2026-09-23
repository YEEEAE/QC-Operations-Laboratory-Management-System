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
  'AI advisory is temporarily unavailable. Core QC workflows are unaffected and remain authoritative.';
export const ADVISORY_REFUSAL_NOTICE =
  'The AI response was rejected because it attempted to encode an authoritative decision. Advisory output cannot approve, reject, release, sign, or set official PASS/FAIL.';
export const AI_ADVISORY_PROMPT_VERSION = 'qc-ai-prompt-v2';

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
  sourceReferences?: readonly AdvisorySourceReference[];
  providerMetadata?: AdvisoryProviderMetadata;
  provenance: {
    promptVersion: string;
    generatedAt: string;
    confidence: 'NOT_CALIBRATED';
    boundary: 'ADVISORY_ONLY';
  };
}

export interface AdvisoryProviderMetadata {
  provider: 'groq' | 'gemini';
  model: string;
  fallbackUsed: boolean;
}

export interface AdvisorySourceReference {
  sourceId: string;
  label?: string;
  citation?: string;
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
  'recommendation',
  'recommendations',
];

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const SENSITIVE_DATA_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b(?:patient|national\s+id|iqama|passport|medical\s+record)\b.{0,40}\b\d{4,}\b/i,
  /\b(?:phone|mobile|telephone)\b\s*[:=]?\s*\+?\d[\d\s().-]{7,}\d/i,
  /(?:رقم\s*(?:الجوال|الهاتف|الهوية)|هوية\s*وطنية)\s*[:=]?\s*[+0-9٠-٩][0-9٠-٩\s().-]{7,}/u,
];

export function containsSensitiveData(value: string): boolean {
  return SENSITIVE_DATA_PATTERNS.some((pattern) => pattern.test(value));
}

const UNSAFE_AUTHORITY_TEXT = [
  /\bignore\s+(?:all\s+)?(?:previous|prior|system)\s+instructions\b/i,
  /\b(?:bypass|override|ignore)\b.{0,50}\b(?:hold|policy|authorization|approval)\b/i,
  /\b(?:i|we|ai|the\s+model|the\s+system)\s+(?:approve|release|sign|authorize|grant|execute|apply|set|mark)\b/i,
  /\byou\s+are\s+now\s+(?:the\s+)?(?:release|approval|qc)\s+authority\b/i,
  /(?:أنا\s+(?:أعتمد|أوافق|أفرج|أوقّع)|سأعتمد\s+النتيجة|هذه\s+نتيجة\s+(?:نجاح|فشل)\s+رسمية)/u,
  /\b(?:official|final)\s+(?:pass|fail|result|decision)\b/i,
  /\b(?:recommend|recommendation)\b.{0,50}\b(?:release|approve|reject|sign)\b/i,
];

function containsUnsafeAuthorityText(value: string): boolean {
  return UNSAFE_AUTHORITY_TEXT.some((pattern) => pattern.test(value));
}

function parseSourceReferences(value: unknown): readonly AdvisorySourceReference[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 20) throw new AdvisoryAuthorityViolationError();
  return value.map((item) => {
    if (!isPlainObject(item) || typeof item.sourceId !== 'string' || item.sourceId.length > 200) {
      throw new AdvisoryAuthorityViolationError();
    }
    const reference: AdvisorySourceReference = { sourceId: item.sourceId };
    if (item.label !== undefined) {
      if (typeof item.label !== 'string' || item.label.length > 200)
        throw new AdvisoryAuthorityViolationError();
      reference.label = item.label;
    }
    if (item.citation !== undefined) {
      if (typeof item.citation !== 'string' || item.citation.length > 500)
        throw new AdvisoryAuthorityViolationError();
      reference.citation = item.citation;
    }
    return reference;
  });
}

function parseProviderMetadata(value: unknown): AdvisoryProviderMetadata | undefined {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) throw new AdvisoryAuthorityViolationError();
  if (
    (value.provider !== 'groq' && value.provider !== 'gemini') ||
    typeof value.model !== 'string' ||
    value.model.length === 0 ||
    value.model.length > 200 ||
    typeof value.fallbackUsed !== 'boolean'
  ) {
    throw new AdvisoryAuthorityViolationError();
  }
  return {
    provider: value.provider,
    model: value.model,
    fallbackUsed: value.fallbackUsed,
  };
}

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
export function parseProviderAdvisory(
  raw: unknown,
  allowedSources: readonly { sourceId?: string; label: string; citation?: string }[] = [],
): Omit<AdvisoryResponse, 'provenance'> {
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
  if (containsSensitiveData(text) || containsUnsafeAuthorityText(text)) {
    throw new AdvisoryAuthorityViolationError();
  }
  const sourceReferences = parseSourceReferences(raw.sourceReferences);
  if (
    sourceReferences?.some(
      (reference) =>
        !allowedSources.some(
          (source) =>
            source.sourceId === reference.sourceId &&
            (reference.label === undefined || source.label === reference.label) &&
            (reference.citation === undefined || source.citation === reference.citation),
        ),
    )
  ) {
    throw new AdvisoryAuthorityViolationError();
  }
  const providerMetadata = parseProviderMetadata(raw.providerMetadata);
  return {
    mode: 'SUMMARIZE',
    text,
    ...(sourceReferences ? { sourceReferences } : {}),
    ...(providerMetadata ? { providerMetadata } : {}),
  };
}
