import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { isUuid } from '../../../../shared/id/uuid.js';
import {
  evaluateEnumAcceptance,
  evaluateNumericAcceptance,
} from '../domain/acceptance-evaluation.js';
import { isClientAllowedPointResult } from '../domain/inspection-result.js';
import type { InspectionRepository } from '../ports/repository.js';
import type { InspectionResultEntry } from '../domain/inspection-result.js';

/**
 * Server-side criteria for template points, read from the approved template
 * version the report is bound to. Never trusts a client-declared PASS/FAIL.
 */
export interface PointCriteria {
  pointId: string;
  dataType: string;
  acceptanceRuleType: string | null;
  acceptanceRulePayload: unknown;
}

export interface PointCriteriaReader {
  listPointCriteria(templateVersionId: string): Promise<PointCriteria[]>;
}

/**
 * QC-DATA-002 / BR-INSP-006 — evaluate observed values against approved
 * machine-readable rules and persist the official `result`.
 *
 * Rules:
 *  - a client-supplied `result` is only ever `REMARK` or `NA`; any PASS/FAIL
 *    claim from the browser is rejected, not silently trusted;
 *  - a point with a formal rule gets its result computed here from the exact
 *    captured value;
 *  - a point without a formal rule stores no automated result: the human
 *    reviewer owns the outcome, per the SOURCE-DEPENDENT policy.
 */
export class RecordInspectionResultsUseCase {
  constructor(
    private readonly repo: InspectionRepository,
    private readonly criteriaReader: PointCriteriaReader,
  ) {}

  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    results: readonly InspectionResultEntry[];
    requestId: string;
  }) {
    const x = await this.repo.get(i.id, i.actor);
    if (!x) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (x.state !== 'DRAFT') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });

    // Client result claims: only REMARK / NA may come from the browser.
    if (i.results.some((r) => r.result !== undefined && !isClientAllowedPointResult(r.result)))
      throw new AppError('AUTHZ_DENIED', {
        userSafe: true,
        messageKey: 'errors.official_result_must_come_from_approved_source',
      });

    const criteria = new Map(
      (await this.criteriaReader.listPointCriteria(x.template.templateVersionId)).map((c) => [
        c.pointId,
        c,
      ]),
    );

    const evaluated: InspectionResultEntry[] = i.results.map((entry) => {
      if (!isUuid(entry.pointId) || !criteria.has(entry.pointId))
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      const point = criteria.get(entry.pointId)!;
      if (point.dataType === 'NOT_APPLICABLE') return { ...entry, result: 'NA' };

      // Enum / boolean acceptability: evaluate from the approved allowed list
      // when one exists; otherwise no automated result.
      if (typeof entry.value === 'string' && entry.value.trim()) {
        const enumEval = evaluateEnumAcceptance(
          entry.value,
          point.acceptanceRuleType ?? '',
          point.acceptanceRulePayload,
        );
        if (enumEval) return { ...entry, result: enumEval.result };
      }
      // Numeric measurement: exact-decimal evaluation against bounds.
      if (point.dataType === 'NUMERIC_MEASUREMENT' || point.dataType === 'MULTI_MEASUREMENT') {
        if (typeof entry.value === 'number') {
          const evaluation = evaluateNumericAcceptance({
            numericValue: String(entry.value),
            ruleType: point.acceptanceRuleType ?? '',
            rulePayload: point.acceptanceRulePayload,
          });
          if (evaluation) return { ...entry, result: evaluation.result };
        }
      }
      // No formal rule applies: result stays with the human reviewer.
      return { ...entry, result: entry.result };
    });

    return this.repo.saveDraft({
      id: i.id,
      expectedVersion: i.expectedVersion,
      actor: i.actor,
      results: evaluated,
      requestId: i.requestId,
    });
  }
}
