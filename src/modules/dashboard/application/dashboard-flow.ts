import { AppError } from '../../../shared/errors/app-error.js';
import type { QuarantineOverview } from '../../quarantine/application/get-quarantine-overview.js';
import type { DashboardFlow, DashboardFlowStage } from '../ports/dashboard-query.js';

/**
 * The quarantine pipeline as one ordered, decision-relevant progression.
 *
 * Every stage names exactly one Quarantine overview metric and therefore one
 * server-side predicate, so a stage count and the register it opens are the
 * same set by construction (the overview is itself a projection of the
 * receiving register the link opens). Stages are never merged to look tidy: an
 * earlier revision learned that a card spanning two workflow states could not
 * be reproduced by its own link.
 */
const STAGES: readonly { key: string; metricKey: string; label: string }[] = [
  { key: 'received', metricKey: 'received-today', label: 'Received today' },
  { key: 'awaiting-inspection', metricKey: 'ready-for-inspection', label: 'Awaiting inspection' },
  { key: 'under-inspection', metricKey: 'under-inspection', label: 'Under inspection' },
  { key: 'hold', metricKey: 'inspection-hold', label: 'HOLD' },
  { key: 'pass-not-released', metricKey: 'pass-not-released', label: 'PASS not released' },
  { key: 'released', metricKey: 'released', label: 'Released' },
];

const NOT_AUTHORIZED_MESSAGE =
  'Reading the receiving register needs the quarantine view permission, so no stage count is shown. Nothing is estimated in its place.';

/** The honest flow state when the account may not read the receiving register. */
export function quarantineFlowNotAuthorized(): DashboardFlow {
  return {
    key: 'quarantine-pipeline',
    title: 'Quarantine flow',
    summary: '',
    source: 'Quarantine receiving register',
    sourceHref: '/quarantine/receiving',
    actorScope: 'Not available to this account',
    windowLabel: '',
    state: 'NOT_AUTHORIZED',
    message: NOT_AUTHORIZED_MESSAGE,
    stages: [],
  };
}

/**
 * Projects the Quarantine module's own overview into the dashboard pipeline.
 *
 * A missing stage metric is an internal contract violation, so it fails instead
 * of silently dropping a stage from the progression.
 */
export function projectQuarantineFlow(overview: QuarantineOverview): DashboardFlow {
  const byKey = new Map(overview.metrics.map((metric) => [metric.key, metric]));
  const stages: DashboardFlowStage[] = STAGES.map((stage) => {
    const metric = byKey.get(stage.metricKey);
    if (!metric)
      throw new AppError('SYSTEM_INTERNAL', {
        safeMetadata: { dashboardFlowStage: stage.key },
      });
    return {
      key: stage.key,
      label: stage.label,
      value: metric.value,
      definition: metric.definition,
      numerator: metric.numerator,
      state: metric.state,
      actorScope: metric.actorScope,
      href: metric.href,
      drilldownLabel: metric.drilldownLabel,
      tone: metric.tone,
    };
  });
  return {
    key: 'quarantine-pipeline',
    title: 'Quarantine flow',
    summary:
      'One stage per server-side predicate, in the order an item moves through quarantine. Every stage opens the receiving register with the filter that reproduces its own count.',
    source: 'Quarantine receiving register',
    sourceHref: '/quarantine/receiving',
    actorScope: overview.metrics[0]?.actorScope ?? 'Your authorized scope',
    windowLabel:
      'Current snapshot, except "Received today", which counts the current UTC server date.',
    state: 'AVAILABLE',
    message: '',
    stages,
  };
}
