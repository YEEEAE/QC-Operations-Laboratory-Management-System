import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Capa } from '../domain/capa.js';
import type { CapaRepository } from '../ports/repository.js';
export class ListCapaUseCase {
  constructor(private repo: CapaRepository) {}
  execute(i: { actor: ActorContext; state?: Capa['state'] }) {
    return this.repo.list(i);
  }
}
