import { AppError } from '../../../shared/errors/app-error.js';
import { isUuid, uuidv7 } from '../../../shared/id/uuid.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { EquipmentContext } from '../domain/lab-test.js';
import type { EquipmentUsageCapture } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';

/**
 * QC-DATA-003 — equipment evidence for one laboratory run.
 *
 * A run records which instrument and which calibration produced its readings.
 * The usage row keeps the equipment and calibration snapshots taken at usage
 * time, so the historical fact survives later calibration churn (DATA-MODEL §76/§77).
 *
 * Eligibility is decided by the Assets capability at the point of use and is
 * rechecked by `SubmitLabTestUseCase`. No eligibility rule is duplicated here.
 */
export class RecordRunEquipmentUseCase {
  constructor(
    private readonly repository: LabRepository,
    private readonly assets: EquipmentUsageCapture,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    batchId: string;
    usage: Pick<EquipmentContext, 'equipmentId' | 'calibrationRecordId' | 'usageRole'>;
    requestId: string;
  }): Promise<EquipmentContext> {
    const test = await this.repository.get(input.id, input.actor);
    if (!test) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (test.state !== 'DRAFT') throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    authorizeLab(input.actor, test, 'PERM-LAB-EDIT-DRAFT', 'SAVE', input.expectedVersion);
    if (!(test.batches ?? []).some((batch) => batch.id === input.batchId))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!isUuid(input.usage.equipmentId) || !isUuid(input.usage.calibrationRecordId))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const capturedUsage = await this.assets.capture({
      actor: input.actor,
      usage: input.usage,
      context: test.context,
    });
    await this.repository.linkRunEquipment({
      id: uuidv7(),
      labTestId: test.id,
      batchId: input.batchId,
      usage: capturedUsage,
      actor: input.actor,
      requestId: input.requestId,
      recordedAt: this.now(),
    });
    return capturedUsage;
  }
}
