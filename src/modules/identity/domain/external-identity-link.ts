export type ExternalIdentityLinkState = 'ACTIVE' | 'DEACTIVATED';
export type ExternalIdentityDeactivationReason =
  | 'REVOKED'
  | 'MERGED'
  | 'DUPLICATE_IDENTITY'
  | 'OPERATOR_REMOVAL';

export interface ExternalIdentityLink {
  readonly id: string;
  readonly userId: string;
  readonly issuer: string;
  readonly subject: string;
  readonly state: ExternalIdentityLinkState;
  readonly source: 'OPERATOR_VERIFIED';
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly approvedBy: string;
  readonly approvedAt: Date;
  readonly deactivatedBy?: string;
  readonly deactivatedAt?: Date;
  readonly deactivationReason?: ExternalIdentityDeactivationReason;
  readonly deactivationNote?: string;
}
