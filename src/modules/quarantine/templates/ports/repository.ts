import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { TemplateVersion } from '../domain/template.js';
import type { TemplateVersionAction } from '../domain/template-state.js';

export interface TemplateRepository {
  create(input: {
    template: TemplateVersion;
    templateCode: string;
    actor: ActorContext;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion>;
  get(id: string, actor: ActorContext): Promise<TemplateVersion | undefined>;
  list(input: {
    actor: ActorContext;
    state?: TemplateVersion['state'];
  }): Promise<TemplateVersion[]>;
  /** Idempotency probe: a prior transition recorded under this request id. */
  findReplay(requestId: string, subjectId: string): Promise<TemplateVersion | undefined>;
  transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: TemplateVersionAction;
    reason?: string;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion>;
  createRevision(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    versionNo: string;
    name: string;
    description?: string | null;
    contentHash?: string | null;
    sourceDocument?: string | null;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion>;
}
