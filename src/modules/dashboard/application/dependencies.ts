import { getDatabase } from '../../../shared/database/database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { notificationDependencies } from '../../../shared/notifications/notification-dependencies.js';
import { approvalsReadDependencies } from '../../approvals/application/dependencies.js';
import { assetsReadDependencies } from '../../assets/application/dependencies.js';
import {
  inspectionReadDependencies,
  quarantineReadDependencies,
  receivingReadDependencies,
} from '../../quarantine/application/dependencies.js';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants.js';
import { parsePageInput } from '../../../shared/pagination/page.js';
import { taskReadDependencies } from '../../tasks/application/dependencies.js';
import { PostgresDashboardQuery } from '../infrastructure/postgres-dashboard-query.js';
import { GetDashboardUseCase } from './get-dashboard.js';
import { projectReceivingTrend, seriesNotSupplied, seriesUnavailable } from './dashboard-series.js';
import {
  DASHBOARD_COVERAGE,
  dashboardFlowSource,
  dashboardMetricSources,
} from './dashboard-sources.js';

export function dashboardDependencies() {
  // Every source below is the owning module's own read use case, so this
  // surface never writes SQL over another domain's tables and a displayed
  // count is always the register's own row count.
  const approvals = approvalsReadDependencies().list;
  const notifications = notificationDependencies().listOwn;
  const receiving = receivingReadDependencies().list;
  const inspections = inspectionReadDependencies().list;
  const tasks = taskReadDependencies().list;
  const calibrations = assetsReadDependencies().calibration.list;
  const overview = quarantineReadDependencies().overview;
  // The only approved dashboard time series is the Quarantine receiving trend.
  // It is narrowed to records this actor created so the chart declares the same
  // actor scope as the count cards beside it.
  const receivingTrend = quarantineReadDependencies().receivingTrend;

  return {
    get: new GetDashboardUseCase(
      new PostgresDashboardQuery(
        getDatabase(),
        dashboardMetricSources({
          approvals: { execute: (input) => approvals.execute(input) },
          notifications: {
            listOwn: (actor, unreadOnly) => notifications.listOwn(actor, unreadOnly),
          },
          receiving: { execute: (input) => receiving.execute(input) },
          inspections: { execute: (input) => inspections.execute(input) },
          // The task register is bounded, so the dashboard samples the same
          // first page the register page opens; the count stays the register's
          // own `total` (see readTaskSource), never a sampled length.
          tasks: {
            execute: (input) =>
              tasks.execute({
                ...input,
                page: parsePageInput({ pageSize: DEFAULT_PAGE_SIZE }),
              }),
          },
          calibrations: { execute: (input) => calibrations.execute(input) },
        }),
        dashboardFlowSource({ execute: (input) => overview.execute(input) }),
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
        DASHBOARD_COVERAGE,
      ),
    ),
  };
}
