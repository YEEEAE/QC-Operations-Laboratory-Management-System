import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingRepository } from '../ports/repository.js';
import { TransitionReceivingUseCase } from './transition-receiving.js';

export class HoldReceivingUseCase {
  constructor(private readonly repository: ReceivingRepository) {}
  execute(input: { actor: ActorContext; id: string; expectedVersion: bigint; reason: string; requestId: string }) {
    return new TransitionReceivingUseCase(this.repository).execute({ ...input, action: 'HOLD' });
  }
}
