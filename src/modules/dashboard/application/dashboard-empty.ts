import type { ActorContext } from '../../../shared/authorization/types.js';
import { describeActorScope } from '../../../shared/authorization/scope-description.js';
import type { DashboardReadModel } from '../ports/dashboard-query.js';
import { quarantineFlowNotAuthorized } from './dashboard-flow.js';
import { seriesUnavailable } from './dashboard-series.js';

/**
 * The value the surface holds while no confirmed snapshot exists.
 *
 * Every collection is empty and the flow/series carry their explicit
 * "not available" states, so a page that renders this value can never show a
 * number, a chart or an "all clear" claim that the server did not confirm.
 */
export function emptyDashboard(actor: ActorContext): DashboardReadModel {
  return {
    generatedAt: new Date(),
    scopeLabel: describeActorScope(actor),
    metrics: [],
    flow: quarantineFlowNotAuthorized(),
    attention: [],
    attentionSources: [],
    activity: [],
    series: seriesUnavailable(),
    coverage: [],
  };
}
