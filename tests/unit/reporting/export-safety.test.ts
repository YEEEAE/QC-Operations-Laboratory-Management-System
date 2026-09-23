import { describe, expect, it } from 'vitest';
import {
  sanitizeSpreadsheetCell,
  toCsv,
} from '../../../src/modules/reporting/infrastructure/csv-exporter.js';

describe('report export safety', () => {
  it.each([
    '=SUM(A1:A2)',
    '+cmd',
    '-cmd',
    '@cmd',
    '  =SUM(A1:A2)',
    '\t+cmd',
    '\u0000@cmd',
    '\ufeff-cmd',
  ])('neutralizes formula-like cell %s', (value) => {
    expect(sanitizeSpreadsheetCell(value)).toBe(`'${value}`);
  });

  it('quotes CSV cells and preserves the sanitized canonical value', () => {
    const csv = toCsv(
      [{ label: '=danger, text', value: 'safe' }],
      [
        { key: 'label', label: 'Label' },
        { key: 'value', label: 'Value' },
      ],
    );
    expect(csv).toContain('"\'=danger, text",safe');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
