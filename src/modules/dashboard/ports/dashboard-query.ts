import type { ActorContext } from '../../../shared/authorization/types.js';

export type DashboardMetricTone = 'neutral' | 'warning' | 'danger' | 'success';

/**
 * One KPI on the dashboard decision surface.
 *
 * Every field below is part of the KPI contract so the displayed number can be
 * reconciled with the register it links to:
 * - `numerator` says exactly what is counted.
 * - `state` names the exact domain/workflow condition the count is filtered by.
 * - `actorScope` says whose records the numerator covers ("created by you",
 *   "assigned to you", …). The dashboard never presents a personal count under
 *   an authorized-scope label, or the reverse.
 * - `timeRange` is the observation window. The dashboard only ever reports the
 *   current server snapshot; it never renders a historical or projected value.
 * - `href` must point at a route whose filters reproduce the same
 *   numerator/state/actorScope. A drill-down that cannot reproduce the count is
 *   a defect, not a presentation choice.
 */
export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  unit: 'records';
  timeRange: 'current snapshot';
  source: string;
  definition: string;
  numerator: string;
  state: string;
  actorScope: string;
  href?: string;
  drilldownLabel?: string;
  tone?: DashboardMetricTone;
}
export interface DashboardAttention {
  id: string;
  title: string;
  summary: string;
  href: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  state: string;
}
export interface DashboardActivity {
  id: string;
  action: string;
  subjectType: string;
  subjectId: string;
  summary: string;
  occurredAt: Date;
}
export interface DashboardReadModel {
  generatedAt: Date;
  scopeLabel: string;
  metrics: DashboardMetric[];
  attention: DashboardAttention[];
  activity: DashboardActivity[];
}
/**
 * One actionable approval awaiting the actor's decision.
 *
 * This is deliberately the same projection the `/approvals` register renders,
 * so the "Pending review" counter and its drill-down can never disagree.
 */
export interface DashboardApprovalItem {
  id: string;
  title: string;
  state: string;
}
export interface DashboardApprovalQueue {
  list(actor: ActorContext): Promise<readonly DashboardApprovalItem[]>;
}
export interface DashboardQuery {
  get(actor: ActorContext): Promise<DashboardReadModel>;
}
