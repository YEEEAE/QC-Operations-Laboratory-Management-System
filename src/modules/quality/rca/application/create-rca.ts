import { AppError } from '../../../../shared/errors/app-error.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { RcaRepository } from '../ports/repository.js';
export interface RcaNcrSource {
  get(input: {
    actor: ActorContext;
    id: string;
  }): Promise<
    { id: string; state: string; version: bigint; ownerId?: string; createdBy?: string } | undefined
  >;
}
export class CreateRcaUseCase {
  constructor(
    private repo: RcaRepository,
    private ncr: RcaNcrSource,
    private now = () => new Date(),
  ) {}
  async execute(i: {
    actor: ActorContext;
    ncrId: string;
    expectedNcrVersion: bigint;
    requestId: string;
  }) {
    const source = await this.ncr.get({ actor: i.actor, id: i.ncrId });
    if (!source) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-NCR-VIEW',
        action: 'VIEW',
        entity: { type: 'NCR', id: source.id, state: source.state },
        scope: { ownerId: source.ownerId === i.actor.id ? source.ownerId : source.createdBy },
          currentVersion: source.version,
          expectedVersion: source.version,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (source.version !== i.expectedNcrVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    if (['CLOSED', 'VOID'].includes(source.state))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const id = uuidv7();
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-RCA-CREATE',
        action: 'CREATE',
        entity: { type: 'RCA', id, state: 'DRAFT' },
        scope: { ownerId: i.actor.id },
          currentVersion: 1n,
          expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const now = this.now();
    return this.repo.create({
      rca: {
        id,
        ncrId: source.id,
        state: 'DRAFT',
        createdBy: i.actor.id,
        createdAt: now,
        updatedAt: now,
        version: 1n,
      },
      expectedNcrVersion: i.expectedNcrVersion,
      actor: i.actor,
      requestId: i.requestId,
    });
  }
}
