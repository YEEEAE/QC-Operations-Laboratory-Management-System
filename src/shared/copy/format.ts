/**
 * Shared presentation formatters for dates and times.
 *
 * The product is English-only and operates on factory time (Asia/Riyadh).
 * `en-SA` renders `M/D/YYYY`, which is ambiguous for an operator reading a
 * snapshot or an audit row (QC-100-FINAL-016 P3-7); these helpers render an
 * unambiguous `18 Sep 2026` / `18 Sep 2026, 18:43` in the same timezone.
 * They are presentation only: they never change a stored value or a timezone.
 */
const LOCALE = 'en-GB';
const TIME_ZONE = 'Asia/Riyadh';

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: TIME_ZONE,
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(LOCALE, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIME_ZONE,
  });
}

/** The single factory timezone used to display and filter every timestamp. */
export const FACTORY_TIME_ZONE_LABEL = 'Asia/Riyadh';

/** Offset label for the factory timezone, for operator-facing filter help. */
export const FACTORY_TIME_ZONE_OFFSET_LABEL = 'UTC+03:00';

/**
 * Asia/Riyadh has held a fixed UTC+03:00 offset with no daylight saving since
 * 1950, so a literal offset is exact for every record this product stores.
 */
const FACTORY_UTC_OFFSET = '+03:00';

/**
 * Parse a `<input type="datetime-local">` value as factory time.
 *
 * UX-006: a datetime-local value carries no offset, so `new Date(value)`
 * silently applies the *server process* timezone — the audit From/To filters
 * were interpreted in an unnamed zone while the table displayed Asia/Riyadh.
 * This resolves the operator's typed boundary in the same factory zone every
 * timestamp is displayed in. It changes no stored value and no audit
 * timestamp; it only makes the instant a filter boundary resolves to explicit.
 */
export function parseFactoryDateTime(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second ?? '00'}${FACTORY_UTC_OFFSET}`,
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}
