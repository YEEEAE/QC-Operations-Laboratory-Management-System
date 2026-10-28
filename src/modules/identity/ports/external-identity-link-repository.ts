import type {
  ExternalIdentityDeactivationReason,
  ExternalIdentityLink,
} from '../domain/external-identity-link.js';

export interface ExternalIdentityLinkRepository {
  findById(id: string): Promise<ExternalIdentityLink | undefined>;
  findForUser(userId: string, issuer: string): Promise<ExternalIdentityLink | undefined>;
  createApproved(input: {
    userId: string;
    issuer: string;
    subject: string;
    actorId: string;
    requestId: string;
    note: string;
  }): Promise<ExternalIdentityLink>;
  deactivate(input: {
    id: string;
    actorId: string;
    requestId: string;
    reason: ExternalIdentityDeactivationReason;
    note: string;
  }): Promise<void>;
}
