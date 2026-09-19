import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
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
      workItem: { state: string; assignedAt?: Date };
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

export interface DashboardTaskReader {
  execute(input: {
    actor: ActorContext;
    filter?: { assigneeId?: string; due?: 'overdue' | 'today' };
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

export interface DashboardSourceDependencies {
  approvals: DashboardApprovalReader;
  notifications: DashboardNotificationReader;
  receiving: DashboardReceivingReader;
  inspections: DashboardInspectionReader;
  tasks: DashboardTaskReader;
  calibrations: DashboardCalibrationReader;
}

/**
 * One task-metric read. The register is bounded, so the source returns the
 * register's own full match count (`total`) for the displayed number and the
 * bounded first page for the attention queue — the same first page the
 * register page opens. Parity is count↔register, never count↔sampled-page.
 */
async function readTaskSource(
  dependencies: DashboardSourceDependencies,
  actor: ActorContext,
  due: 'overdue' | 'today',
): Promise<{ total: number; rows: readonly DashboardAttentionRow[] }> {
  const page = await dependencies.tasks.execute({
    actor,
    filter: { assigneeId: actor.id, due },
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
        timeRange: 'current snapshot',
        source: 'My approvals queue',
        numerator: 'Actionable approval work items returned by the approvals queue',
        state: 'PENDING or IN_PROGRESS work item',
        actorScope: 'Assigned to you or your role',
        definition:
          'Approval work assigned to you or your role that is still actionable. This is the same set the approvals register lists.',
        href: '/approvals',
        drilldownLabel: 'Open my approvals',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Approval is waiting for your decision' },
      read: async (actor) => {
        const records = await dependencies.approvals.execute({ actor });
        return records.map((record): DashboardAttentionRow => ({
          id: record.approvalCase.id,
          title: approvalTitle(record),
          state: record.workItem.state,
          href: `/approvals/${record.approvalCase.id}`,
          anchorAt: record.workItem.assignedAt,
          anchor: 'waiting',
        }));
      },
    },
    {
      metric: {
        key: 'unread-notifications',
        label: 'Unread notifications',
        unit: 'records',
        timeRange: 'current snapshot',
        source: 'Notifications addressed to your account',
        numerator:
          'Unread notifications addressed to your authenticated account, newest first within the register’s bounded page',
        state: 'read timestamp is empty',
        actorScope: 'Addressed to you',
        definition:
          'Notifications addressed to your authenticated account that have not been marked read, newest first within the register’s bounded page. This is the same set the unread view lists.',
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
        timeRange: 'current snapshot',
        source: 'Quarantine receiving register',
        numerator: 'Receiving items you recorded whose inspection result is HOLD',
        state: 'inspection result = HOLD',
        actorScope: 'Created by you',
        definition:
          'Receiving items you recorded whose scientific inspection result is HOLD. Read through the receiving register itself, so the count and its link are the same set.',
        href: '/quarantine/receiving?inspectionResult=HOLD&ownership=mine',
        drilldownLabel: 'Open my HOLD records',
        tone: 'danger',
      },
      attention: {
        severity: 'CRITICAL',
        reason: 'Receiving item is on HOLD and cannot be released',
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
        timeRange: 'current snapshot',
        source: 'Inspection reports register',
        numerator: 'Inspection reports you authored whose workflow state is RETURNED',
        state: 'workflow state = RETURNED',
        actorScope: 'Authored by you',
        definition:
          'Inspection reports you authored that were returned for rework and are waiting for you to resume them.',
        href: '/quarantine/inspections?state=RETURNED&ownership=mine',
        drilldownLabel: 'Open my returned reports',
        tone: 'warning',
      },
      attention: {
        severity: 'WARNING',
        reason: 'Inspection report was returned to you for rework',
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
        timeRange: 'current snapshot',
        source: 'Tasks register',
        numerator:
          'Tasks assigned to you with a due date before the current UTC server date whose state is not COMPLETED or CANCELLED',
        state: 'due date < current UTC date AND state not COMPLETED/CANCELLED',
        actorScope: 'Assigned to you',
        definition:
          'Open work assigned to you whose due date has already passed. The same filter is available in the tasks register.',
        href: '/tasks?assignee=mine&due=overdue',
        drilldownLabel: 'Open my overdue tasks',
        tone: 'danger',
      },
      attention: { severity: 'CRITICAL', reason: 'Task is past its due date' },
      read: (actor) => readTaskSource(dependencies, actor, 'overdue'),
    },
    {
      metric: {
        key: 'tasks-due-today',
        label: 'Tasks due today',
        unit: 'records',
        timeRange: 'current snapshot',
        source: 'Tasks register',
        numerator:
          'Tasks assigned to you whose due date falls on the current UTC server date and whose state is not COMPLETED or CANCELLED',
        state: 'due date = current UTC date AND state not COMPLETED/CANCELLED',
        actorScope: 'Assigned to you',
        definition:
          'Open work assigned to you that is due on the current UTC server date. The same filter is available in the tasks register.',
        href: '/tasks?assignee=mine&due=today',
        drilldownLabel: 'Open my tasks due today',
        tone: 'warning',
      },
      attention: { severity: 'WARNING', reason: 'Task is due today' },
      read: (actor) => readTaskSource(dependencies, actor, 'today'),
    },
    {
      metric: {
        key: 'calibrations-overdue',
        label: 'Calibrations overdue',
        unit: 'records',
        timeRange: 'current snapshot',
        source: 'Calibration register',
        numerator: 'Calibration records in your authorized scope whose recorded state is OVERDUE',
        state: 'calibration state = OVERDUE',
        actorScope: 'Your authorized scope — every equipment record you are allowed to read',
        definition:
          'Records whose explicit calibration state is OVERDUE. Equipment eligibility is verified fail-closed against a CURRENT, not-overdue calibration, so an overdue record blocks the equipment.',
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
    label: 'Your due and overdue tasks',
    state: 'AVAILABLE',
    reason: 'Read through the tasks register with the same due-date filter the links apply.',
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
    label: 'Laboratory workload',
    state: 'NOT_SUPPLIED',
    reason:
      'The laboratory register exposes no server-side state filter or bounded workload read model yet, so no laboratory workload count is presented here.',
  },
  {
    key: 'document-review',
    label: 'Document review queue',
    state: 'NOT_SUPPLIED',
    reason: 'No composed document-review read model is wired to this shared surface.',
  },
  {
    key: 'blocked-reasons',
    label: 'Blocked reasons',
    state: 'NOT_SUPPLIED',
    reason: 'No composed blocked-reason read model is wired to this shared surface.',
  },
  {
    key: 'reject-analytics',
    label: 'Reject quantity, top items/reasons/departments and daily trend',
    state: 'NOT_SUPPLIED',
    reason:
      'Reject analytics stay off this surface until their SQL/runtime defects close and an authorized read path defines the scope: no rejected quantity or trend is estimated here.',
  },
  {
    key: 'quality-summary',
    label: 'Quality record summary',
    state: 'NOT_SUPPLIED',
    reason:
      'The quality registers expose no ownership-scoped filter yet, so a quality count could not be reconciled from the link it would carry.',
  },
  {
    key: 'system-health',
    label: 'System health cards',
    state: 'NOT_SUPPLIED',
    reason:
      'System health is owner-only and stays on /system/health; it is deliberately not mixed into a shared dashboard surface.',
  },
];
