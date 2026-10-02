import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Finding, FindingAction } from '../domain/finding.js';
import type { Page } from '../../../../shared/pagination/page.js';
export interface FindingRepository {
  create(i: { finding: Finding; actor: ActorContext; requestId: string }): Promise<Finding>;
  get(id: string, actor: ActorContext): Promise<Finding | undefined>;
  list(i: { actor: ActorContext; state?: Finding['state'] }): Promise<readonly Finding[]>;
  listPage(i: {
    actor: ActorContext;
    state?: Finding['state'];
    page: Page;
  }): Promise<{ items: readonly Finding[]; total: number; page: number; pageSize: number }>;
  transition(i: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: FindingAction;
    reason?: string;
    requestId: string;
  }): Promise<Finding>;
}
