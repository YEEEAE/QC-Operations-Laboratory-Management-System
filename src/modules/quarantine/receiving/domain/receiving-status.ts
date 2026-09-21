/**
 * QC-DATA-001 — Derived receiving status projections.
 *
 * The approved facts stay where they are:
 *   `workflow_state`      — the receiving workflow state machine
 *                           (`receiving-state.ts` / STATE-MACHINES.md)
 *   `inspection_result`   — the scientific inspection fact
 *                           (NOT_STARTED | IN_PROGRESS | PASS | FAIL | HOLD)
 *   `release_system`      — the explicit release fact
 *
 * This module does **not** introduce a second state machine. It publishes three
 * read projections of those facts so the register, the filters and the dashboard
 * can speak about them without ever disagreeing, and it records the one rule that
 * must never be broken: an accepted inspection is not a release.
 */
import type { InspectionResult, ReceivingWorkflowState } from './receiving-state.js';

/** Inspection reporting status, projected from the approved workflow + result. */
export const RECEIVING_INSPECTION_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'RETURNED',
] as const;
export type ReceivingInspectionStatus = (typeof RECEIVING_INSPECTION_STATUSES)[number];

/** Quarantine decision status, projected from the approved workflow + result. */
export const RECEIVING_QUARANTINE_STATUSES = [
  'PENDING_INSPECTION',
  'UNDER_INSPECTION',
  'HOLD',
  'PASS',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type ReceivingQuarantineStatus = (typeof RECEIVING_QUARANTINE_STATUSES)[number];

/** Release status, projected from `workflow_state` + `release_system`. */
export const RECEIVING_RELEASE_STATUSES = [
  'NOT_RELEASED',
  'RELEASE_PENDING',
  'RELEASED',
] as const;
export type ReceivingReleaseStatus = (typeof RECEIVING_RELEASE_STATUSES)[number];

/** The three facts a projection needs; never a UI concern. */
export interface ReceivingStatusFacts {
  workflowState: ReceivingWorkflowState;
  inspectionResult: InspectionResult;
  releaseSystem: boolean;
  /** Latest linked inspection report state, when one exists. */
  latestInspectionReportState?: string | null;
}

const COMPLETED_WORKFLOW_STATES: readonly ReceivingWorkflowState[] = [
  'INSPECTION_COMPLETE',
  'RELEASE_PENDING',
  'RELEASED',
];
const COMPLETED_RESULTS: readonly InspectionResult[] = ['PASS', 'FAIL', 'HOLD'];
const TERMINAL_WITHOUT_INSPECTION: readonly ReceivingWorkflowState[] = ['CANCELLED', 'EXPIRED'];

/**
 * Inspection status.
 *
 * RETURNED wins when the latest linked inspection report was returned to the
 * author, because that is the state the receiving record is actually waiting on.
 */
export function deriveInspectionStatus(facts: ReceivingStatusFacts): ReceivingInspectionStatus {
  if (facts.latestInspectionReportState === 'RETURNED') return 'RETURNED';
  if (facts.workflowState === 'UNDER_INSPECTION') return 'IN_PROGRESS';
  if (facts.inspectionResult === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (TERMINAL_WITHOUT_INSPECTION.includes(facts.workflowState)) return 'NOT_STARTED';
  if (COMPLETED_WORKFLOW_STATES.includes(facts.workflowState)) return 'COMPLETED';
  if (COMPLETED_RESULTS.includes(facts.inspectionResult)) return 'COMPLETED';
  return 'NOT_STARTED';
}

/**
 * Quarantine/decision status. A HOLD on either the workflow or the scientific
 * result is the HOLD state; FAIL is the rejected decision; PASS is the accepted
 * decision — and none of these releases anything.
 */
export function deriveQuarantineStatus(facts: ReceivingStatusFacts): ReceivingQuarantineStatus {
  if (facts.workflowState === 'CANCELLED') return 'CANCELLED';
  if (facts.workflowState === 'EXPIRED') return 'EXPIRED';
  if (facts.workflowState === 'HOLD' || facts.inspectionResult === 'HOLD') return 'HOLD';
  if (facts.inspectionResult === 'FAIL') return 'REJECTED';
  if (facts.inspectionResult === 'PASS') return 'PASS';
  if (facts.workflowState === 'UNDER_INSPECTION') return 'UNDER_INSPECTION';
  return 'PENDING_INSPECTION';
}

/** Release status. `release_system` is the only source of a RELEASED fact. */
export function deriveReleaseStatus(facts: ReceivingStatusFacts): ReceivingReleaseStatus {
  if (facts.releaseSystem) return 'RELEASED';
  if (facts.workflowState === 'RELEASE_PENDING') return 'RELEASE_PENDING';
  return 'NOT_RELEASED';
}

/**
 * The release invariant: an accepted inspection (PASS) never releases the
 * material by itself. Release requires the approved release path to have run.
 */
export function inspectionAcceptanceReleasesMaterial(): false {
  return false;
}

export function isReceivingInspectionStatus(value: unknown): value is ReceivingInspectionStatus {
  return (
    typeof value === 'string' && (RECEIVING_INSPECTION_STATUSES as readonly string[]).includes(value)
  );
}

export function isReceivingQuarantineStatus(value: unknown): value is ReceivingQuarantineStatus {
  return (
    typeof value === 'string' &&
    (RECEIVING_QUARANTINE_STATUSES as readonly string[]).includes(value)
  );
}

export function isReceivingReleaseStatus(value: unknown): value is ReceivingReleaseStatus {
  return (
    typeof value === 'string' && (RECEIVING_RELEASE_STATUSES as readonly string[]).includes(value)
  );
}
