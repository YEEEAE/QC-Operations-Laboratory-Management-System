import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { createCapa, type CapaAction } from '../domain/capa.js';
import type { CapaRepository } from '../ports/repository.js';
export class CreateCapaUseCase {
  constructor(
    private repo: CapaRepository,
    private now = () => new Date(),
  ) {}
  execute(i: {
    actor: ActorContext;
    capaNo: string;
    ncrId: string;
    title: string;
    description: string;
    ownerId?: string;
    targetDate?: string;
    verificationRequired: boolean;
    effectivenessRequired: boolean;
    actions: readonly CapaAction[];
    requestId: string;
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-CAPA-CREATE',
        action: 'CREATE',
        entity: { type: 'CAPA', id: 'new', state: 'DRAFT', ownerId: i.ownerId ?? i.actor.id },
        scope: { ownerId: i.ownerId ?? i.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: Boolean(i.ncrId),
      },
      { throwOnDeny: true },
    );
    // CA-F-00: client booleans and an NCR ID do not decide PD-18 or prove
    // an eligible NCR/RCA, assignability or controlled numbering.
    this.assertCreationSource();
    return this.repo.create({
      capa: createCapa({ id: uuidv7(), createdBy: i.actor.id, now: this.now(), ...i }),
      actor: i.actor,
      requestId: i.requestId,
    });
  }
  private assertCreationSource(): void {
    throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
  }
}
