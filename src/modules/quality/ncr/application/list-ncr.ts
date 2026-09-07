import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Ncr } from '../domain/ncr.js';
import type { NcrRepository } from '../ports/repository.js';
export class ListNcrUseCase {
  constructor(private repo: NcrRepository) {}
  execute(i: { actor: ActorContext; state?: Ncr['state'] }) {
    return this.repo.list(i);
  }
}
