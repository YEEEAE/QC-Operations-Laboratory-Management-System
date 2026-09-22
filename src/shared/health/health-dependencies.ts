import { getDatabase } from '../database/database.js';
import { PostgresRejectReportRepository } from '../../modules/reject-reports/infrastructure/postgres-repository.js';
import { PostgresReadinessProbe } from './postgres-readiness-probe.js';
import { RequiredWorkflowReadinessProbe } from './required-workflow-readiness.js';
import { createReadinessResponse } from './readiness.js';

export function readinessDependencies() {
  const rejectReports = {
    async availability() {
      try {
        return await new PostgresRejectReportRepository(getDatabase()).availability();
      } catch {
        return { available: false };
      }
    },
  };
  return {
    probe: new RequiredWorkflowReadinessProbe(new PostgresReadinessProbe(), [rejectReports]),
    createResponse: createReadinessResponse,
  };
}
