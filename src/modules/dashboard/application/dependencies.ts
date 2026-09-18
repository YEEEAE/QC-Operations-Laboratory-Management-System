import { getDatabase } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { approvalsReadDependencies } from '../../approvals/application/dependencies.js';
import { quarantineReadDependencies } from '../../quarantine/application/dependencies.js';
import { PostgresDashboardQuery } from '../infrastructure/postgres-dashboard-query.js';
import { GetDashboardUseCase } from './get-dashboard.js';
import { projectReceivingTrend, seriesNotSupplied, seriesUnavailable } from './dashboard-series.js';

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

export function dashboardDependencies() {
  // Reuse the canonical approvals reader instead of a second, drifting query.
  const approvals = approvalsReadDependencies().list;
  // The only approved dashboard time series is the Quarantine receiving trend,
  // read through the owning module's contract (no dashboard SQL over another
  // domain's tables). It is narrowed to records this actor created so the chart
  // declares the same actor scope as the KPI cards beside it.
  const receivingTrend = quarantineReadDependencies().receivingTrend;
  return {
    get: new GetDashboardUseCase(
      new PostgresDashboardQuery(
        getDatabase(),
        {
          list: async (actor) => {
            const records = await approvals.execute({ actor });
            return records.map((record) => ({
              id: record.approvalCase.id,
              title: approvalTitle(record),
              state: record.workItem.state,
            }));
          },
        },
        {
          get: async (actor) => {
            try {
              return projectReceivingTrend(
                await receivingTrend.execute({ actor, ownership: 'mine' }),
              );
            } catch (error) {
              // An authorization failure is a different fact from a failed read,
              // and neither may become a plotted zero or an empty chart.
              if (error instanceof AppError && error.category === 'AUTHORIZATION')
                return seriesNotSupplied('NOT_AUTHORIZED');
              return seriesUnavailable();
            }
          },
        },
      ),
    ),
  };
}
