import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { parsePageInput } from '../../../../shared/pagination/page.js';
import type { Ncr } from '../domain/ncr.js';
import type { NcrRepository } from '../ports/repository.js';
export class ListNcrUseCase {
  constructor(private repo: NcrRepository) {}
  executePage(i: Omit<Parameters<NonNullable<NcrRepository['listPage']>>[0], 'page'> & { page?: import('../../../../shared/pagination/page.js').PageInput }) {
    if (!this.repo.listPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repo.listPage({ ...i, page: parsePageInput(i.page) });
  }
  execute(i: { actor: ActorContext; state?: Ncr['state'] }) {
    return this.repo.list(i);
  }
}
