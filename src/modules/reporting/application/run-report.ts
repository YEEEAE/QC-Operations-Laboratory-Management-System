import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ReportDataset, ReportQuery } from '../ports/report-query.js';
import { ReportRegistry } from './report-registry.js';
import type { ReportFilters } from '../domain/report-definition.js';

function validateFilters(filters: ReportFilters): ReportFilters {
  for (const value of [filters.from, filters.to])
    if (value !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new AppError('VALIDATION_INVALID_DATE', { userSafe: true });
  if (filters.from && filters.to && filters.from > filters.to)
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  for (const value of [
    filters.lot,
    filters.itemCode,
    filters.workflowState,
    filters.inspectionResult,
  ])
    if (value !== undefined && (!value.trim() || value.length > 100))
      throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  if (filters.releaseSystem !== undefined && typeof filters.releaseSystem !== 'boolean')
    throw new AppError('VALIDATION_INVALID_QUERY', { userSafe: true });
  return { ...filters };
}
function requirePermission(
  actor: ActorContext,
  permission: Parameters<typeof authorize>[0]['permission'],
  action: string,
): void {
  const result = authorize({
    actor,
    permission,
    action,
    entity: {
      type: 'REPORT',
      id: 'registry',
      state: 'ACTIVE',
      ownerId: actor.id,
      domain: 'REPORTING',
    },
    scope: { domain: 'REPORTING' },
    currentVersion: 1,
    expectedVersion: 1,
    businessCondition: true,
  });
  if (!result.allowed) throw new AppError(result.code ?? 'AUTHZ_DENIED');
}
export class RunReportUseCase {
  constructor(
    private readonly registry: ReportRegistry,
    private readonly query: ReportQuery,
  ) {}
  async execute(actor: ActorContext, code: string, filters: ReportFilters): Promise<ReportDataset> {
    const definition = this.registry.get(code);
    requirePermission(actor, definition.viewPermission, 'VIEW');
    requirePermission(actor, definition.runPermission, 'RUN');
    return this.query.run(definition, actor, validateFilters(filters));
  }
}
