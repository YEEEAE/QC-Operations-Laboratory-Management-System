import type { ReportColumn } from '../domain/report-definition.js';
import type { ReportRow } from '../ports/report-query.js';

export function sanitizeSpreadsheetCell(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}
function cell(value: unknown): string {
  const safe = sanitizeSpreadsheetCell(value === null || value === undefined ? '' : String(value));
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
export function toCsv(rows: readonly ReportRow[], columns: readonly ReportColumn[]): string {
  const header = columns.map((column) => cell(column.label)).join(',');
  return [header, ...rows.map((row) => columns.map((column) => cell(row[column.key])).join(','))].join('\r\n') + '\r\n';
}
export function csvBytes(rows: readonly ReportRow[], columns: readonly ReportColumn[]): Buffer { return Buffer.from(toCsv(rows, columns), 'utf8'); }

