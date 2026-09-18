/**
 * Shared user-facing vocabulary for the regulated QC workspace.
 *
 * Keep regulated domain terms (NCR, CAPA, PASS, RELEASED, VOID, etc.) intact.
 * This module owns presentation wording only; it must not become a policy
 * registry or an authorization source.
 */
export const uxVocabulary = {
  actions: {
    createTask: 'Create task',
    createFinding: 'Create finding',
    createLaboratoryTest: 'Create laboratory test',
    saveDraft: 'Save draft',
    saveChanges: 'Save changes',
    submitForReview: 'Submit for review',
    approveDocument: 'Approve document',
    rejectInspection: 'Reject inspection',
    releaseItem: 'Release item',
    requestRestore: 'Record restore request',
    openReview: 'Open review',
    viewRecords: 'View records',
    viewHistory: 'View audit history',
    applyFilters: 'Apply filters',
    clearFilters: 'Clear filters',
    retry: 'Try again',
    cancel: 'Cancel',
    close: 'Close',
    signAndContinue: 'Sign and continue',
    signOut: 'Sign out',
  },
  states: {
    providerUnavailable: 'Data is temporarily unavailable',
    providerUnavailableDetail:
      'The system did not receive a confirmed response. This view is not empty, and no count is shown.',
    noRecords: 'No records in this view',
    noFilterMatches: 'No records match the selected filters',
    noAuthorizedResults: 'No matching records found',
    notDetermined: 'Not determined',
    notProvided: 'Not provided',
    notVerified: 'Not verified',
    readOnly: 'This record is read-only',
    staleRecord: 'This record changed after you opened it',
  },
  labels: {
    record: 'Record',
    intendedAction: 'Action to take',
    submittedBy: 'Submitted by',
    currentVersion: 'Current version',
    auditHistory: 'Audit history',
    systemHealth: 'System health',
    backupAndRecovery: 'Backup and recovery',
    aiAdvisory: 'AI advisory',
    authorizedScope: 'Your authorized scope',
  },
  errors: {
    reviewFields: 'There is a problem. Review the highlighted fields.',
    noControlledAction: 'No controlled action was confirmed. Try again, or return to the record.',
    serviceUnavailable: 'The service is temporarily unavailable. Nothing was changed. Try again.',
    authorizationChanged: 'Your authorization changed. Refresh the page before trying again.',
    staleRecord: 'Your action was not applied. Review the latest version before continuing.',
  },
  boundaries: {
    backupNotRestoreProof: 'A backup created or verified here is not proof of a verified restore.',
    passNotRelease: 'PASS is a scientific result. It does not release the item.',
    aiNotAuthority:
      'AI output is advisory only. It cannot approve, reject, release, sign, or set an official PASS/FAIL.',
  },
} as const;

/**
 * Display labels for controlled state codes.
 *
 * Raw enum values stay in the data layer and in the URL filter contract;
 * operators read sentence-case labels. Regulated QC terms (PASS, FAIL, HOLD,
 * RELEASED, VOID, NCR, CAPA) keep their exact spelling and are never renamed.
 */
export const stateLabels: Readonly<Record<string, string>> = {
  // Receiving workflow
  PENDING: 'Pending',
  READY_FOR_INSPECTION: 'Ready for inspection',
  UNDER_INSPECTION: 'Under inspection',
  INSPECTION_COMPLETE: 'Inspection complete',
  RELEASE_PENDING: 'Release pending',
  RELEASED: 'RELEASED',
  HOLD: 'HOLD',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  // Inspection result
  NOT_STARTED: 'Not started',
  PASS: 'PASS',
  FAIL: 'FAIL',
  // Report / test / document lifecycle
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  RETURNED: 'Returned',
  VOID: 'VOID',
  // Task
  OPEN: 'Open',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  // Account / equipment / calibration / maintenance
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  DISABLED: 'Disabled',
  OUT_OF_SERVICE: 'Out of service',
  UNDER_MAINTENANCE: 'Under maintenance',
  DECOMMISSIONED: 'Decommissioned',
  PLANNED: 'Planned',
  SCHEDULED: 'Scheduled',
  CURRENT: 'Current',
  DUE: 'Due',
  OVERDUE: 'Overdue',
  FAILED: 'Failed',
  // Notifications
  UNREAD: 'Unread',
  READ: 'Read',
};

/** Sentence-case label for a controlled state code; never invents a state. */
export function stateLabel(code: string | null | undefined): string {
  if (!code) return '—';
  const known = stateLabels[code];
  if (known) return known;
  const humanized = code.replace(/_/g, ' ').toLowerCase();
  return humanized.charAt(0).toUpperCase() + humanized.slice(1);
}

export function releaseStateLabel(released: boolean): string {
  return released ? 'RELEASED' : 'Not released';
}

/** Audit transition display: never renders “Not set to Not set”. */
export function transitionLabel(from?: string | null, to?: string | null): string {
  const fromLabel = from ? stateLabel(from) : null;
  const toLabel = to ? stateLabel(to) : null;
  if (fromLabel && toLabel) return `${fromLabel} → ${toLabel}`;
  if (toLabel) return `→ ${toLabel}`;
  if (fromLabel) return `${fromLabel} → —`;
  return 'Created';
}

export const copy = uxVocabulary;
