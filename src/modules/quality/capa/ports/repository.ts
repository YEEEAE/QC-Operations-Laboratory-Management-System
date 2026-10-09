import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Capa, CapaActionType } from '../domain/capa.js';
import type { SignatureEvidence } from '../../../e-signatures/domain/signature-evidence.js';
export interface CapaRepository {
  listPage?(i: { actor: ActorContext; state?: Capa['state']; ncrId?: string; page: import('../../../../shared/pagination/page.js').Page }): Promise<import('../../../../shared/pagination/page.js').PageResult<Capa>>;
  create(i: { capa: Capa; actor: ActorContext; requestId: string }): Promise<Capa>;
  get(id: string, actor: ActorContext): Promise<Capa | undefined>;
  list(i: { actor: ActorContext; state?: Capa['state'] }): Promise<readonly Capa[]>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: CapaActionType;
    reason?: string;
    requestId: string;
  }): Promise<Capa>;
  close(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    reason: string;
    requestId: string;
    signature: SignatureEvidence;
  }): Promise<Capa>;
}
