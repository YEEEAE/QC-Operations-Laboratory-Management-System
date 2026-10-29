import {
  INSPECTION_RESULTS,
  RECEIVING_WORKFLOW_STATES,
} from '../../quarantine/receiving/domain/receiving-state.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ReportFilters } from '../domain/report-definition.js';

const FILTERS = [
  'from',
  'to',
  'lot',
  'itemCode',
  'line',
  'shift',
  'status',
  'workflowState',
  'inspectionResult',
  'releaseSystem',
  'page',
  'pageSize',
] as const;

function one(params: URLSearchParams, key: string): string | undefined {
  const values = params.getAll(key);
  if (values.length > 1) throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  return values[0]?.trim() || undefined;
}

function validDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** The same strict URL contract is used by the report screen and its exports. */
export function parseReportFilters(params: URLSearchParams): ReportFilters {
  for (const key of params.keys())
    if (key !== 'format' && !(FILTERS as readonly string[]).includes(key))
      throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });

  const values = Object.fromEntries(FILTERS.map((key) => [key, one(params, key)])) as Record<
    (typeof FILTERS)[number],
    string | undefined
  >;
  for (const key of ['from', 'to'] as const)
    if (values[key] && !validDate(values[key]))
      throw new AppError('VALIDATION_INVALID_DATE', { userSafe: true });
  if (values.from && values.to && values.from > values.to)
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });

  for (const key of ['lot', 'itemCode'] as const)
    if (values[key] && (values[key]!.length > 100 || values[key]!.includes('\0')))
      throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  for (const key of ['line', 'shift', 'status'] as const)
    if (values[key] && (values[key]!.length > 100 || values[key]!.includes('\0')))
      throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  if (
    values.workflowState &&
    !(RECEIVING_WORKFLOW_STATES as readonly string[]).includes(values.workflowState)
  )
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  if (
    values.inspectionResult &&
    !(INSPECTION_RESULTS as readonly string[]).includes(values.inspectionResult)
  )
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  if (values.releaseSystem && !['true', 'false'].includes(values.releaseSystem))
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  const page = values.page === undefined ? undefined : Number(values.page);
  const pageSize = values.pageSize === undefined ? undefined : Number(values.pageSize);
  if (
    (values.page !== undefined && (!/^\d+$/.test(values.page) || !Number.isSafeInteger(page) || page! < 1 || page! > 1_000)) ||
    (values.pageSize !== undefined && (!/^\d+$/.test(values.pageSize) || !Number.isSafeInteger(pageSize) || pageSize! < 1 || pageSize! > 100))
  ) throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });

  return {
    from: values.from,
    to: values.to,
    lot: values.lot,
    itemCode: values.itemCode,
    line: values.line,
    shift: values.shift,
    status: values.status,
    workflowState: values.workflowState,
    inspectionResult: values.inspectionResult,
    releaseSystem: values.releaseSystem === undefined ? undefined : values.releaseSystem === 'true',
    page,
    pageSize,
  };
}

/** Action payloads use the same validation contract as screen/export query strings. */
export function parseReportFilterValues(
  values: Partial<Record<(typeof FILTERS)[number], string | undefined>>,
): ReportFilters {
  const params = new URLSearchParams();
  for (const key of FILTERS) {
    const value = values[key];
    if (value !== undefined) params.set(key, value);
  }
  return parseReportFilters(params);
}
