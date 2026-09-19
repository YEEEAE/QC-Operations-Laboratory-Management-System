import { AppError } from '../../../../shared/errors/app-error.js';
import type { FinalResult, InspectionResultEntry } from './inspection-result.js';
import { transitionInspection, requireReason } from './inspection-state.js';
import type { InspectionAction, InspectionState } from './inspection-state.js';
export interface ReceivingContext {
  receivingId: string;
  receivingNo: string;
  supplier?: string;
  docNo: string;
  itemCode: string;
  description: string;
  lot: string;
  qty: string;
  receivingDate: Date;
  expiryDate?: Date;
}
export interface TemplateContext {
  templateId: string;
  templateVersionId: string;
  versionNo: string;
  templateSnapshot: Readonly<Record<string, unknown>>;
  approved: boolean;
  sourceDocument?: string;
}
export interface Inspection {
  id: string;
  inspectionNo: string;
  receiving: ReceivingContext;
  template: TemplateContext;
  state: InspectionState;
  finalResult?: FinalResult;
  authorId: string;
  assignedTo?: string;
  evidenceCount?: number;
  results: readonly InspectionResultEntry[];
  submittedAt?: Date;
  version: bigint;
  createdAt: Date;
  updatedAt: Date;
}
export function createInspection(i: {
  id: string;
  inspectionNo: string;
  receiving: ReceivingContext;
  template: TemplateContext;
  authorId: string;
  assignedTo?: string;
  now: Date;
}) {
  if (!i.template.approved) throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    ...i,
    state: 'DRAFT' as const,
    assignedTo: i.assignedTo ?? i.authorId,
    results: [],
    version: 1n,
    createdAt: i.now,
    updatedAt: i.now,
  };
}
export function applyInspectionAction(x: Inspection, a: InspectionAction, reason?: string) {
  if (['RETURN', 'REJECT', 'VOID', 'REOPEN'].includes(a)) requireReason(reason);
  if (a === 'SUBMIT' && x.results.length === 0)
    throw new AppError('VALIDATION_FAILED', { userSafe: true });
  return {
    ...x,
    state: transitionInspection(x.state, a),
    submittedAt: a === 'SUBMIT' ? new Date() : x.submittedAt,
  };
}
