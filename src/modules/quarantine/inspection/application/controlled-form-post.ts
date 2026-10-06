import { AppError } from '../../../../shared/errors/app-error.js';
import type { ControlledForm, ControlledFormValues } from './save-controlled-form.js';
import { validateControlledFormValues } from './save-controlled-form.js';

/** Decode native form controls against the frozen schema; never coerce decimals to numbers. */
export function decodeControlledFormPost(
  schema: ControlledForm,
  data: FormData,
): ControlledFormValues {
  const values: ControlledFormValues = { headers: {}, points: {} };
  const headers = new Map(
    schema.headerFields.filter((f) => !f.receivingKey).map((f) => [f.key, f]),
  );
  const points = new Map(schema.sections.flatMap((s) => s.points).map((p) => [p.key, p]));
  const seen = new Set<string>();
  for (const [name, raw] of data) {
    if (!name.startsWith('header:') && !name.startsWith('point:') && !name.startsWith('row:'))
      continue;
    if (typeof raw !== 'string' || seen.has(name))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    seen.add(name);
    const [kind, key, a, b] = name.split(':');
    const scalar = (type: string) =>
      type === 'YES_NO' && raw ? (raw === 'true' ? true : raw === 'false' ? false : raw) : raw;
    if (kind === 'header') {
      const f = headers.get(key!);
      if (!f || a) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      if (raw) values.headers[key!] = scalar(f.dataType);
    } else {
      const p = points.get(key!);
      if (!p) throw new AppError('VALIDATION_FAILED', { userSafe: true });
      if (!raw) continue;
      const entry = (values.points[key!] ??= {});
      if (kind === 'point') {
        if (a === 'value') entry.value = scalar(p.dataType);
        else if (a === 'result') entry.result = raw as NonNullable<typeof entry.result>;
        else if (a === 'remarks') entry.remarks = raw;
        else if (a === 'sampleLevel') entry.sampleLevel = raw;
        else if (a === 'sampleSize') entry.sampleSize = raw;
        else throw new AppError('VALIDATION_FAILED', { userSafe: true });
      } else {
        if (!a || !/^\d{1,3}$/.test(a) || Number(a) > 999)
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const c = p.columns?.find((c) => c.key === b);
        if (p.dataType !== 'TABLE' || !c)
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const rows = (entry.rows ??= []);
        const row = (rows[Number(a)] ??= {});
        row[b!] = scalar(c.dataType);
      }
    }
  }
  for (const entry of Object.values(values.points))
    if (entry.rows) entry.rows = entry.rows.filter((r) => r && Object.keys(r).length);
  const remarks = data.get('generalRemarks');
  const disposition = data.get('disposition');
  if (typeof remarks === 'string' && remarks) values.generalRemarks = remarks;
  if (typeof disposition === 'string' && disposition) values.disposition = disposition;
  return validateControlledFormValues(schema, values);
}
