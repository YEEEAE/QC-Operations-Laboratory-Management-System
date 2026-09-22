/**
 * QC-DATA-001 — Receiving register filter contract.
 *
 * One parser, one vocabulary. Every query parameter the register accepts is
 * listed in `RECEIVING_FILTER_PARAMETERS`; anything else is reported as
 * rejected instead of being silently ignored, so a URL can never claim a filter
 * the backend does not apply.
 */
import {
  INSPECTION_RESULTS,
  RECEIVING_WORKFLOW_STATES,
  type InspectionResult,
  type ReceivingWorkflowState,
} from '../domain/receiving-state.js';
import {
  RECEIVING_INSPECTION_STATUSES,
  RECEIVING_QUARANTINE_STATUSES,
  RECEIVING_RELEASE_STATUSES,
  type ReceivingInspectionStatus,
  type ReceivingQuarantineStatus,
  type ReceivingReleaseStatus,
} from '../domain/receiving-status.js';

export interface ReceivingListFilters {
  /** Free-text search across receiving number, document, item, lot, supplier, PO. */
  q?: string;
  itemCode?: string;
  lot?: string;
  supplier?: string;
  purchaseOrderNo?: string;
  state?: ReceivingWorkflowState;
  inspectionResult?: InspectionResult;
  inspectionStatus?: ReceivingInspectionStatus;
  quarantine?: ReceivingQuarantineStatus;
  releaseState?: ReceivingReleaseStatus;
  ownership?: 'mine';
  receivedOn?: 'today';
  /** Inclusive ISO date bounds (`YYYY-MM-DD`). */
  receivedFrom?: string;
  receivedTo?: string;
  expiryFrom?: string;
  expiryTo?: string;
}

export const RECEIVING_FILTER_PARAMETERS = [
  'q',
  'itemCode',
  'lot',
  'supplier',
  'purchaseOrderNo',
  'state',
  'workflowState',
  'inspectionResult',
  'inspectionStatus',
  'quarantine',
  'releaseState',
  'ownership',
  'receivedOn',
  'receivedFrom',
  'receivedTo',
  'expiryFrom',
  'expiryTo',
] as const;

export interface RejectedReceivingFilter {
  parameter: string;
  value: string;
  reason: 'UNKNOWN_PARAMETER' | 'UNSUPPORTED_VALUE';
}

export interface ParsedReceivingFilters {
  filters: ReceivingListFilters;
  rejected: RejectedReceivingFilter[];
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isRealDate = (value: string): boolean => {
  if (!DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const oneOf = <T extends string>(values: readonly T[], raw: string | null): T | undefined =>
  raw === null ? undefined : values.find((value) => value === raw.toUpperCase());

function text(params: URLSearchParams, key: string): string | undefined {
  const raw = params.get(key);
  if (raw === null) return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 200 || trimmed.includes('\0')) return undefined;
  return trimmed;
}

/**
 * Parses the register query string.
 *
 * Every parameter that is not part of the contract, and every value outside its
 * vocabulary, is returned in `rejected` — never dropped silently.
 */
export function parseReceivingFilters(params: URLSearchParams): ParsedReceivingFilters {
  const rejected: RejectedReceivingFilter[] = [];
  const filters: ReceivingListFilters = {};
  const known = new Set<string>(RECEIVING_FILTER_PARAMETERS);

  for (const key of params.keys()) {
    if (!known.has(key)) {
      rejected.push({ parameter: key, value: params.get(key) ?? '', reason: 'UNKNOWN_PARAMETER' });
    }
  }

  const q = text(params, 'q');
  if (q) filters.q = q;
  const itemCode = text(params, 'itemCode');
  if (itemCode) filters.itemCode = itemCode;
  const lot = text(params, 'lot');
  if (lot) filters.lot = lot;
  const supplier = text(params, 'supplier');
  if (supplier) filters.supplier = supplier;
  const purchaseOrderNo = text(params, 'purchaseOrderNo');
  if (purchaseOrderNo) filters.purchaseOrderNo = purchaseOrderNo;

  const rawState = params.get('state') ?? params.get('workflowState');
  if (rawState !== null) {
    const state = oneOf(RECEIVING_WORKFLOW_STATES, rawState);
    if (state) filters.state = state;
    else rejected.push({ parameter: 'state', value: rawState, reason: 'UNSUPPORTED_VALUE' });
  }

  const rawResult = params.get('inspectionResult');
  if (rawResult !== null) {
    const inspectionResult = oneOf(INSPECTION_RESULTS, rawResult);
    if (inspectionResult) filters.inspectionResult = inspectionResult;
    else
      rejected.push({
        parameter: 'inspectionResult',
        value: rawResult,
        reason: 'UNSUPPORTED_VALUE',
      });
  }

  const rawInspection = params.get('inspectionStatus');
  if (rawInspection !== null) {
    const inspectionStatus = oneOf(RECEIVING_INSPECTION_STATUSES, rawInspection);
    if (inspectionStatus) filters.inspectionStatus = inspectionStatus;
    else
      rejected.push({
        parameter: 'inspectionStatus',
        value: rawInspection,
        reason: 'UNSUPPORTED_VALUE',
      });
  }

  const rawQuarantine = params.get('quarantine');
  if (rawQuarantine !== null) {
    const quarantine = oneOf(RECEIVING_QUARANTINE_STATUSES, rawQuarantine);
    if (quarantine) filters.quarantine = quarantine;
    else
      rejected.push({ parameter: 'quarantine', value: rawQuarantine, reason: 'UNSUPPORTED_VALUE' });
  }

  const rawRelease = params.get('releaseState');
  if (rawRelease !== null) {
    const releaseState = oneOf(RECEIVING_RELEASE_STATUSES, rawRelease);
    if (releaseState) filters.releaseState = releaseState;
    else
      rejected.push({ parameter: 'releaseState', value: rawRelease, reason: 'UNSUPPORTED_VALUE' });
  }

  const rawOwnership = params.get('ownership');
  if (rawOwnership !== null) {
    if (rawOwnership.toLowerCase() === 'mine') filters.ownership = 'mine';
    else
      rejected.push({ parameter: 'ownership', value: rawOwnership, reason: 'UNSUPPORTED_VALUE' });
  }

  const rawReceivedOn = params.get('receivedOn');
  if (rawReceivedOn !== null) {
    if (rawReceivedOn.toLowerCase() === 'today') filters.receivedOn = 'today';
    else
      rejected.push({ parameter: 'receivedOn', value: rawReceivedOn, reason: 'UNSUPPORTED_VALUE' });
  }

  const bounds: Array<[keyof ReceivingListFilters, string]> = [
    ['receivedFrom', 'receivedFrom'],
    ['receivedTo', 'receivedTo'],
    ['expiryFrom', 'expiryFrom'],
    ['expiryTo', 'expiryTo'],
  ];
  for (const [key, parameter] of bounds) {
    const raw = params.get(parameter);
    if (raw === null) continue;
    const value = raw.trim();
    if (!isRealDate(value)) {
      rejected.push({ parameter, value: raw, reason: 'UNSUPPORTED_VALUE' });
      continue;
    }
    filters[key] = value as never;
  }

  if (filters.receivedFrom && filters.receivedTo && filters.receivedFrom > filters.receivedTo) {
    rejected.push({
      parameter: 'receivedFrom',
      value: filters.receivedFrom,
      reason: 'UNSUPPORTED_VALUE',
    });
    delete filters.receivedFrom;
  }
  if (filters.expiryFrom && filters.expiryTo && filters.expiryFrom > filters.expiryTo) {
    rejected.push({
      parameter: 'expiryFrom',
      value: filters.expiryFrom,
      reason: 'UNSUPPORTED_VALUE',
    });
    delete filters.expiryFrom;
  }

  return { filters, rejected };
}
