/**
 * QC-DATA-001 — Legacy receiving source row → canonical contract.
 *
 * Pure, database-free, and conservative by design. Each source row is
 * classified as VALID / NORMALIZABLE / REQUIRES_REVIEW / INVALID together with
 * the reason, the offending source value, and — when it can be proven — the
 * canonical values. The original imported value is always preserved.
 *
 * Nothing here writes to PostgreSQL and nothing guesses business data.
 */
import type {
  ReceivingClassificationIssue,
  ReceivingSourceClassification,
  ReceivingReviewReason,
} from './receiving-classification.js';
import { isNormalizedReceivingQuantity, parseReceivingQuantity } from './receiving-quantity.js';
import type { ReceivingQuantityUnit } from './receiving-units.js';

/** The business concepts the source dataset supplies. Extra fields are ignored. */
export interface ReceivingSourceRow {
  itemCode?: unknown;
  description?: unknown;
  quantity?: unknown;
  lot?: unknown;
  receivingDate?: unknown;
  expiryDate?: unknown;
  inspectionStatus?: unknown;
  releaseSystemStatus?: unknown;
  receivingNo?: unknown;
  supplier?: unknown;
  docNo?: unknown;
  purchaseOrderNo?: unknown;
}

/** Canonical row ready for the receiving write contract. */
export interface NormalizedReceivingRow {
  receivingNo?: string;
  supplier?: string;
  docNo?: string;
  itemCode: string;
  description: string;
  lot: string;
  receivedQuantity: string;
  quantityUnit: ReceivingQuantityUnit;
  receivingDate: string;
  expiryDate?: string;
  purchaseOrderNo?: string;
}

export interface ReceivingRowClassification {
  classification: ReceivingSourceClassification;
  issues: ReceivingClassificationIssue[];
  /** Present only when the row could be normalised without guessing. */
  normalized?: NormalizedReceivingRow;
  /** The untouched source values, kept for traceability. */
  source: Readonly<Record<string, unknown>>;
}

const text = (value: unknown): string =>
  (value === null || value === undefined ? '' : String(value)).trim();

const textIssue = (
  field: string,
  reason: ReceivingReviewReason,
  sourceValue: string | null,
  detail: string,
): ReceivingClassificationIssue => ({ field, reason, sourceValue, detail });

/**
 * Parses a source date without ever guessing an ambiguous order.
 *
 * `YYYY-MM-DD` and `YYYY/MM/DD` are unambiguous and normalise.
 * `DD/MM/YYYY` normalises only when the day cannot be a month (>12); when both
 * parts could be a month the row needs review. Everything else is unparseable.
 */
export function parseReceivingSourceDate(raw: unknown): {
  value?: string;
  ambiguous: boolean;
  reason?: ReceivingReviewReason;
  /** True when the input needed reformatting (ISO normalisation). */
  normalized?: boolean;
} {
  const source = text(raw);
  if (!source) return { ambiguous: false, reason: 'DATE_MISSING' };

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
  if (iso) return sanity(iso[1]!, iso[2]!, iso[3]!, false);

  const slashedIso = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(source);
  if (slashedIso) return sanity(slashedIso[1]!, slashedIso[2]!, slashedIso[3]!, true);

  const dayFirst = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/.exec(source);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    const month = Number(dayFirst[2]);
    if (day > 12) return sanity(dayFirst[3]!, dayFirst[2]!, dayFirst[1]!, true);
    if (month > 12) return sanity(dayFirst[3]!, dayFirst[1]!, dayFirst[2]!, true);
    return { ambiguous: true, reason: 'DATE_ORDER_AMBIGUOUS' };
  }

  return { ambiguous: false, reason: 'DATE_UNPARSEABLE' };
}

/** Field-level classification ranking: the worst field decides the row. */
const RANK: Record<ReceivingSourceClassification, number> = {
  VALID: 0,
  NORMALIZABLE: 1,
  REQUIRES_REVIEW: 2,
  INVALID: 3,
};

const worst = (left: ReceivingSourceClassification, right: ReceivingSourceClassification) =>
  RANK[right] > RANK[left] ? right : left;

/**
 * Classifies one source row and, when possible, normalises it.
 *
 * The classification never silently "repairs" business data: a missing item
 * code, description or lot is REQUIRES_REVIEW (the row needs a human), a missing
 * receiving date is INVALID (the record cannot be created without it), and an
 * expiry date before the receiving date is INVALID because it contradicts the
 * physical receiving event.
 */
export function classifyReceivingSourceRow(row: ReceivingSourceRow): ReceivingRowClassification {
  const issues: ReceivingClassificationIssue[] = [];
  let classification: ReceivingSourceClassification = 'VALID';

  const add = (c: ReceivingSourceClassification, i: ReceivingClassificationIssue) => {
    issues.push(i);
    classification = worst(classification, c);
  };

  const required: Array<[keyof ReceivingSourceRow, string]> = [
    ['itemCode', 'Item code'],
    ['description', 'Description'],
    ['lot', 'Lot / batch'],
  ];
  for (const [field, label] of required) {
    const value = text(row[field]);
    if (!value) {
      add(
        'REQUIRES_REVIEW',
        textIssue(
          String(field),
          'MISSING_REQUIRED_FIELD',
          null,
          `${label} is missing in the source row.`,
        ),
      );
    }
  }

  const quantity = parseReceivingQuantity(row.quantity);
  for (const quantityIssue of quantity.issues) add(quantity.classification, quantityIssue);

  const receiving = parseReceivingSourceDate(row.receivingDate);
  if (!receiving.value) {
    add(
      receiving.reason === 'DATE_ORDER_AMBIGUOUS' ? 'REQUIRES_REVIEW' : 'INVALID',
      textIssue(
        'receivingDate',
        receiving.reason ?? 'DATE_UNPARSEABLE',
        text(row.receivingDate) || null,
        receiving.reason === 'DATE_MISSING'
          ? 'The receiving date is required and missing.'
          : receiving.reason === 'DATE_ORDER_AMBIGUOUS'
            ? 'The receiving date day/month order is ambiguous in the source format.'
            : 'The receiving date could not be parsed.',
      ),
    );
  } else if (receiving.normalized) {
    classification = worst(classification, 'NORMALIZABLE');
  }

  let expiry: string | undefined;
  const expirySource = text(row.expiryDate);
  if (expirySource) {
    const parsedExpiry = parseReceivingSourceDate(row.expiryDate);
    if (!parsedExpiry.value) {
      add(
        parsedExpiry.reason === 'DATE_ORDER_AMBIGUOUS' ? 'REQUIRES_REVIEW' : 'INVALID',
        textIssue(
          'expiryDate',
          parsedExpiry.reason ?? 'DATE_UNPARSEABLE',
          expirySource,
          parsedExpiry.reason === 'DATE_ORDER_AMBIGUOUS'
            ? 'The expiry date day/month order is ambiguous in the source format.'
            : 'The expiry date could not be parsed.',
        ),
      );
    } else if (receiving.value && parsedExpiry.value < receiving.value) {
      add(
        'INVALID',
        textIssue(
          'expiryDate',
          'EXPIRY_BEFORE_RECEIVING',
          expirySource,
          'The expiry date precedes the receiving date, which contradicts the receiving event.',
        ),
      );
    } else {
      expiry = parsedExpiry.value;
      if (parsedExpiry.normalized) classification = worst(classification, 'NORMALIZABLE');
    }
  }

  if (
    classification === 'INVALID' ||
    classification === 'REQUIRES_REVIEW' ||
    !quantity.quantity ||
    !quantity.unit ||
    !receiving.value
  ) {
    return { classification, issues, source: { ...row } };
  }
  if (!isNormalizedReceivingQuantity(quantity)) {
    return { classification: 'REQUIRES_REVIEW', issues, source: { ...row } };
  }

  const receivingNo = text(row.receivingNo);
  const supplier = text(row.supplier);
  const docNo = text(row.docNo);
  const purchaseOrderNo = text(row.purchaseOrderNo);
  return {
    classification,
    issues,
    normalized: {
      ...(receivingNo ? { receivingNo } : {}),
      ...(supplier ? { supplier } : {}),
      ...(docNo ? { docNo } : {}),
      itemCode: text(row.itemCode),
      description: text(row.description),
      lot: text(row.lot),
      receivedQuantity: quantity.quantity,
      quantityUnit: quantity.unit,
      receivingDate: receiving.value,
      ...(expiry ? { expiryDate: expiry } : {}),
      ...(purchaseOrderNo ? { purchaseOrderNo } : {}),
    },
    source: { ...row },
  };
}

function sanity(
  year: string,
  month: string,
  day: string,
  normalized: boolean,
): { value?: string; ambiguous: boolean; reason?: ReceivingReviewReason; normalized?: boolean } {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  const date = new Date(Date.UTC(y, m - 1, d));
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  if (!valid) return { ambiguous: false, reason: 'DATE_UNPARSEABLE' };
  return {
    value: `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    ambiguous: false,
    normalized,
  };
}
