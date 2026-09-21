/**
 * QC-DATA-001 — Receiving audit vocabulary.
 *
 * One map, one authority: the canonical audit action written for each receiving
 * operation. Existing operations keep the action codes the audit log already
 * records (renaming them would break historical queries), and the map names the
 * requested event so the two vocabularies can never drift.
 *
 * Every action below is appended inside the same transaction as the state change
 * it describes; audit rows are append-only and are never rewritten.
 */
export const RECEIVING_AUDIT_ACTIONS = {
  /** RECEIVING_CREATED */
  created: 'CREATE_RECEIVING',
  /** RECEIVING_UPDATED (draft edit) */
  updated: 'RECEIVING_UPDATED',
  /** RECEIVING_CORRECTED (post-entry correction with a recorded reason) */
  corrected: 'RECEIVING_CORRECTED',
  /** RECEIVING_HOLD */
  hold: 'HOLD',
  /** Transition to RELEASE_PENDING = the release request */
  releaseRequested: 'MOVE_TO_RELEASE_PENDING',
  /** RELEASED */
  released: 'RELEASE',
  /** RECEIVING_VOIDED (the approved CANCEL transition) */
  voided: 'CANCEL',
  /** INSPECTION_CREATED_FROM_RECEIVING */
  inspectionCreated: 'INSPECTION_CREATED_FROM_RECEIVING',
} as const;

export type ReceivingAuditAction =
  (typeof RECEIVING_AUDIT_ACTIONS)[keyof typeof RECEIVING_AUDIT_ACTIONS];

/** The requested event name for each canonical action, for reporting only. */
export const RECEIVING_AUDIT_EVENT_NAMES: Readonly<Record<ReceivingAuditAction, string>> = {
  CREATE_RECEIVING: 'RECEIVING_CREATED',
  RECEIVING_UPDATED: 'RECEIVING_UPDATED',
  RECEIVING_CORRECTED: 'RECEIVING_CORRECTED',
  HOLD: 'RECEIVING_HOLD',
  MOVE_TO_RELEASE_PENDING: 'RELEASE_REQUESTED',
  RELEASE: 'RELEASED',
  CANCEL: 'RECEIVING_VOIDED',
  INSPECTION_CREATED_FROM_RECEIVING: 'INSPECTION_CREATED_FROM_RECEIVING',
};
