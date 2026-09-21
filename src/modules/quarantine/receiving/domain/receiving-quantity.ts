/**
 * QC-DATA-001 — Legacy quantity normalisation.
 *
 * The source data stores a quantity and its unit inside one text field
 * ("250 PCS", "29 KG", "1,5 KG"). The canonical contract keeps them apart:
 * `receivedQuantity` (NUMERIC) and `quantityUnit` (controlled vocabulary).
 *
 * The parser is deliberately conservative:
 *  - it normalises only what it can prove (one number + one known unit);
 *  - it never invents a default unit;
 *  - ambiguous or contradictory text is reported for review instead of guessed.
 */
import type {
  ReceivingClassificationIssue,
  ReceivingSourceClassification,
} from './receiving-classification.js';
import { canonicalReceivingUnit, type ReceivingQuantityUnit } from './receiving-units.js';

export interface ReceivingQuantityParse {
  classification: ReceivingSourceClassification;
  /** Canonical decimal string, present only when the number was proven. */
  quantity?: string;
  /** Canonical unit, present only when the unit was proven. */
  unit?: ReceivingQuantityUnit;
  issues: ReceivingClassificationIssue[];
  /** The exact source text, preserved for traceability. */
  sourceValue: string | null;
}

const issue = (
  reason: ReceivingClassificationIssue['reason'],
  sourceValue: string | null,
  detail: string,
): ReceivingClassificationIssue => ({ field: 'quantity', reason, sourceValue, detail });

/** Decimal text with `.` or `,` as the decimal separator (never a thousands separator). */
const NUMBER = /^\d+(?:[.,]\d+)?$/;
/** A number followed by a single unit token, allowing "1.5KG". */
const NUMBER_AND_UNIT = /^(\d+(?:[.,]\d+)?)\s*([A-Za-zµ²]+\.?)$/;

function canonicalDecimal(raw: string): string {
  const normalized = raw.replace(',', '.');
  const value = Number(normalized);
  // Render the proven value without ever rounding the supplied precision.
  return value.toString();
}

/**
 * Parses one legacy quantity value.
 *
 * VALID = a plain positive number with a canonical unit;
 * NORMALIZABLE = a positive number plus an alias spelling of a canonical unit;
 * REQUIRES_REVIEW = the unit is missing or unknown, or the text carries extra
 * content that could change the meaning;
 * INVALID = no quantity at all, a zero/negative quantity, or several quantities.
 */
export function parseReceivingQuantity(raw: unknown): ReceivingQuantityParse {
  const sourceValue = raw === null || raw === undefined ? null : String(raw).trim();
  if (!sourceValue) {
    return {
      classification: 'INVALID',
      issues: [issue('QUANTITY_MISSING', sourceValue, 'No quantity was supplied.')],
      sourceValue,
    };
  }

  const compact = sourceValue.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

  // Several numbers in one cell ("250 PCS 10 BOX") cannot be normalised safely.
  const numbers = compact.match(/\d+(?:[.,]\d+)?/g) ?? [];
  if (numbers.length > 1) {
    return {
      classification: 'REQUIRES_REVIEW',
      issues: [
        issue(
          'QUANTITY_MULTIPLE_VALUES',
          sourceValue,
          'More than one quantity appears in the value, so the received amount is ambiguous.',
        ),
      ],
      sourceValue,
    };
  }
  if (numbers.length === 0) {
    return {
      classification: 'INVALID',
      issues: [
        issue('QUANTITY_NOT_NUMERIC', sourceValue, 'The value contains no numeric quantity.'),
      ],
      sourceValue,
    };
  }

  const numericOnly = NUMBER.exec(compact);
  if (numericOnly) {
    const quantity = canonicalDecimal(numericOnly[0]);
    if (!(Number(quantity) > 0)) {
      return {
        classification: 'INVALID',
        issues: [
          issue(
            'QUANTITY_NOT_POSITIVE',
            sourceValue,
            'The received quantity must be greater than zero.',
          ),
        ],
        sourceValue,
      };
    }
    return {
      classification: 'REQUIRES_REVIEW',
      quantity,
      issues: [
        issue(
          'QUANTITY_UNIT_MISSING',
          sourceValue,
          'The value carries no unit; the unit must be supplied before this row is imported.',
        ),
      ],
      sourceValue,
    };
  }

  const withUnit = NUMBER_AND_UNIT.exec(compact);
  if (withUnit) {
    const numeric = withUnit[1]!;
    const unitToken = withUnit[2]!;
    const quantity = canonicalDecimal(numeric);
    if (!(Number(quantity) > 0)) {
      return {
        classification: 'INVALID',
        issues: [
          issue(
            'QUANTITY_NOT_POSITIVE',
            sourceValue,
            'The received quantity must be greater than zero.',
          ),
        ],
        sourceValue,
      };
    }
    const canonical = canonicalReceivingUnit(unitToken);
    if (!canonical) {
      return {
        classification: 'REQUIRES_REVIEW',
        quantity,
        issues: [
          issue(
            'QUANTITY_UNIT_UNKNOWN',
            sourceValue,
            `The unit "${unitToken}" is not in the receiving unit vocabulary.`,
          ),
        ],
        sourceValue,
      };
    }
    const isCanonicalSpelling = unitToken.trim().toUpperCase().replace(/\.+$/, '') === canonical;
    return {
      classification: isCanonicalSpelling ? 'VALID' : 'NORMALIZABLE',
      quantity,
      unit: canonical,
      issues: [],
      sourceValue,
    };
  }

  // A number with extra text that is not a single unit token.
  return {
    classification: 'REQUIRES_REVIEW',
    issues: [
      issue(
        'QUANTITY_HAS_SURROUNDING_TEXT',
        sourceValue,
        'The value contains text around the quantity that could change its meaning.',
      ),
    ],
    sourceValue,
  };
}

/** Convenience predicate for a value ready for persistence. */
export function isNormalizedReceivingQuantity(
  parse: ReceivingQuantityParse,
): parse is ReceivingQuantityParse & { quantity: string; unit: ReceivingQuantityUnit } {
  return parse.quantity !== undefined && parse.unit !== undefined;
}
