import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { isUuid, uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { validateAqlSampling, type AqlSampling } from '../domain/inspection-aql.js';
import type { InspectionRepository } from '../ports/repository.js';
import type { EquipmentContext } from './inspection-equipment.js';
import type { InspectionEquipmentRepository } from '../ports/inspection-equipment-repository.js';

/**
 * QC-DATA-002 §8/§9 — record the structured AQL / sampling block on the
 * report. Operator-supplied from the approved AQL source (never computed);
 * the approved reference is mandatory, and the record is audited. The block
 * may only change while the report is a DRAFT.
 */
export class RecordInspectionAqlUseCase {
  constructor(
    private readonly repo: InspectionRepository,
    private readonly equipmentRepo?: InspectionEquipmentRepository,
  ) {}

  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    aql: AqlSampling;
    requestId: string;
  }) {
    const x = await this.repo.get(i.id, i.actor);
    if (!x) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (x.state !== 'DRAFT')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-INSP-ENTER-RESULT',
        action: 'EDIT',
        entity: {
          type: 'INSPECTION_REPORT',
          id: x.id,
          state: x.state,
          authorId: x.authorId,
          executorId: x.authorId,
        },
        scope: { ownerId: x.authorId, assigneeId: x.assignedTo ?? x.authorId },
        currentVersion: x.version,
        expectedVersion: i.expectedVersion,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const validated = validateAqlSampling(i.aql);
    await this.repo.saveAql({
      id: i.id,
      expectedVersion: i.expectedVersion,
      actor: i.actor,
      aql: validated,
      requestId: i.requestId,
    });
    return validated;
  }
}

/**
 * QC-DATA-002 §10/§11 — link calibrated equipment to the inspection with the
 * exact calibration snapshot at usage time, and record server-verified
 * measurement rows (Standard Reading / Equipment Reading / Difference /
 * Tolerance / Result).
 *
 * Eligibility reuses the approved assets policy through the shared
 * EquipmentEligibility port: equipment must be ACTIVE with a CURRENT, not
 * overdue calibration. Nothing about eligibility is decided here.
 */
export class LinkInspectionEquipmentUseCase {
  constructor(
    private readonly repo: InspectionRepository,
    private readonly equipmentRepo: InspectionEquipmentRepository,
    private readonly eligibility: {
      verify(input: {
        actor: ActorContext;
        equipment: readonly EquipmentContext[];
        context: { templateVersionId: string };
      }): Promise<void>;
    },
  ) {}

  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    usage: EquipmentContext;
    requestId: string;
  }) {
    const x = await this.repo.get(i.id, i.actor);
    if (!x) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (x.state !== 'DRAFT')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    if (!isUuid(i.usage.equipmentId) || !isUuid(i.usage.calibrationRecordId))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    // Approved eligibility policy (assets domain): ACTIVE equipment + CURRENT
    // calibration + not overdue + snapshot coherence. Fail-closed.
    await this.eligibility.verify({
      actor: i.actor,
      equipment: [i.usage],
      context: { templateVersionId: x.template.templateVersionId },
    });
    await this.equipmentRepo.link({
      id: uuidv7(),
      inspectionReportId: x.id,
      usage: i.usage,
      actor: i.actor,
      requestId: i.requestId,
    });
    return i.usage;
  }
}
