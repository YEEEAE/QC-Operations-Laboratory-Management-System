import { getDatabase } from '../../../shared/database/database.js';
import { approvalsReadDependencies } from '../../approvals/application/dependencies.js';
import { PostgresDashboardQuery } from '../infrastructure/postgres-dashboard-query.js';
import { GetDashboardUseCase } from './get-dashboard.js';

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
  return {
    get: new GetDashboardUseCase(
      new PostgresDashboardQuery(getDatabase(), {
        list: async (actor) => {
          const records = await approvals.execute({ actor });
          return records.map((record) => ({
            id: record.approvalCase.id,
            title: approvalTitle(record),
            state: record.workItem.state,
          }));
        },
      }),
    ),
  };
}
