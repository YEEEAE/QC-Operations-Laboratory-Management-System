/**
 * QC-DATA-002 — Deterministic item → inspection template mapping.
 *
 * A receiving item resolves its approved inspection template through the
 * controlled `item_code` (the identifier already carried on receiving_items),
 * never through fragile description-text matching. The mapping is governed
 * data (`qc.inspection_item_templates`): created by authorized template
 * administrators, never guessed at execution time.
 */

export const MAPPING_STATES = ['ACTIVE', 'STOPPED'] as const;
export type InspectionItemMappingState = (typeof MAPPING_STATES)[number];

export interface InspectionItemMapping {
  id: string;
  itemCode: string;
  templateId: string;
  state: InspectionItemMappingState;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface MappedTemplateCandidate {
  templateId: string;
  templateCode: string;
  templateVersionId: string;
  versionNo: string;
  name: string;
}

export interface MappedTemplateResolution {
  /** Exactly one approved candidate: auto-selected deterministically. */
  unique: MappedTemplateCandidate | null;
  /** More than one valid candidate exists: explicit authorized selection required. */
  ambiguous: MappedTemplateCandidate[];
}

export function isMappingState(value: unknown): value is InspectionItemMappingState {
  return typeof value === 'string' && (MAPPING_STATES as readonly string[]).includes(value);
}

/**
 * Resolve mapped candidates that are ACTIVE and within their effective window
 * for the given date. The caller (repository/use case) performs the SQL-side
 * filter; this function classifies the outcome:
 *  - 1 candidate  → unique (auto-selection);
 *  - 2+           → ambiguous (authorized explicit selection);
 *  - 0            → no approved mapping: fail safely with a human message.
 */
export function classifyResolution(
  candidates: readonly MappedTemplateCandidate[],
): MappedTemplateResolution {
  if (candidates.length === 1) return { unique: candidates[0]!, ambiguous: [] };
  if (candidates.length > 1) return { unique: null, ambiguous: [...candidates] };
  return { unique: null, ambiguous: [] };
}

export const NO_APPROVED_TEMPLATE_MESSAGE =
  'No approved inspection template is available for this item.';
