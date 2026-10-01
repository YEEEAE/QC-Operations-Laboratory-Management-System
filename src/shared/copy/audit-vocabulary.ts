const auditSubjectLabels: Readonly<Record<string, string>> = {
  APPROVAL_CASE: 'Approval case',
  AUDIT_EVENT: 'Audit event',
  CALIBRATION_RECORD: 'Calibration record',
  CAPA: 'CAPA',
  CHANGE_REQUEST: 'Change request',
  DOCUMENT_VERSION: 'Controlled document version',
  EQUIPMENT_RECORD: 'Equipment record',
  FINDING: 'Finding',
  INSPECTION_REPORT: 'Inspection report',
  LAB_TEST: 'Laboratory test',
  NCR: 'NCR',
  RECEIVING_RECORD: 'Receiving record',
  TASK: 'Task',
};
const auditActionLabels: Readonly<Record<string, string>> = {
  APPROVE: 'Approved',
  CANCEL: 'Cancelled',
  COMPLETE: 'Completed',
  CREATE: 'Created',
  EDIT: 'Edited',
  FINAL_APPROVE: 'Final approval',
  REJECT: 'Rejected',
  REMOVE: 'Removed',
  RESUME: 'Resumed',
  RETURN: 'Returned',
  SAVE: 'Saved',
  SUBMIT: 'Submitted',
  UPDATE: 'Updated',
  VIEW: 'Viewed',
};

/** Human-facing label for an audit subject without changing its stored type. */
export function auditSubjectLabel(value: string): string {
  return auditSubjectLabels[value] ?? humanizeAuditCode(value);
}

/** Render audit action codes as readable words while preserving unknown terms. */
export function auditActionLabel(value: string): string {
  return auditActionLabels[value] ?? humanizeAuditCode(value);
}

/** Actor display is sourced from the identity record; never expose an internal user UUID. */
export function auditActorLabel(input: {
  actorType: 'USER' | 'SYSTEM' | 'SERVICE';
  displayName?: string;
}): string {
  if (input.actorType === 'SYSTEM') return 'System';
  if (input.actorType === 'SERVICE') return 'Service';
  return input.displayName?.trim() || 'User account no longer available';
}

function humanizeAuditCode(value: string): string {
  const words = value.trim().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!words) return 'Not recorded';
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
