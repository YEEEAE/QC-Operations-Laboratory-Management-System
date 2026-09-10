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
    providerUnavailableDetail: 'The system did not receive a confirmed response. This view is not empty, and no count is shown.',
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
    aiNotAuthority: 'AI output is advisory only. It cannot approve, reject, release, sign, or set an official PASS/FAIL.',
  },
} as const;

export const copy = uxVocabulary;
