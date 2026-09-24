import type { MyWorkGroupDefinition, MyWorkUnresolvedSource } from '../ports/my-work.js';

/**
 * QC-100-FINAL-022 — the approved meanings of the "My work today" groups.
 *
 * This is the single source of the definitions: the read model, the workspace
 * and its tests all read them from here, so no second copy can drift. Nothing
 * below invents a threshold, a target, a service level or an urgency score —
 * every group is a set membership question answered by a register the reader
 * may open with the same filter.
 *
 * Ownership and actor scope are stated per group because a personal count must
 * never appear under a scope-wide label, or the reverse.
 */
export const MY_WORK_GROUP_DEFINITIONS: Readonly<Record<string, MyWorkGroupDefinition>> = {
  ASSIGNED: {
    category: 'ASSIGNED',
    label: 'Assigned to you',
    membership:
      'Outstanding records whose owning register names your account — or your role — as the holder of the next step.',
    ownership:
      'You are the named holder: the task assignee, the inspection or laboratory author it was returned to, the reviewer assigned by both document-review grants, or the work item assigned to you or to a role you hold.',
    actorScope: 'Records your account is authorized to read, narrowed to your own holding.',
    timezone: 'UTC',
    sourceTimestamp:
      "The register's own assignment or last-update timestamp (task due date, approval assigned-at, report updated-at).",
    predicate:
      'task: current_assignee_id = you AND state not COMPLETED/CANCELLED; approval: actionable work item whose assigned user is you or whose role requirement is a role you hold; inspection/laboratory: author = you AND workflow state = RETURNED; document: both review grants, active document, IN_REVIEW version, not authored by reviewer, and owner-scope or global-scope grants.',
  },
  DUE_TODAY: {
    category: 'DUE_TODAY',
    label: 'Due today',
    membership:
      'Open work whose due date falls on the current UTC day, from the start of that day up to but not including the next.',
    ownership: 'The record is assigned to you: its current assignee is your account.',
    actorScope: 'Records your account is authorized to read, narrowed to your own holding.',
    timezone: 'UTC',
    sourceTimestamp: "The record's own due date (tasks.due_at), stored with a time zone.",
    predicate:
      'due_at >= UTC midnight of the current day AND due_at < UTC midnight of the next day AND state not COMPLETED/CANCELLED.',
  },
  OVERDUE: {
    category: 'OVERDUE',
    label: 'Overdue',
    membership: 'Open work whose due date is before the start of the current UTC day.',
    ownership: 'The record is assigned to you: its current assignee is your account.',
    actorScope: 'Records your account is authorized to read, narrowed to your own holding.',
    timezone: 'UTC',
    sourceTimestamp: "The record's own due date (tasks.due_at), stored with a time zone.",
    predicate:
      'due_at < UTC midnight of the current day AND state not COMPLETED/CANCELLED. A closed record is never overdue whatever its due date says.',
  },
  BLOCKED: {
    category: 'BLOCKED',
    label: 'Blocked',
    membership:
      'Records whose owning register records that they cannot proceed: a task deliberately held, or a receiving item whose scientific result is HOLD and which therefore cannot be released.',
    ownership:
      'You are the named holder (task assignee, or the account that recorded the receiving item).',
    actorScope: 'Records your account is authorized to read, narrowed to your own holding.',
    timezone: 'UTC',
    sourceTimestamp:
      "The register's own holding timestamp: the task's last update when it entered ON_HOLD, or the receiving item's last update.",
    predicate:
      'task: state = ON_HOLD (the transition requires a recorded reason to hold and again to resume); receiving: inspection_result = HOLD. These are the only two recorded blocking states; a free-text blocked reason is not a register field and is listed as unresolved rather than invented.',
  },
};

/**
 * Sources this workspace deliberately does not read.
 *
 * Each entry names the real missing piece and its owner. None of them is
 * rendered as an empty group or a zero, because "we cannot read this" and
 * "there is nothing" are different facts.
 */
export const MY_WORK_UNRESOLVED_SOURCES: readonly MyWorkUnresolvedSource[] = [
  {
    key: 'blocked-reason-text',
    label: 'A recorded free-text reason for blocked work',
    reason:
      'No register stores a blocked reason as a field. A task that is held records its reason in the immutable audit trail at the moment of the transition, and it is readable per record on the task workspace; it is not a queue column, so this workspace does not extract it into one.',
    owner:
      '013/026 if a reason column is approved; otherwise the per-record audit entry stays the source.',
  },
  {
    key: 'assignment-history',
    label: 'Assignment history per record',
    reason:
      'Only the current holder is a register field. The tasks register keeps an assignment history table, but a queue must show the single current holder so a record assigned more than once is never listed more than once.',
    owner: 'Not required for this workspace; the current-holder pointer is the approved reading.',
  },
  {
    key: 'equipment-eligibility-blocks',
    label: 'Equipment blocked by a failed eligibility check',
    reason:
      'Eligibility is verified fail-closed at use time against a current, not-overdue calibration; there is no materialized block record, so no queue row can be read for it. The recorded facts are the calibration record and its explicit OVERDUE state, which is its own register.',
    owner: '017-B with the assets module if a block record is approved.',
  },
  {
    key: 'unassigned-work-in-my-scope',
    label: 'Unassigned work in my authorized scope',
    reason:
      'The registers support an ownership filter ("mine") or the scope-wide read, not "mine or unowned". Presenting scope-wide work as yours would mislabel a scope count as a personal queue.',
    owner: '013 if a personal-plus-unowned reading is approved.',
  },
  {
    key: 'reject-report-analytics',
    label: 'Reject quantity, reasons and trend',
    reason:
      'The reject analytics read model aggregates the whole register with no actor-scope predicate and /reject-reports is an authenticated rather than a permission-bound route, so publishing a global aggregate on a scope-aware personal queue would be an unauthorized aggregate.',
    owner: '017-B with 013/014 to define the read scope.',
  },
];
