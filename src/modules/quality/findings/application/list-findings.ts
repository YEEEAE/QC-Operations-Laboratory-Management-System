import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Finding } from '../domain/finding.js';
import type { FindingRepository } from '../ports/repository.js';
import type { PageInput } from '../../../../shared/pagination/page.js';
import { parsePageInput } from '../../../../shared/pagination/page.js';
export class ListFindingsUseCase {
  constructor(private repo: FindingRepository) {}
  execute(i: { actor: ActorContext; state?: Finding['state'] }) {
    return this.repo.list(i);
  }

  executePage(i: { actor: ActorContext; state?: Finding['state']; page?: PageInput }) {
    return this.repo.listPage({ ...i, page: parsePageInput(i.page) });
  }
}
