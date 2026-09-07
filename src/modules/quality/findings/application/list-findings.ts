import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Finding } from '../domain/finding.js';
import type { FindingRepository } from '../ports/repository.js';
export class ListFindingsUseCase {
  constructor(private repo: FindingRepository) {}
  execute(i: { actor: ActorContext; state?: Finding['state'] }) {
    return this.repo.list(i);
  }
}
