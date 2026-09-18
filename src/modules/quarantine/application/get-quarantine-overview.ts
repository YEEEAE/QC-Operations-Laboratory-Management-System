import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { describeActorScope } from '../../../shared/authorization/scope-description.js';
import type { ReceivingItem } from '../receiving/domain/receiving-item.js';

export type QuarantineMetricTone = 'neutral' | 'warning' | 'danger' | 'success';

/**
 * One KPI on the Quarantine operational surface.
 *
 * This is the same contract the dashboard decision surface uses, so a count can
 * always be reconciled with the register it links to:
 * - `numerator` says exactly what is counted;
 * - `state` names the exact workflow/scientific/release condition counted;
 * - `actorScope` names whose records the numerator covers;
 * - `timeRange` is the observation window;
 * - `href` must open a register whose filters reproduce the same
 *   numerator/state/actorScope. A drill-down that cannot reproduce the count is
 *   a defect, not a presentation choice.
 */
export interface QuarantineOverviewMetric {
  key: string;
  label: string;
  value: number;
  unit: 'records';
  timeRange: string;
  source: string;
  definition: string;
  numerator: string;
  state: string;
  actorScope: string;
  href: string;
  drilldownLabel: string;
  tone: QuarantineMetricTone;
}
export interface QuarantineOverviewAttention {
  id: string;
  title: string;
  summary: string;
  href: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  state: string;
}
export interface QuarantineOverview {
  generatedAt: Date;
  scopeLabel: string;
  metrics: QuarantineOverviewMetric[];
  attention: QuarantineOverviewAttention[];
  distributions: Array<{ label: string; value: number }>;
}

/**
 * The single read path this surface projects.
 *
 * Every KPI, the attention board and the state distribution are derived from
 * the records the receiving register itself returns for the same actor, so a
 * counter can never disagree with the register (or with another counter) about
 * the same predicate. The previous implementation ran its own `created_by`
 * SQL, which made the counters a narrower set than the registers they linked
 * to and let one counter span two workflow states while its link carried one.
 */
export interface ReceivingOverviewSource {
  list(input: {
    actor: ActorContext;
    state?: ReceivingItem['workflowState'];
    inspectionResult?: ReceivingItem['inspectionResult'];
    releaseState?: 'RELEASED' | 'NOT_RELEASED';
    receivedOn?: 'today';
  }): Promise<readonly ReceivingItem[]>;
}

const ATTENTION_LIMIT = 12;
const ACTOR_SCOPE = 'Your authorized scope — every creator you are allowed to read';
const SOURCE = 'Quarantine receiving register';
const DRILLDOWN = 'Open these receiving records';

export class GetQuarantineOverviewUseCase {
  constructor(
    private readonly receiving: ReceivingOverviewSource,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { actor: ActorContext }): Promise<QuarantineOverview> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-QUAR-VIEW',
        action: 'VIEW',
        entity: {
          type: 'QUARANTINE_DASHBOARD',
          id: 'overview',
          state: 'ACTIVE',
          ownerId: input.actor.id,
        },
        scope: { ownerId: input.actor.id },
        currentVersion: 1,
        expectedVersion: 1,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const [items, receivedToday] = await Promise.all([
      this.receiving.list({ actor: input.actor }),
      this.receiving.list({ actor: input.actor, receivedOn: 'today' }),
    ]);
    const metric = (
      key: string,
      label: string,
      value: number,
      tone: QuarantineMetricTone,
      definition: string,
      numerator: string,
      state: string,
      href: string,
      timeRange = 'current snapshot',
    ): QuarantineOverviewMetric => ({
      key,
      label,
      value,
      unit: 'records',
      timeRange,
      source: SOURCE,
      definition,
      numerator,
      state,
      actorScope: ACTOR_SCOPE,
      href,
      drilldownLabel: DRILLDOWN,
      tone,
    });
    const metrics: QuarantineOverviewMetric[] = [
      metric(
        'received-today',
        'Received today',
        receivedToday.length,
        'neutral',
        'Receiving items you can read whose receiving date is the current server date.',
        'Receiving items in your authorized scope whose receiving date is today',
        'Receiving date = current UTC server date',
        '/quarantine/receiving?receivedOn=today',
        'today (UTC server date)',
      ),
      metric(
        'pending',
        'Pending',
        items.filter((item) => item.workflowState === 'PENDING').length,
        'neutral',
        'Items recorded but not yet ready for inspection.',
        'Receiving items in your authorized scope in workflow state PENDING',
        'workflow state = PENDING',
        '/quarantine/receiving?state=PENDING',
      ),
      metric(
        'ready-for-inspection',
        'Ready for inspection',
        items.filter((item) => item.workflowState === 'READY_FOR_INSPECTION').length,
        'warning',
        'Items waiting for an authorized inspector to start inspection.',
        'Receiving items in your authorized scope in workflow state READY_FOR_INSPECTION',
        'workflow state = READY_FOR_INSPECTION',
        '/quarantine/receiving?state=READY_FOR_INSPECTION',
      ),
      metric(
        'under-inspection',
        'Under inspection',
        items.filter((item) => item.workflowState === 'UNDER_INSPECTION').length,
        'neutral',
        'Items currently in the inspection workflow.',
        'Receiving items in your authorized scope in workflow state UNDER_INSPECTION',
        'workflow state = UNDER_INSPECTION',
        '/quarantine/receiving?state=UNDER_INSPECTION',
      ),
      metric(
        'receiving-hold',
        'Receiving HOLD',
        items.filter((item) => item.workflowState === 'HOLD').length,
        'danger',
        'Items on a receiving workflow hold.',
        'Receiving items in your authorized scope in workflow state HOLD',
        'workflow state = HOLD',
        '/quarantine/receiving?state=HOLD',
      ),
      metric(
        'inspection-hold',
        'Inspection HOLD',
        items.filter((item) => item.inspectionResult === 'HOLD').length,
        'danger',
        'Items whose scientific inspection result is HOLD, whatever their workflow state is.',
        'Receiving items in your authorized scope whose inspection result is HOLD',
        'inspection result = HOLD',
        '/quarantine/receiving?inspectionResult=HOLD',
      ),
      metric(
        'pass-not-released',
        'PASS / not released',
        items.filter((item) => item.inspectionResult === 'PASS' && !item.releaseSystem).length,
        'success',
        'Inspection PASS is separate from the Release System State.',
        'Receiving items in your authorized scope with inspection result PASS and release system state false',
        'inspection result = PASS AND release system state = false',
        '/quarantine/receiving?inspectionResult=PASS&releaseState=NOT_RELEASED',
      ),
      metric(
        'released',
        'Released',
        items.filter((item) => item.releaseSystem).length,
        'success',
        'Items whose explicit Release System State is yes.',
        'Receiving items in your authorized scope whose release system state is true',
        'release system state = true',
        '/quarantine/receiving?releaseState=RELEASED',
      ),
    ];
    const attention: QuarantineOverviewAttention[] = items
      .filter(
        (item) =>
          ['PENDING', 'READY_FOR_INSPECTION', 'HOLD'].includes(item.workflowState) ||
          (item.inspectionResult === 'PASS' && !item.releaseSystem),
      )
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, ATTENTION_LIMIT)
      .map((item) => ({
        id: item.id,
        title: item.receivingNo,
        summary:
          item.inspectionResult === 'PASS' && !item.releaseSystem
            ? 'Inspection PASS is still not released'
            : 'Receiving item requires attention',
        href: `/quarantine/receiving/${item.id}`,
        severity:
          item.workflowState === 'HOLD' || item.inspectionResult === 'HOLD'
            ? 'CRITICAL'
            : 'WARNING',
        state: item.workflowState,
      }));
    const byState = new Map<string, number>();
    for (const item of items) {
      byState.set(item.workflowState, (byState.get(item.workflowState) ?? 0) + 1);
    }
    const distributions = [...byState.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([label, value]) => ({ label, value }));
    return {
      generatedAt: this.now(),
      scopeLabel: describeActorScope(input.actor),
      metrics,
      attention,
      distributions,
    };
  }
}
