import { AppError } from '../../../shared/errors/app-error.js';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { roleLabel } from '../../../shared/authorization/scope-description.js';
import { notificationDestination } from '../../../shared/notifications/notification-destination.js';
import type { QuarantineOverview } from '../../quarantine/application/get-quarantine-overview.js';
import { projectQuarantineFlow, quarantineFlowNotAuthorized } from './dashboard-flow.js';
import type {
  DashboardAttentionRow,
  DashboardCoverageItem,
  DashboardFlowSource,
  DashboardMetricSource,
} from '../ports/dashboard-query.js';

/**
 * Structural contracts for the registers this surface reads.
 *
 * Each one is declared as the *shape* the dashboard consumes, so the real use
 * case can be injected without this module taking a dependency on another
 * module's domain model, and so the definitions can be exercised against a real
 * database in tests without a second copy of the dashboard wiring.
 */
export interface DashboardApprovalReader {
  execute(input: { actor: ActorContext }): Promise<
    readonly {
      approvalCase: { id: string; subjectType: string };
      workItem: {
        state: string;
        assignedAt?: Date;
        /**
         * The role requirement the approval register records for this work
         * item. It names the responsible role in the register's own words, so
         * the queue never guesses an approver role.
         */
        assignedRoleRequirement?: string;
      };
      subject: { reviewContext: Readonly<Record<string, unknown>> };
    }[]
  >;
}

export interface DashboardNotificationReader {
  listOwn(
    actor: ActorContext,
    unreadOnly?: boolean,
  ): Promise<
    readonly {
      id: string;
      title: string;
      message: string;
      severity: 'INFO' | 'WARNING' | 'CRITICAL';
      subjectType?: string;
      subjectId?: string;
      createdAt: Date;
    }[]
  >;
}

// The option types are the exact literal filters this surface passes, so the
// real register use case stays assignable without the dashboard re-declaring a
// foreign domain vocabulary it does not own.
export interface DashboardReceivingReader {
  execute(input: {
    actor: ActorContext;
    inspectionResult?: 'HOLD';
    ownership?: 'mine';
  }): Promise<
    readonly { id: string; receivingNo: string; workflowState: string; updatedAt: Date }[]
  >;
}

export interface DashboardInspectionReader {
  execute(input: {
    actor: ActorContext;
    state?: 'RETURNED';
    ownership?: 'mine';
  }): Promise<readonly { id: string; inspectionNo: string; state: string; updatedAt: Date }[]>;
}

/** The tasks register's own state vocabulary, repeated only as a type alias. */
type TaskStateFilter = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface DashboardTaskReader {
  execute(input: {
    actor: ActorContext;
    filter?: {
      assigneeId?: string;
      due?: 'overdue' | 'today';
      /** The register's own task-state vocabulary, so no new vocabulary is declared here. */
      state?: TaskStateFilter;
      open?: boolean;
    };
  }): Promise<{
    items: readonly { id: string; taskNo: string; state: string; dueAt?: Date }[];
    total: number;
  }>;
}

export interface DashboardCalibrationReader {
  execute(input: {
    actor: ActorContext;
    filter?: { state?: 'OVERDUE' };
  }): Promise<readonly { id: string; calibrationNo: string; state: string; dueDate?: Date }[]>;
}

// The laboratory register is bounded: it returns the register's own full match
// count for the displayed number plus its bounded newest-first page for the
// attention queue, exactly like the tasks register.
export interface DashboardLaboratoryReader {
  execute(input: {
    actor: ActorContext;
    filter?: { state?: 'RETURNED'; ownership?: 'mine' };
    limit: number;
  }): Promise<{
    total: number;
    rows: readonly { id: string; labTestNo: string; state: string; updatedAt: Date }[];
  }>;
}

export interface DashboardDocumentReviewReader {
  execute(input: { actor: ActorContext; limit: number }): Promise<{
    total: number;
    items: readonly {
      versionId: string;
      documentId: string;
      documentNo: string;
      revision: string;
      state: string;
      createdAt: Date;
    }[];
  }>;
}

export interface DashboardSourceDependencies {
  approvals: DashboardApprovalReader;
  notifications: DashboardNotificationReader;
  receiving: DashboardReceivingReader;
  inspections: DashboardInspectionReader;
  tasks: DashboardTaskReader;
  calibrations: DashboardCalibrationReader;
  laboratory: DashboardLaboratoryReader;
  documentReview: DashboardDocumentReviewReader;
}

/**
 * The freshness statement every counter carries.
 *
 * A count is read from its owning register while the snapshot is rendered, so
 * the value on screen is the register's value at that moment; nothing is cached
 * or aged between renders and no earlier read is presented as current.
 */
const SNAPSHOT_FRESHNESS =
  'Read from the owning register while this snapshot renders; no cached or earlier value is shown.';

/**
 * A bounded laboratory workload read, shared by the laboratory counter and its
 * queue so both come from one register read.
 */
async function readLaboratorySource(
  dependencies: DashboardSourceDependencies,
  actor: ActorContext,
): Promise<{ total: number; rows: readonly DashboardAttentionRow[] }> {
  const page = await dependencies.laboratory.execute({
    actor,
    filter: { state: 'RETURNED', ownership: 'mine' },
    limit: LABORATORY_ATTENTION_PAGE,
  });
  return {
    total: page.total,
    rows: page.rows.map((test): DashboardAttentionRow => ({
      id: test.id,
      title: test.labTestNo,
      state: test.state,
      href: `/laboratory/tests/${test.id}`,
      anchorAt: test.updatedAt,
      anchor: 'waiting',
    })),
  };
}

/**
 * The bound on the laboratory page this surface samples.
 *
 * It matches the register page's own first page, both in size and ordering
 * (newest first by last update), so the queue shows the same rows the register
 * opens instead of a separately-chosen slice.
 */
export const LABORATORY_ATTENTION_PAGE = DEFAULT_PAGE_SIZE;

/**
 * One task-metric read. The register is bounded, so the source returns the
 * register's own full match count (`total`) for the displayed number and the
 * bounded first page for the attention queue — the same first page the
 * register page opens. Parity is count↔register, never count↔sampled-page.
 */
/**
 * One task-metric read over the tasks register, always narrowed to the reader.
 *
 * Every task filter the queue declares is one the register itself supports, so
 * the number on screen and the register the link opens are the same set — the
 * due windows, the single state, and "still open" all resolve in the register's
 * own SQL, not here.
 */
async function readTaskSource(
  dependencies: DashboardSourceDependencies,
  actor: ActorContext,
  filter: { due?: 'overdue' | 'today'; state?: TaskStateFilter; open?: boolean },
): Promise<{ total: number; rows: readonly DashboardAttentionRow[] }> {
  const page = await dependencies.tasks.execute({
    actor,
    filter: { assigneeId: actor.id, ...filter },
  });
  return {
    total: page.total,
    rows: page.items.map((task): DashboardAttentionRow => ({
      id: task.id,
      title: task.taskNo,
      state: task.state,
      href: `/tasks/${task.id}`,
      anchorAt: task.dueAt,
      anchor: 'due',
    })),
  };
}

/** Human label for an approval subject, falling back to the subject type. */
function approvalTitle(record: {
  approvalCase: { subjectType: string };
  subject: { reviewContext: Readonly<Record<string, unknown>> };
}): string {
  const context = record.subject.reviewContext;
  const candidate = context['documentNo'] ?? context['inspectionNo'] ?? context['labTestNo'];
  return typeof candidate === 'string' && candidate.length > 0
    ? candidate
    : record.approvalCase.subjectType;
}

/**
 * The real sources behind every dashboard action count.
 *
 * Each definition declares its numerator, condition, actor scope and the exact
 * drill-down link, and reads the register that link opens — so the displayed
 * number is the register's own row count and a count can never contradict its
 * own link.
 */
export function dashboardMetricSources(
  dependencies: DashboardSourceDependencies,
): readonly DashboardMetricSource[] {
  return [
    {
      metric: {
        key: 'pending-review',
        label: 'Pending review',
        unit: 'records',
        denominator: 'Every approval work item your account may read',
        grain: 'One actionable approval work item',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'My approvals queue',
        numerator: 'Actionable approval work items returned by the approvals queue',
        state: 'PENDING or IN_PROGRESS work item',
        actorScope: 'Assigned to you or your role',
        definition:
          'Approval work assigned to you or your role that is still actionable. This is the same set the approvals register lists.',
        drilldown:
          '/approvals — the queue already lists your own actionable work items, so it carries no extra filter',
        href: '/approvals',
        drilldownLabel: 'Open my approvals',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Approval is waiting for your decision' },
      queue: {
        category: 'ASSIGNED',
        reason: 'Approval is waiting for your decision',
        nextAction: 'Open the approval case and record your decision there.',
        responsibleRole: 'The approval authority recorded on the work item',
      },
      read: async (actor) => {
        const records = await dependencies.approvals.execute({ actor });
        return records.map((record): DashboardAttentionRow => ({
          id: record.approvalCase.id,
          title: approvalTitle(record),
          state: record.workItem.state,
          href: `/approvals/${record.approvalCase.id}`,
          anchorAt: record.workItem.assignedAt,
          anchor: 'waiting',
          // The role requirement is recorded by the approval register, so the
          // queue names the responsible role it can read instead of guessing.
          responsibleRole: record.workItem.assignedRoleRequirement
            ? roleLabel(record.workItem.assignedRoleRequirement)
            : undefined,
        }));
      },
    },
    {
      metric: {
        key: 'unread-notifications',
        label: 'Unread notifications',
        unit: 'records',
        denominator: 'Every notification addressed to your authenticated account',
        grain: 'One notification addressed to you',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Notifications addressed to your account',
        numerator:
          'Unread notifications addressed to your authenticated account, newest first within the register’s bounded page',
        state: 'read timestamp is empty',
        actorScope: 'Addressed to you',
        definition:
          'Notifications addressed to your authenticated account that have not been marked read, newest first within the register’s bounded page. This is the same set the unread view lists.',
        drilldown: '?unread=1 on the notifications register',
        href: '/notifications?unread=1',
        drilldownLabel: 'Open unread notifications',
        tone: 'neutral',
      },
      attention: { severity: 'INFO', reason: 'Unread notification addressed to you' },
      read: async (actor) => {
        const rows = await dependencies.notifications.listOwn(actor, true);
        return rows.map((notification): DashboardAttentionRow => ({
          id: notification.id,
          title: notification.title,
          state: 'UNREAD',
          href: notificationDestination(notification.subjectType, notification.subjectId),
          anchorAt: notification.createdAt,
          anchor: 'waiting',
          // The notification carries its own severity and message, so the
          // queue shows the recorded severity instead of a surface default.
          severity: notification.severity,
          reason: notification.message,
        }));
      },
    },
    {
      metric: {
        key: 'hold-items',
        label: 'My HOLD items',
        unit: 'records',
        denominator: 'Every receiving item you recorded',
        grain: 'One receiving item',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Quarantine receiving register',
        numerator: 'Receiving items you recorded whose inspection result is HOLD',
        state: 'inspection result = HOLD',
        actorScope: 'Created by you',
        definition:
          'Receiving items you recorded whose scientific inspection result is HOLD. Read through the receiving register itself, so the count and its link are the same set.',
        drilldown: '?inspectionResult=HOLD&ownership=mine on the receiving register',
        href: '/quarantine/receiving?inspectionResult=HOLD&ownership=mine',
        drilldownLabel: 'Open my HOLD records',
        tone: 'danger',
      },
      attention: {
        severity: 'CRITICAL',
        reason: 'Receiving item is on HOLD and cannot be released',
      },
      queue: {
        category: 'BLOCKED',
        reason: 'Receiving item is on HOLD and cannot be released',
        nextAction:
          'Open the receiving item and follow the controlled decision. A scientific PASS does not release it.',
        responsibleRole: 'The account that recorded the item, with the QC release authority',
      },
      read: async (actor) => {
        const rows = await dependencies.receiving.execute({
          actor,
          inspectionResult: 'HOLD',
          ownership: 'mine',
        });
        return rows.map((item): DashboardAttentionRow => ({
          id: item.id,
          title: item.receivingNo,
          state: item.workflowState,
          href: `/quarantine/receiving/${item.id}`,
          anchorAt: item.updatedAt,
          anchor: 'waiting',
        }));
      },
    },
    {
      metric: {
        key: 'returned-inspections',
        label: 'Returned to me',
        unit: 'records',
        denominator: 'Every inspection report you authored',
        grain: 'One inspection report',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Inspection reports register',
        numerator: 'Inspection reports you authored whose workflow state is RETURNED',
        state: 'workflow state = RETURNED',
        actorScope: 'Authored by you',
        definition:
          'Inspection reports you authored that were returned for rework and are waiting for you to resume them.',
        drilldown: '?state=RETURNED&ownership=mine on the inspection register',
        href: '/quarantine/inspections?state=RETURNED&ownership=mine',
        drilldownLabel: 'Open my returned reports',
        tone: 'warning',
      },
      attention: {
        severity: 'WARNING',
        reason: 'Inspection report was returned to you for rework',
      },
      queue: {
        category: 'ASSIGNED',
        reason: 'Inspection report was returned to you for rework',
        nextAction: 'Open the returned report and resume it as its author.',
        responsibleRole: 'You, as the report author',
      },
      read: async (actor) => {
        const rows = await dependencies.inspections.execute({
          actor,
          state: 'RETURNED',
          ownership: 'mine',
        });
        return rows.map((inspection): DashboardAttentionRow => ({
          id: inspection.id,
          title: inspection.inspectionNo,
          state: inspection.state,
          href: `/quarantine/inspections/${inspection.id}`,
          anchorAt: inspection.updatedAt,
          anchor: 'waiting',
        }));
      },
    },
    {
      metric: {
        key: 'tasks-overdue',
        label: 'Tasks overdue',
        unit: 'records',
        denominator: 'Every task assigned to you',
        grain: 'One task',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Tasks register',
        numerator:
          'Tasks assigned to you with a due date before the current UTC server date whose state is not COMPLETED or CANCELLED',
        state: 'due date < current UTC date AND state not COMPLETED/CANCELLED',
        actorScope: 'Assigned to you',
        definition:
          'Open work assigned to you whose due date has already passed. The same filter is available in the tasks register.',
        drilldown: '?assignee=mine&due=overdue on the tasks register',
        href: '/tasks?assignee=mine&due=overdue',
        drilldownLabel: 'Open my overdue tasks',
        tone: 'danger',
      },
      attention: { severity: 'CRITICAL', reason: 'Task is past its due date' },
      queue: {
        category: 'OVERDUE',
        reason: 'Task is past its due date',
        nextAction: 'Open the task and complete it, or move its due date with a reason.',
        responsibleRole: 'You, as the named assignee',
      },
      read: (actor) => readTaskSource(dependencies, actor, { due: 'overdue' }),
    },
    {
      metric: {
        key: 'tasks-due-today',
        label: 'Tasks due today',
        unit: 'records',
        denominator: 'Every task assigned to you',
        grain: 'One task',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Tasks register',
        numerator:
          'Tasks assigned to you whose due date falls on the current UTC server date and whose state is not COMPLETED or CANCELLED',
        state: 'due date = current UTC date AND state not COMPLETED/CANCELLED',
        actorScope: 'Assigned to you',
        definition:
          'Open work assigned to you that is due on the current UTC server date. The same filter is available in the tasks register.',
        drilldown: '?assignee=mine&due=today on the tasks register',
        href: '/tasks?assignee=mine&due=today',
        drilldownLabel: 'Open my tasks due today',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Task is due today' },
      queue: {
        category: 'DUE_TODAY',
        reason: 'Task is due today',
        nextAction: 'Open the task and complete it, or move its due date with a reason.',
        responsibleRole: 'You, as the named assignee',
      },
      read: (actor) => readTaskSource(dependencies, actor, { due: 'today' }),
    },
    {
      metric: {
        key: 'tasks-assigned',
        label: 'Tasks assigned to me',
        unit: 'records',
        denominator: 'Every task assigned to you',
        grain: 'One task',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Tasks register',
        numerator:
          'Tasks whose current assignee is you and whose state is not COMPLETED or CANCELLED',
        state: 'current assignee = you AND state not COMPLETED/CANCELLED',
        actorScope: 'Assigned to you',
        definition:
          'Everything currently assigned to you that is still open, whether or not it carries a due date. This is the same filter the tasks register opens, so an assigned task with no due date is never invisible.',
        drilldown: '?assignee=mine&open=1 on the tasks register',
        href: '/tasks?assignee=mine&open=1',
        drilldownLabel: 'Open everything assigned to me',
        tone: 'neutral',
      },
      attention: { severity: 'INFO', reason: 'Task is assigned to you and still open' },
      queue: {
        category: 'ASSIGNED',
        reason: 'Task is assigned to you and still open',
        nextAction: 'Open the task and start, complete or hand it on.',
        responsibleRole: 'You, as the named assignee',
      },
      read: (actor) => readTaskSource(dependencies, actor, { open: true }),
    },
    {
      metric: {
        key: 'tasks-on-hold',
        label: 'Tasks on hold',
        unit: 'records',
        denominator: 'Every task assigned to you',
        grain: 'One task',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Tasks register',
        numerator: 'Tasks assigned to you whose recorded state is ON_HOLD',
        state: 'state = ON_HOLD',
        actorScope: 'Assigned to you',
        definition:
          'Work you have deliberately held. The state machine requires a recorded reason both to hold a task and to resume it, so a held task is a recorded blocking fact rather than an inferred one.',
        drilldown: '?assignee=mine&state=ON_HOLD on the tasks register',
        href: '/tasks?assignee=mine&state=ON_HOLD',
        drilldownLabel: 'Open my held tasks',
        tone: 'warning',
      },
      attention: {
        severity: 'WARNING',
        reason: 'Task is on hold and needs a recorded reason to resume',
      },
      queue: {
        category: 'BLOCKED',
        reason: 'Task is on hold and needs a recorded reason to resume',
        nextAction:
          'Open the task and resume it, or cancel it. Resuming requires the reason the transition records.',
        responsibleRole: 'You, as the named assignee',
      },
      read: (actor) => readTaskSource(dependencies, actor, { state: 'ON_HOLD' }),
    },
    {
      metric: {
        key: 'calibrations-overdue',
        label: 'Calibrations overdue',
        unit: 'records',
        denominator: 'Every calibration record readable in your authorized scope',
        grain: 'One calibration record',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Calibration register',
        numerator: 'Calibration records in your authorized scope whose recorded state is OVERDUE',
        state: 'calibration state = OVERDUE',
        actorScope: 'Your authorized scope — every equipment record you are allowed to read',
        definition:
          'Records whose explicit calibration state is OVERDUE. Equipment eligibility is verified fail-closed against a CURRENT, not-overdue calibration, so an overdue record blocks the equipment.',
        drilldown: '?state=OVERDUE on the calibration register',
        href: '/assets/calibrations?state=OVERDUE',
        drilldownLabel: 'Open overdue calibrations',
        tone: 'danger',
      },
      attention: {
        severity: 'CRITICAL',
        reason: 'Calibration is overdue; equipment eligibility fails closed until it is current',
      },
      read: async (actor) => {
        const rows = await dependencies.calibrations.execute({
          actor,
          filter: { state: 'OVERDUE' },
        });
        return rows.map((record): DashboardAttentionRow => ({
          id: record.id,
          title: record.calibrationNo,
          state: record.state,
          href: `/assets/calibrations/${record.id}`,
          anchorAt: record.dueDate,
          anchor: 'due',
        }));
      },
    },
    {
      metric: {
        key: 'lab-tests-returned',
        label: 'Lab tests returned to me',
        unit: 'records',
        denominator: 'Every laboratory test you authored',
        grain: 'One laboratory test',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Laboratory register',
        numerator: 'Laboratory tests you authored whose workflow state is RETURNED',
        state: 'workflow state = RETURNED',
        actorScope: 'Authored by you',
        definition:
          'Laboratory tests you authored that were returned for rework and are waiting for you to resume them. Read through the laboratory register’s own bounded workload read, so the count is the register’s full filtered population and the queue is its bounded newest-first page.',
        drilldown: '?state=RETURNED&ownership=mine on the laboratory register',
        href: '/laboratory/tests?state=RETURNED&ownership=mine',
        drilldownLabel: 'Open my returned lab tests',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Laboratory test was returned to you for rework' },
      queue: {
        category: 'ASSIGNED',
        reason: 'Laboratory test was returned to you for rework',
        nextAction: 'Open the returned test and resume it as its author.',
        responsibleRole: 'You, as the test author',
      },
      read: (actor) => readLaboratorySource(dependencies, actor),
    },
    {
      metric: {
        key: 'documents-pending-my-review',
        label: 'Documents awaiting your review',
        unit: 'records',
        denominator: 'Every active document version your account may review',
        grain: 'One document version awaiting review',
        timeRange: 'current snapshot',
        timezone: 'UTC',
        freshness: SNAPSHOT_FRESHNESS,
        source: 'Document review queue',
        numerator: 'Active IN_REVIEW versions you are authorized to review, excluding versions you authored',
        state: 'version = IN_REVIEW and document active',
        actorScope: 'Both document-review and approval-review grants; owner scope or global scope',
        definition: 'Active document versions awaiting your review. The count and bounded rows use the same indexed query and reviewer/author scope.',
        drilldown: '?review=mine on the controlled documents register',
        href: '/documents?review=mine',
        drilldownLabel: 'Open documents awaiting my review',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Document version is waiting for your review' },
      queue: {
        category: 'ASSIGNED',
        reason: 'Document version is waiting for your review',
        nextAction: 'Review the version in the controlled documents register.',
        responsibleRole: 'You, with both document-review and approval-review authority',
      },
      read: async (actor) => {
        const page = await dependencies.documentReview.execute({ actor, limit: DEFAULT_PAGE_SIZE });
        return {
          total: page.total,
          rows: page.items.map((item): DashboardAttentionRow => ({
            id: item.versionId,
            title: `${item.documentNo} · ${item.revision}`,
            state: item.state,
            href: `/documents/${item.documentId}/versions/${item.versionId}/review`,
            anchorAt: item.createdAt,
            anchor: 'waiting',
          })),
        };
      },
    },
  ];
}

/**
 * The quarantine pipeline source.
 *
 * A permission decision reports the flow as unavailable; any other read failure
 * propagates so the whole snapshot is withheld instead of drawing a stage of
 * zero.
 */
export function dashboardFlowSource(overview: {
  execute(input: { actor: ActorContext }): Promise<QuarantineOverview>;
}): DashboardFlowSource {
  return {
    get: async (actor) => {
      try {
        return projectQuarantineFlow(await overview.execute({ actor }));
      } catch (error) {
        if (error instanceof AppError && error.category === 'AUTHORIZATION')
          return quarantineFlowNotAuthorized();
        throw error;
      }
    },
  };
}

/**
 * Data products this surface deliberately does not render.
 *
 * Each entry states the real reason, so the panel answers "what can this
 * snapshot not tell me yet" with a fact instead of an approximation. Nothing
 * here is estimated, and no owner-only source is mixed into this shared surface.
 */
export const DASHBOARD_COVERAGE: readonly DashboardCoverageItem[] = [
  {
    key: 'approvals',
    label: 'Approvals waiting for your decision',
    state: 'AVAILABLE',
    reason: 'Read through the canonical approvals queue — the same set /approvals lists.',
  },
  {
    key: 'quarantine-flow',
    label: 'Quarantine pipeline stages',
    state: 'AVAILABLE',
    reason:
      'Projected from the quarantine overview, which reads the same receiving register its links open.',
  },
  {
    key: 'notifications',
    label: 'Unread notifications addressed to you',
    state: 'AVAILABLE',
    reason: 'Read through the notification service for your authenticated account only.',
  },
  {
    key: 'tasks',
    label: 'Your assigned, due, overdue and held tasks',
    state: 'AVAILABLE',
    reason:
      'Read through the tasks register: the same assignee, still-open, due-date and single-state filters the links apply are implemented in the register, so assigned work with no due date is counted rather than invisible.',
  },
  {
    key: 'inspections',
    label: 'Inspection reports returned to you',
    state: 'AVAILABLE',
    reason: 'Read through the inspection register with the return filter the link applies.',
  },
  {
    key: 'calibrations',
    label: 'Overdue calibrations',
    state: 'AVAILABLE',
    reason: 'Read through the calibration register filtered to its explicit OVERDUE state.',
  },
  {
    key: 'receiving-trend',
    label: 'Receiving records per day',
    state: 'AVAILABLE',
    reason: 'The single approved server series, with its grain, unit, window and zero policy.',
  },
  {
    key: 'laboratory-workload',
    label: 'Laboratory workload (state-filtered, owner-scoped)',
    state: 'AVAILABLE',
    reason:
      'Read through the laboratory register’s own bounded workload read: the count is the register’s full filtered population for one workflow state and the queue samples its bounded newest-first page. The multi-state workload chart from the chart pool is not drawn; each state is queryable on the register instead.',
  },
  {
    key: 'document-review',
    label: 'Document review queue',
    state: 'AVAILABLE',
    reason:
      'The documents read model uses one indexed IN_REVIEW query scoped by both required review grants and the reviewer/author rule; the same query supplies its full match count and bounded review links.',
  },
  {
    key: 'blocked-reasons',
    label: 'Blocked reasons',
    state: 'NOT_SUPPLIED',
    reason:
      'Blocked work is readable (held tasks and HOLD receiving items each have their own counter, and "My work today" groups them as blocked), but no register stores a blocked reason as a field: a task records its reason in the immutable audit trail at the transition. A queue column of blocked reasons therefore cannot be read, and none is inferred. Owner: 013/026 if a reason column is approved.',
  },
  {
    key: 'reject-analytics',
    label: 'Reject quantity, top items/reasons/departments and daily trend',
    state: 'NOT_SUPPLIED',
    reason:
      'The reject analytics read model aggregates the whole register with no actor-scope predicate, and /reject-reports is declared an authenticated route rather than a permission-bound one, so a global reject aggregate placed on a scope-aware dashboard would be an unauthorized aggregate: no rejected quantity or trend is estimated here. Owner: 017-B with 013/014 to define the read scope.',
  },
  {
    key: 'quality-summary',
    label: 'Quality record summary',
    state: 'NOT_SUPPLIED',
    reason:
      'The quality registers support a state filter only — no ownership filter exists server-side — so a quality count could not be reproduced by the link it would carry. Owner: 017-B.',
  },
  {
    key: 'system-health',
    label: 'System health cards',
    state: 'NOT_SUPPLIED',
    reason:
      'System health is deliberately not a dashboard data product: /system/health is gated by the system-health read use case, which redirects non-owners to 404, so it is excluded from this shared surface rather than missing.',
  },
];
