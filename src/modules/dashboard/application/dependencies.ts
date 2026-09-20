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
import { laboratoryReadDependencies } from '../../laboratory/application/dependencies.js';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants.js';
import { parsePageInput } from '../../../shared/pagination/page.js';
import { taskReadDependencies } from '../../tasks/application/dependencies.js';
import { PostgresDashboardQuery } from '../infrastructure/postgres-dashboard-query.js';
import { GetDashboardUseCase } from './get-dashboard.js';
import { GetMyWorkUseCase } from './get-my-work.js';
import { readMetricSource } from './dashboard-attention.js';
import { createMyWorkQuery } from './my-work-queue.js';
import { projectReceivingTrend, seriesNotSupplied, seriesUnavailable } from './dashboard-series.js';
import {
  DASHBOARD_COVERAGE,
  dashboardFlowSource,
  dashboardMetricSources,
  type DashboardSourceDependencies,
} from './dashboard-sources.js';

/**
 * The owning module's read use cases, composed once.
 *
 * Both surfaces below (the dashboard and "My work today") read through this
 * composition, so they cannot diverge into two definitions of the same count
 * and neither writes SQL over another domain's tables.
 */
function composedSources(): DashboardSourceDependencies {
  return {
    approvals: { execute: (input) => approvalsReadDependencies().list.execute(input) },
    notifications: {
      listOwn: (actor, unreadOnly) => notificationDependencies().listOwn.listOwn(actor, unreadOnly),
    },
    receiving: { execute: (input) => receivingReadDependencies().list.execute(input) },
    inspections: { execute: (input) => inspectionReadDependencies().list.execute(input) },
    // The task register is bounded, so both surfaces sample the same first page
    // the register page opens; the count stays the register's own `total`
    // (see readTaskSource), never a sampled length.
    tasks: {
      execute: (input) =>
        taskReadDependencies().list.execute({
          ...input,
          page: parsePageInput({ pageSize: DEFAULT_PAGE_SIZE }),
        }),
    },
    calibrations: { execute: (input) => assetsReadDependencies().calibration.list.execute(input) },
    // The laboratory register's bounded workload read: one count plus one bounded
    // page, so the laboratory counter and its queue come from a single read.
    laboratory: { execute: (input) => laboratoryReadDependencies().workload.execute(input) },
  };
}

export function dashboardDependencies() {
  const sources = composedSources();
  const overview = quarantineReadDependencies().overview;
  // The only approved dashboard time series is the Quarantine receiving trend.
  // It is narrowed to records this actor created so the chart declares the same
  // actor scope as the count cards beside it.
  const receivingTrend = quarantineReadDependencies().receivingTrend;

  return {
    get: new GetDashboardUseCase(
      new PostgresDashboardQuery(
        getDatabase(),
        dashboardMetricSources(sources),
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

/**
 * The "My work today" workspace.
 *
 * It reads exactly the same register sources as the dashboard and adds no SQL
 * of its own: the queue is a bounded, deduplicated projection of registers that
 * already exist, so nothing here can become a second definition of a count.
 */
export function myWorkDependencies() {
  const sources = dashboardMetricSources(composedSources());
  return {
    get: new GetMyWorkUseCase(
      createMyWorkQuery(sources, async (source, actor) => {
        const result = await readMetricSource(source, actor);
        return { value: result.metric.value, rows: result.rows };
      }),
    ),
  };
}
