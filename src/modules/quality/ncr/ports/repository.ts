import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Ncr, NcrAction } from '../domain/ncr.js';
export interface NcrRepository {
  listPage?(i: { actor: ActorContext; state?: Ncr['state']; page: import('../../../../shared/pagination/page.js').Page }): Promise<import('../../../../shared/pagination/page.js').PageResult<Ncr>>;
  create(i: { ncr: Ncr; actor: ActorContext; requestId: string }): Promise<Ncr>;
  get(id: string, actor: ActorContext): Promise<Ncr | undefined>;
  list(i: { actor: ActorContext; state?: Ncr['state'] }): Promise<readonly Ncr[]>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: NcrAction;
    reason?: string;
    requestId: string;
  }): Promise<Ncr>;
}
