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
    authorizationChanged:
      'This action is unavailable. Refresh the page or return to the list, then try again if you still have access.',
    staleRecord: 'Your action was not applied. Review the latest version before continuing.',
  },
  /**
   * Failure copy per canonical server error class. Every mutation form picks
   * the message for its class so operators can tell a validation problem from
   * a permission denial, a stale record, a missing dependency, or a service
   * outage — never one generic "something failed".
   */
  errorClasses: {
    VALIDATION_ERROR:
      'Your entries were not accepted. Review the highlighted fields and try again. Your entries are preserved.',
    AUTHORIZATION_CHANGED:
      'This action is unavailable. Refresh the page or return to the list, then try again if you still have access. Your entries are preserved.',
    CONFLICT_STALE:
      'Someone changed this record after you opened it. Reload the latest data before trying again. Nothing was resubmitted.',
    DEPENDENCY_UNAVAILABLE:
      'This action is unavailable. Refresh the page or return to the list, then try again if you still have access. Your entries are preserved.',
    DUPLICATE_COMMAND:
      'This action was already applied. Reload the record to see the current state — nothing was duplicated.',
    UNKNOWN_SAFE_ERROR:
      'The action did not complete. Nothing was changed — try again, or return to the record.',
  },
  /**
   * Human labels for change-request target types and approval workflow types.
   * Raw codes stay in the server contract; operators read the human label.
   */
  targetTypeLabels: {
    DOCUMENT_VERSION: 'Controlled document version',
  } as Record<string, string>,
  /** Human labels for approval workflow types. Unknown codes fall back verbatim. */
  workflowTypeLabels: {
    DOCUMENT_VERSION_APPROVAL: 'Controlled document version approval',
    INSPECTION_APPROVAL: 'Inspection approval',
    LAB_TEST_APPROVAL: 'Laboratory test approval',
    CHANGE_REQUEST_APPROVAL: 'Change request approval',
  } as Record<string, string>,
  /**
   * The controlled lifecycle words keep four distinct meanings. Copy never
   * collapses them: saved is not submitted, review is not approval, approval
   * is not release, and approval is not application (change requests).
   */
  lifecycle: {
    saved: 'Saved as a draft. Nothing was submitted, reviewed, approved, or released.',
    submitted: 'Submitted for review. No review, approval, or release has happened yet.',
    reviewed:
      'Reviewed. A reviewer examined the record; review alone does not approve or release it.',
    approved:
      'Approved. The controlled approval decision was accepted. Approval does not release the item.',
    released: 'RELEASED. A separate policy-controlled release action was accepted by the server.',
  },
  /**
   * Human labels for authorization scope kinds. Raw codes stay in the server
   * contract; operators read the human label first, with the code in parens.
   */
  scopeKindLabels: {
    OWN: 'Own records',
    ASSIGNED: 'Assigned records',
    TEAM: 'Team records',
    DEPARTMENT: 'Department records',
    SITE: 'Site records',
    DOMAIN: 'Domain records',
    GLOBAL: 'Whole system',
  } as Record<string, string>,
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
  // Document lifecycle (controlled documents)
  IN_REVIEW: 'In review',
  EFFECTIVE: 'Effective',
  SUPERSEDED: 'Superseded',
  // Reject-report lifecycle
  ISSUED: 'Issued',
  APPROVAL_TRACKING: 'Awaiting approvals',
  FINALIZED: 'Finalized',
  // Change-request lifecycle
  APPLYING: 'Applying',
  APPLIED: 'Applied',
  APPLICATION_FAILED: 'Application failed',
  CLOSED: 'Closed',
  // Two-stage approval + result values
  PENDING_QCM_APPROVAL: 'Pending QCM approval',
  NOT_DETERMINED: 'Not determined',
  NOT_RELEASED: 'Not released',
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
  // NCR / CAPA lifecycle (QC-100-FINAL-024)
  UNDER_INVESTIGATION: 'Under investigation',
  RCA_IN_PROGRESS: 'RCA in progress',
  CAPA_IN_PROGRESS: 'CAPA in progress',
  READY_FOR_CLOSURE: 'Ready for closure',
};

/** Severity labels — human words first, no raw codes. */
export function severityLabel(severity: string | null | undefined): string {
  if (!severity) return 'Not classified';
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
}

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

/** Human label for a change-request target type; never invents a mapping. */
export function targetTypeLabel(code: string | null | undefined): string {
  if (!code) return 'Not supplied';
  return uxVocabulary.targetTypeLabels[code] ?? code;
}

/** Human label for an approval workflow type; never invents a mapping. */
export function workflowTypeLabel(code: string | null | undefined): string {
  if (!code) return 'Not supplied';
  return uxVocabulary.workflowTypeLabels[code] ?? code;
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
