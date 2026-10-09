import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { parsePageInput } from '../../../../shared/pagination/page.js';
import type { RcaRepository } from '../ports/repository.js';
export class ListRcaUseCase {
  constructor(private repo: RcaRepository) {}
  executePage(i: Omit<Parameters<NonNullable<RcaRepository['listPage']>>[0], 'page'> & { page?: import('../../../../shared/pagination/page.js').PageInput }) {
    if (!this.repo.listPage) throw new AppError('SYSTEM_DATABASE_UNAVAILABLE', { userSafe: true });
    return this.repo.listPage({ ...i, page: parsePageInput(i.page) });
  }
  execute(i: { actor: ActorContext; ncrId?: string }) {
    return this.repo.list(i);
  }
}
