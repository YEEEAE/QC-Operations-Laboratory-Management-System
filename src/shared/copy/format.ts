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
