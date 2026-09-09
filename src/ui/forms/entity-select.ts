/**
 * Presentation-only helpers for authorized entity selectors (F-06 / F-09).
 *
 * These helpers do transport shaping and safe-navigation checks only. They
 * contain no business rules, no SQL, no policy values, and no authorization
 * logic: option lists are loaded server-side in Astro frontmatter through
 * application use cases (which reauthorize via `Astro.locals.actor`), and
 * every mutation still reauthorizes inside its Astro Action and use case.
 *
 * Business identifiers (`taskNo`, `labTestNo`, …) stay operator-supplied
 * from the approved offline source: no approved server-side numbering policy
 * exists in this baseline (see DATA-DICTIONARY DD-008 and BUSINESS-RULES
 * BD-013, both open), so this file must not invent a numbering scheme.
 * Technical UUIDs are already generated server-side only (`uuidv7()` inside
 * application use cases); Action input schemas accept no client `id`.
 */
export interface SelectOption {
  /** Technical identifier kept as the option value (hidden after selection). */
  value: string;
  /** Human-readable label shown to the operator (never a raw UUID). */
  label: string;
}

export interface PreselectedResolution {
  /** The preselected id when it is still authorized, otherwise ''. */
  id: string;
  /** True when a preselected id was supplied but is no longer authorized. */
  stale: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Build selector options from an authorized server-side list. Labels must
 * already be human-readable (business number + name); values stay UUIDs so
 * the technical identifier travels only as the selected form value.
 */
export function toSelectOptions(items: readonly { id: string; label: string }[]): SelectOption[] {
  const seen = new Set<string>();
  const options: SelectOption[] = [];
  for (const item of items) {
    const value = item.id.trim();
    const label = item.label.trim();
    if (!UUID_PATTERN.test(value) || !label || seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label });
  }
  return options;
}

/**
 * Resolve a contextual preselection (e.g. `?equipmentId=…` from an equipment
 * workspace) against the authorized option list. A preselected id that is
 * absent from the authorized list is stale: it must never be submitted
 * silently, so the caller renders a warning and requires an explicit
 * operator choice instead.
 */
export function resolvePreselectedId(
  raw: string | null | undefined,
  options: readonly SelectOption[],
): PreselectedResolution {
  const candidate = (raw ?? '').trim();
  if (!candidate) return { id: '', stale: false };
  if (!UUID_PATTERN.test(candidate)) return { id: '', stale: true };
  const authorized = options.some((option) => option.value === candidate);
  return authorized ? { id: candidate, stale: false } : { id: '', stale: true };
}

/**
 * Validate a `returnTo` continuation so Cancel/back navigation can preserve
 * list context without becoming an open redirect. Only internal absolute
 * paths are accepted; anything else (external URLs, protocol-relative
 * URLs, login loops, or non-list deep links with business payloads) falls
 * back to the entity list href. No business payload ever enters the URL:
 * only the list path (and its benign filter query) is preserved.
 */
export function safeListHref(returnTo: string | null | undefined, listHref: string): string {
  const candidate = (returnTo ?? '').trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//')) return listHref;
  if (candidate.includes('\\')) return listHref;
  if (candidate.startsWith('/login')) return listHref;
  if (candidate.length > 2048) return listHref;
  // Only the entity list itself (optionally with its benign filter query)
  // is accepted as return context. Anything else falls back to the list.
  if (candidate === listHref || candidate.startsWith(`${listHref}?`)) return candidate;
  return listHref;
}
