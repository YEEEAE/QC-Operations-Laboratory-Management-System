import { getDatabase } from '../../../shared/database/database.js';
import { PostgresDashboardQuery } from '../infrastructure/postgres-dashboard-query.js';
import { GetDashboardUseCase } from './get-dashboard.js';

export function dashboardDependencies() {
  return { get: new GetDashboardUseCase(new PostgresDashboardQuery(getDatabase())) };
}
