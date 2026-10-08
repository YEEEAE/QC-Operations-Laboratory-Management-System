import { AppError } from '../../../shared/errors/app-error.js';
import type { LabTest } from '../domain/lab-test.js';
import { validateMeasurement, type MeasurementInput } from '../domain/measurement.js';
import { measurementInputValue } from './measurement-input.js';

const invalid = (): never => {
  throw new AppError('VALIDATION_FAILED', { userSafe: true });
};

/** Excel clipboard TSV, including quoted cells. Parsing never commits observations. */
function rowsOf(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false;
  const endCell = () => {
    row.push(cell);
    cell = '';
    closed = false;
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === '\t') endCell();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else if (closed) invalid();
    else if (c === '"') {
      if (cell) invalid();
      quoted = true;
    } else cell += c;
  }
  if (quoted) invalid();
  if (cell || row.length || closed) endRow();
  return rows;
}

/** Bind every row to frozen points and reuse the manual-entry domain validator. */
export function previewBulkMeasurements(
  test: Pick<LabTest, 'samples' | 'context'>,
  text: string,
): MeasurementInput[] {
  const rows = rowsOf(text);
  const header = rows.shift();
  if (!header || header.join('\t') !== 'Sample\tParameter\tValue\tUnit\tRemarks' || !rows.length)
    invalid();
  const seen = new Set<string>();
  return rows.map((row) => {
    if (row.length !== 5) invalid();
    const [sampleLabel, code, value, unit, remarks] = row as [
      string,
      string,
      string,
      string,
      string,
    ];
    const samples = test.samples.filter((s) => s.identifier === sampleLabel);
    const parameters = test.context.parameters.filter((p) => p.code === code);
    if (samples.length !== 1 || parameters.length !== 1) invalid();
    const sample = samples[0]!,
      parameter = parameters[0]!;
    const key = `${sample.id}:${parameter.id}`;
    if (seen.has(key)) invalid();
    seen.add(key);
    // Native preview retains the frozen displayed unit; alternate-unit conversion uses its traceable Action path.
    if ((unit || null) !== parameter.unit) invalid();
    return validateMeasurement(
      {
        sampleId: sample.id,
        parameterId: parameter.id,
        raw: measurementInputValue(parameter.dataType, value),
        unit: unit || null,
        ...(remarks ? { remarks } : {}),
      },
      parameter,
    );
  });
}

/** Preserve all untouched observations; preview only updates the visible form. */
export function bulkMeasurementPreviewForm(
  test: Pick<LabTest, 'samples' | 'context' | 'measurements'>,
  text: string,
  expectedVersion: string,
): FormData {
  const measurements = previewBulkMeasurements(test, text);
  const data = new FormData();
  data.set('expectedVersion', expectedVersion);
  data.set('intent', 'save');
  for (const sample of test.samples)
    for (const parameter of test.context.parameters) {
      const point = `${sample.id}:${parameter.id}`;
      const value = test.measurements.find(
        (m) => m.sampleId === sample.id && m.parameterId === parameter.id,
      );
      data.set(
        `value-${point}`,
        value?.raw === null || value?.raw === undefined ? '' : String(value.raw),
      );
      data.set(`remarks-${point}`, value?.remarks ?? '');
    }
  for (const m of measurements) {
    const point = `${m.sampleId}:${m.parameterId}`;
    data.set(`value-${point}`, String(m.raw));
    data.set(`remarks-${point}`, m.remarks ?? '');
  }
  return data;
}
