import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { createNcr } from '../domain/ncr.js';
import { createNcrInput } from '../domain/create-input.js';
import type { NcrRepository } from '../ports/repository.js';
export { createNcrInput } from '../domain/create-input.js';

export class CreateNcrUseCase {
  constructor(
    private repo: NcrRepository,
    private now = () => new Date(),
  ) {}
  execute(i: {
    actor: ActorContext;
    ncrNo: string;
    title: string;
    description: string;
    findingId: string;
    affectedItemCode?: string;
    affectedLot?: string;
    ownerId?: string;
    requestId: string;
    intentId: string;
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-NCR-CREATE',
        action: 'CREATE',
        entity: { type: 'NCR', id: 'new', state: 'DRAFT', ownerId: i.actor.id },
        scope: { ownerId: i.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    const { actor, requestId, ...raw } = i;
    const parsed = createNcrInput.safeParse(raw);
    if (!parsed.success) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const c = parsed.data;
    return this.repo.create({
      ncr: createNcr({
        id: uuidv7(),
        createdBy: actor.id,
        now: this.now(),
        findingId: c.findingId,
        ncrNo: c.ncrNo,
        title: c.title,
        description: c.description,
        affectedItemCode: c.affectedItemCode,
        affectedLot: c.affectedLot,
      }),
      actor,
      requestId,
      intentId: c.intentId,
    });
  }
}
