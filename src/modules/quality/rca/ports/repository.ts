import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Rca, RcaAction } from '../domain/rca.js';
export interface RcaRepository {
  listPage?(i: { actor: ActorContext; ncrId?: string; state?: Rca['state']; page: import('../../../../shared/pagination/page.js').Page }): Promise<import('../../../../shared/pagination/page.js').PageResult<Rca>>;
  create(i: {
    rca: Rca;
    expectedNcrVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<Rca>;
  get(id: string, actor: ActorContext): Promise<Rca | undefined>;
  list(i: { actor: ActorContext; ncrId?: string }): Promise<readonly Rca[]>;
  update(i: {
    rca: Rca;
    expectedVersion: bigint;
    actor: ActorContext;
    requestId: string;
  }): Promise<Rca>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: RcaAction;
    reason?: string;
    requestId: string;
  }): Promise<Rca>;
}
