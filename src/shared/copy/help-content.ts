import type { PermissionCode } from '../authorization/permissions.js';

/**
 * In-app operating guide content (QC-100-FINAL-020).
 *
 * This module holds only *references*: route IDs resolved from the canonical
 * registry and permission codes resolved from the canonical permission list.
 * It never restates a route path or invents a permission. The help page and
 * `tests/unit/ui/help-content-contract.test.ts` resolve every entry against the
 * live sources, so a renamed route or a dropped permission breaks the build
 * instead of shipping a dead link.
 */

export type HelpRoleCode = 'EMPLOYEE' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN' | 'SYSTEM_OWNER';

export interface HelpRouteLink {
  readonly routeId: string;
  readonly label: string;
  readonly purpose: string;
}

export interface HelpRoleGuide {
  readonly role: HelpRoleCode;
  readonly title: string;
  readonly focus: string;
  /** Route IDs this role starts the day with. */
  readonly startOfDay: readonly string[];
  /** First-line escalation target, expressed as a function, not a person. */
  readonly escalateTo: string;
}

/** Quick links rendered in the help page, resolved from the route registry. */
export const HELP_ROUTE_LINKS: readonly HelpRouteLink[] = [
  {
    routeId: 'RT-DASH-001',
    label: 'Dashboard',
    purpose: 'Your prioritized action counts and attention queue.',
  },
  {
    routeId: 'RT-TASK-001',
    label: 'Tasks',
    purpose: 'Assigned, due and overdue work; filters work without JavaScript.',
  },
  {
    routeId: 'RT-SHARED-002',
    label: 'Notifications',
    purpose: 'Recipient-scoped notifications; delivery is not business completion.',
  },
  {
    routeId: 'RT-APPROVAL-001',
    label: 'My approval queue',
    purpose: 'Records waiting on your review or approval stage.',
  },
  {
    routeId: 'RT-QUAR-001',
    label: 'Quarantine dashboard',
    purpose: 'Receiving and inspection flow with drill-down counts.',
  },
  {
    routeId: 'RT-REC-001',
    label: 'Receiving items',
    purpose: 'Triage register, HOLD state and release actions.',
  },
  {
    routeId: 'RT-REC-002',
    label: 'New receiving item',
    purpose: 'Record an incoming item with its source and evidence.',
  },
  {
    routeId: 'RT-INSP-001',
    label: 'Inspection reports',
    purpose: 'Draft, submitted and returned inspection work.',
  },
  {
    routeId: 'RT-LAB-002',
    label: 'Laboratory tests',
    purpose: 'Test register with bounded newest-first read.',
  },
  {
    routeId: 'RT-LAB-003',
    label: 'New laboratory test',
    purpose: 'Start a test draft and enter samples.',
  },
  { routeId: 'RT-FIND-001', label: 'Findings', purpose: 'Raise and track findings.' },
  { routeId: 'RT-NCR-001', label: 'NCR', purpose: 'Raise and track nonconformances.' },
  {
    routeId: 'RT-CAPA-001',
    label: 'CAPA',
    purpose: 'Corrective/preventive actions and effectiveness review.',
  },
  {
    routeId: 'RT-REJ-001',
    label: 'Reject reports',
    purpose: 'Reject reporting, issue slips and daily reports.',
  },
  {
    routeId: 'RT-DOC-001',
    label: 'Controlled documents',
    purpose: 'Document versions, review and approval.',
  },
  { routeId: 'RT-CHANGE-001', label: 'Change requests', purpose: 'Contextual controlled changes.' },
  {
    routeId: 'RT-EQUIP-001',
    label: 'Equipment',
    purpose: 'Equipment, calibration and maintenance history.',
  },
  {
    routeId: 'RT-CAL-001',
    label: 'Calibration records',
    purpose: 'Calibration state and certificates.',
  },
  {
    routeId: 'RT-REPORT-001',
    label: 'Reports',
    purpose: 'Scoped reporting; export uses the same dataset as the screen.',
  },
  {
    routeId: 'RT-SHARED-004',
    label: 'Audit history',
    purpose: 'Mapped, sanitized audit read model.',
  },
  {
    routeId: 'RT-SHARED-001',
    label: 'Search',
    purpose: 'Cross-domain search within your authorized scope.',
  },
  {
    routeId: 'RT-SHARED-003',
    label: 'Account settings',
    purpose: 'Your identity, password and session.',
  },
  {
    routeId: 'RT-USER-001',
    label: 'Users',
    purpose: 'Member register (administration projections).',
  },
  {
    routeId: 'RT-SYSTEM-001',
    label: 'System health',
    purpose: 'Named-owner-only sanitized readiness overview.',
  },
  {
    routeId: 'RT-SYSTEM-002',
    label: 'Control center',
    purpose: 'Named-owner-only owner overview.',
  },
  {
    routeId: 'RT-BACKUP-001',
    label: 'Backup and recovery',
    purpose: 'Backup posture and restore drill context.',
  },
];

/** Per-role first-hour guidance. Route IDs only; labels come from the registry. */
export const HELP_ROLE_GUIDES: readonly HelpRoleGuide[] = [
  {
    role: 'EMPLOYEE',
    title: 'Employee',
    focus: 'Execute assigned work, enter trusted data, submit for review.',
    startOfDay: ['RT-DASH-001', 'RT-SHARED-002', 'RT-TASK-001', 'RT-INSP-001'],
    escalateTo: 'Supervisor (operational coordination)',
  },
  {
    role: 'SUPERVISOR',
    title: 'Supervisor',
    focus: 'Review submitted work, coordinate workload, resolve HOLD/FAIL.',
    startOfDay: ['RT-DASH-001', 'RT-APPROVAL-001', 'RT-INSP-001', 'RT-LAB-002'],
    escalateTo: 'QCM (Manager)',
  },
  {
    role: 'MANAGER',
    title: 'Manager (QCM)',
    focus: 'Final controlled decisions, release, quality oversight.',
    startOfDay: ['RT-DASH-001', 'RT-APPROVAL-001', 'RT-CAPA-001', 'RT-CHANGE-001'],
    escalateTo: 'Named system owner',
  },
  {
    role: 'ADMIN',
    title: 'Admin',
    focus: 'Members, roles/scopes, configuration, backup administration.',
    startOfDay: ['RT-DASH-001', 'RT-USER-001', 'RT-SHARED-004', 'RT-BACKUP-001'],
    escalateTo: 'Named system owner',
  },
  {
    role: 'SYSTEM_OWNER',
    title: 'System owner (named)',
    focus: 'Exclusive system health, control center, production recovery authorization.',
    startOfDay: ['RT-SYSTEM-001', 'RT-SYSTEM-002', 'RT-BACKUP-001', 'RT-DASH-001'],
    escalateTo: 'Decides platform posture',
  },
];

/**
 * Permission codes cited in the help surface. These are references for
 * understanding "why you can or cannot act"; they are not grants. The canonical
 * grant list is `db/seeds/common.ts` `FOUNDATION_ROLE_PERMISSIONS`.
 */
export const HELP_PERMISSION_CITATIONS: readonly PermissionCode[] = [
  'PERM-TASK-VIEW',
  'PERM-TASK-CREATE',
  'PERM-QUAR-CREATE',
  'PERM-QUAR-RELEASE',
  'PERM-INSP-CREATE',
  'PERM-INSP-SUBMIT',
  'PERM-INSP-APPROVE',
  'PERM-LAB-SUBMIT',
  'PERM-LAB-APPROVE',
  'PERM-APR-APPROVE',
  'PERM-ESIG-SIGN',
  'PERM-DOC-APPROVE',
  'PERM-CHG-APPROVE',
  'PERM-CAPA-CLOSE',
  'PERM-RREJ-CREATE',
  'PERM-RPT-EXPORT-CSV',
  'PERM-IDN-MANAGE-USERS',
  'PERM-ADM-USERS',
  'PERM-ADM-ROLES',
  'PERM-ADM-SCOPES',
  'PERM-BKP-VIEW',
  'PERM-HLTH-VIEW',
];

/**
 * Screen/state guidance matrix (QC-100-FINAL-021): for each major workspace,
 * what the operator can identify in each state and where the real next action
 * lives. Route IDs are resolved against the registry; state names mirror the
 * approved state machines. This is derived guidance, not authority.
 */
export const HELP_GUIDANCE_MATRIX: readonly {
  readonly routeId: string;
  readonly screen: string;
  readonly entries: readonly {
    readonly state: string;
    readonly meaning: string;
    readonly nextAction: string;
  }[];
}[] = [
  {
    routeId: 'RT-REC-003',
    screen: 'Receiving item',
    entries: [
      {
        state: 'READY_FOR_INSPECTION',
        meaning: 'Item registered and waiting for inspection.',
        nextAction: 'Start inspection (inspectors with the inspection permission).',
      },
      {
        state: 'HOLD',
        meaning: 'A controlled HOLD is active; the item is blocked pending disposition.',
        nextAction: 'Resolve the HOLD with the quality owner; do not release around it.',
      },
      {
        state: 'RELEASE_PENDING',
        meaning:
          'Approved inspection consequence recorded; release is a separate authorized transition.',
        nextAction:
          'Release authority executes the release; others wait — visibility is not authority.',
      },
      {
        state: 'PASS result but not released',
        meaning: 'Inspection result and release system state are separate controlled states.',
        nextAction:
          'Release remains a distinct action for the release authority — PASS ≠ RELEASED.',
      },
    ],
  },
  {
    routeId: 'RT-INSP-004',
    screen: 'Inspection review (two-stage)',
    entries: [
      {
        state: 'SUBMITTED',
        meaning: 'Stage 1 of 2 — waiting for a reviewer to begin review.',
        nextAction: 'Reviewer opens the review workspace.',
      },
      {
        state: 'UNDER_REVIEW',
        meaning: 'Stage 1 decision pending — Supervisor approval sends the report to QCM.',
        nextAction: 'Supervisor approves/returns/rejects; this is not the final approval.',
      },
      {
        state: 'PENDING_QCM_APPROVAL',
        meaning: 'Stage 2 of 2 — QCM final approval with binding e-signature and reauthentication.',
        nextAction:
          'QCM (Manager) or the named owner performs the final approval; Admin is denied.',
      },
      {
        state: 'APPROVED',
        meaning: 'Approval chain complete — an approval state, not a release command.',
        nextAction: 'Return to the receiving item for any release step. PASS ≠ RELEASED.',
      },
      {
        state: 'RETURNED',
        meaning: 'Sent back for correction; the submission path is preserved.',
        nextAction: 'Executor fixes the draft and resubmits; the same two-stage path resumes.',
      },
    ],
  },
  {
    routeId: 'RT-DOC-005',
    screen: 'Document version',
    entries: [
      {
        state: 'DRAFT',
        meaning: 'Draft content; not under review.',
        nextAction: 'Owner edits and submits for review.',
      },
      {
        state: 'IN_REVIEW',
        meaning: 'Under reviewer decision.',
        nextAction: 'Reviewer opens the review workspace; others wait.',
      },
      {
        state: 'APPROVED',
        meaning: 'Approved but not yet effective.',
        nextAction: 'Effective-date/activation stays policy-controlled.',
      },
      {
        state: 'EFFECTIVE / SUPERSEDED',
        meaning: 'Approved content is immutable.',
        nextAction: 'Use a new revision or a controlled change request.',
      },
    ],
  },
];

/** Read-only/denied statements the help page makes, tied to their evidence. */
export const HELP_STATE_NOTES: readonly { readonly situation: string; readonly meaning: string }[] =
  [
    {
      situation: 'A page opens but the action form is hidden',
      meaning:
        'Page visibility does not grant mutation authority. The action is refused server-side by permission, state, scope, SoD or version.',
    },
    {
      situation: '“Refresh record” appears',
      meaning:
        'The record changed since you loaded it. Reload and re-apply; never retry the stale intent.',
    },
    {
      situation: 'A dashboard value shows “Not available”',
      meaning: 'Your scope has no read for that source, or it is unavailable. It is not zero.',
    },
    {
      situation: 'An inspection result is PASS but material is not released',
      meaning: 'Inspection result and release system state are separate. PASS ≠ RELEASED.',
    },
    {
      situation: 'Final approval is refused for a Supervisor or Admin',
      meaning:
        'Final approval is QCM (Manager) or the named owner only, with a binding e-signature. Admin is denied in both stages.',
    },
  ];
