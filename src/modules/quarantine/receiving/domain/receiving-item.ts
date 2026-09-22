import { AppError } from '../../../../shared/errors/app-error.js';
import { assertReason, transitionReceiving } from './receiving-state.js';
import type {
  InspectionResult,
  ReceivingAction,
  ReceivingWorkflowState,
} from './receiving-state.js';
import { assertReceivingQuantityUnit, type ReceivingQuantityUnit } from './receiving-units.js';
export interface ReceivingItem {
  id: string;
  receivingNo: string;
  supplier: string;
  docNo: string;
  itemCode: string;
  description: string;
  lot: string;
  /** Received quantity as a canonical decimal string (NUMERIC in PostgreSQL). */
  qty: string;
  /** Controlled unit; absent only on records created before migration 0035. */
  quantityUnit?: ReceivingQuantityUnit;
  purchaseOrderNo?: string;
  /** Import traceability; absent for records created in the application. */
  sourceSystem?: string;
  sourceReference?: string;
  importedAt?: Date;
  receivingDate: Date;
  expiryDate?: Date;
  workflowState: ReceivingWorkflowState;
  inspectionResult: InspectionResult;
  releaseSystem: boolean;
  releasedAt?: Date;
  releasedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
  version: bigint;
  /** Server-derived inspection executor for release SoD checks. */
  inspectionAuthorId?: string;
  /** Server-derived count of active receiving evidence links. */
  evidenceCount?: number;
  /** Server-derived state of the newest linked inspection report. */
  latestInspectionReportState?: string | null;
  /** Server-derived linked inspection reports, newest first (bounded). */
  linkedInspections?: readonly ReceivingLinkedInspection[];
  history?: readonly ReceivingHistoryEvent[];
}

export interface ReceivingLinkedInspection {
  id: string;
  inspectionNo: string;
  state: string;
  finalResult?: string;
  assignedTo?: string;
  updatedAt: Date;
}

export interface ReceivingHistoryEvent {
  action: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  actorId?: string;
  occurredAt: Date;
  requestId: string;
}
export interface NewReceivingItem {
  id: string;
  receivingNo: string;
  supplier: string;
  docNo: string;
  itemCode: string;
  description: string;
  lot: string;
  qty: string | number;
  quantityUnit: string;
  purchaseOrderNo?: string;
  receivingDate: Date;
  expiryDate?: Date;
  sourceSystem?: string;
  sourceReference?: string;
  importedAt?: Date;
  createdBy: string;
  now: Date;
}
const required = (v: string, n: string) => {
  if (!v.trim())
    throw new AppError('VALIDATION_FAILED', { userSafe: true, fieldErrors: { [n]: ['required'] } });
  return v.trim();
};

/** A receiving quantity is a positive finite decimal; never a unit or free text. */
export function assertReceivingQuantity(value: string | number): string {
  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(raw) || !(Number(raw) > 0) || !Number.isFinite(Number(raw))) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { qty: ['positive decimal required'] },
    });
  }
  return Number(raw).toString();
}

/**
 * The receiving date is the physical receiving event; an expiry date before it
 * contradicts that event and is rejected on write. Migration 0035 enforces the
 * same rule in PostgreSQL for every new row.
 */
export function assertExpiryNotBeforeReceiving(receivingDate: Date, expiryDate?: Date): void {
  if (expiryDate && expiryDate.getTime() < receivingDate.getTime()) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { expiryDate: ['must not precede the receiving date'] },
    });
  }
}

export function createReceivingItem(i: NewReceivingItem): ReceivingItem {
  const qty = assertReceivingQuantity(i.qty);
  const quantityUnit = assertReceivingQuantityUnit(i.quantityUnit);
  assertExpiryNotBeforeReceiving(i.receivingDate, i.expiryDate);
  const purchaseOrderNo = i.purchaseOrderNo?.trim();
  return {
    id: i.id,
    receivingNo: required(i.receivingNo, 'receivingNo'),
    supplier: required(i.supplier, 'supplier'),
    docNo: required(i.docNo, 'docNo'),
    itemCode: required(i.itemCode, 'itemCode'),
    description: required(i.description, 'description'),
    lot: required(i.lot, 'lot'),
    qty,
    quantityUnit,
    ...(purchaseOrderNo ? { purchaseOrderNo } : {}),
    ...(i.sourceSystem ? { sourceSystem: i.sourceSystem } : {}),
    ...(i.sourceReference ? { sourceReference: i.sourceReference } : {}),
    ...(i.importedAt ? { importedAt: i.importedAt } : {}),
    receivingDate: i.receivingDate,
    expiryDate: i.expiryDate,
    workflowState: 'PENDING',
    inspectionResult: 'NOT_STARTED',
    releaseSystem: false,
    createdBy: i.createdBy,
    createdAt: i.now,
    updatedAt: i.now,
    version: 1n,
  };
}
export function applyReceivingAction(
  item: ReceivingItem,
  action: ReceivingAction,
  reason?: string,
): ReceivingItem {
  if (['HOLD', 'CANCEL', 'MARK_EXPIRED'].includes(action)) assertReason(reason);
  if (action === 'REMOVE_HOLD') throw new AppError('AUTHZ_DENIED', { userSafe: true });
  return { ...item, workflowState: transitionReceiving(item.workflowState, action) };
}
