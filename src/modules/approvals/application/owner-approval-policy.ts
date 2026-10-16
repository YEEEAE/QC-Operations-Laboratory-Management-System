import type { ActorContext } from '../../../shared/authorization/types.js';
import {
  SYSTEM_OWNER_LOGIN_IDENTITY,
  isNamedSystemOwner,
} from '../../../shared/authorization/p05-authority.js';

/**
 * Owner-Controlled Internal Approval.
 *
 * The system owner (`yazeed`, role `SYSTEM_OWNER`) has directed that, for this
 * release, the internal governed approval pathway be completed by the owner's
 * direct, auditable decision. Electronic signatures, handwritten signatures and
 * mandatory internal multi-person approval chains are DEFERRED to a future
 * development phase.
 *
 * This module is the single place that declares:
 *   * which actor may use the owner pathway (canonical identity, never a string
 *     comparison of an id), and
 *   * the metadata stamped onto the durable owner decision.
 *
 * It does not relax scientific acceptance, safety, scope, version or
 * data-completeness controls: the owning domain transition and the assignment
 * authorization still run before any owner decision is recorded.
 *
 * Reversing the deferral (re-enabling signature ceremonies for the owner path)
 * is a single, deliberate change to the `active` flag below plus the signature
 * registry — it is never inferred from missing configuration.
 */

/** Exact authority that may record an owner internal approval. */
export const OWNER_INTERNAL_APPROVAL_AUTHORITY = 'SYSTEM_OWNER' as const;

export type OwnerDecisionType = 'OWNER_INTERNAL_APPROVAL' | 'STANDARD_WORKFLOW';

export type OwnerApprovalPath = 'OWNER_PATH' | 'STANDARD_PATH';

export interface OwnerApprovalDeferral {
  /** Owner decision identifier. */
  readonly decisionId: string;
  /** ISO date the owner decision was taken. */
  readonly decidedOn: string;
  /** Whether the deferral is currently in force. */
  readonly active: boolean;
  /** Capabilities explicitly deferred to a future phase. */
  readonly deferredCapabilities: readonly string[];
}

/**
 * The recorded owner decision. `active: true` is the current governance model;
 * flipping it to `false` must be accompanied by a new signature-policy decision
 * and matching tests, because owner decisions would then require a signature.
 */
export const OWNER_APPROVAL_DEFERRAL: OwnerApprovalDeferral = Object.freeze({
  decisionId: 'OWNER-DECISION-2026-10-16-OWNER-CONTROLLED-APPROVAL',
  decidedOn: '2026-10-16',
  active: true,
  deferredCapabilities: Object.freeze([
    'ELECTRONIC_SIGNATURE_CEREMONY',
    'HANDWRITTEN_SIGNATURE_CAPTURE',
    'MANDATORY_INTERNAL_MULTI_PERSON_APPROVAL',
  ]),
});

/**
 * Resolve the approval path for an actor. The owner pathway requires the
 * canonical named owner on an ACTIVE account; every other actor — including an
 * Admin or a SYSTEM_OWNER role on a different login — stays on the standard
 * pathway.
 */
export function ownerApprovalPathFor(actor: ActorContext): OwnerApprovalPath {
  if (!OWNER_APPROVAL_DEFERRAL.active) return 'STANDARD_PATH';
  return isNamedSystemOwner(actor) ? 'OWNER_PATH' : 'STANDARD_PATH';
}

export function isOwnerApprovalPath(actor: ActorContext): boolean {
  return ownerApprovalPathFor(actor) === 'OWNER_PATH';
}

export interface OwnerDecisionMetadata {
  decisionType: OwnerDecisionType;
  ownerAuthority?: string;
  ownerLoginIdentity?: string;
  /** TRUE only when the owner APPROVE was recorded with the ceremony deferred. */
  signatureDeferred: boolean;
}

/**
 * Metadata stamped onto the durable decision row. On the owner path this is the
 * exact, server-derived authority; on the standard path it records only that
 * the decision came from the ordinary workflow (never a fabricated authority).
 */
export function ownerDecisionMetadata(
  actor: ActorContext,
  decision: 'APPROVE' | 'REJECT' | 'RETURN',
): OwnerDecisionMetadata {
  if (!isOwnerApprovalPath(actor)) {
    return { decisionType: 'STANDARD_WORKFLOW', signatureDeferred: false };
  }
  return {
    decisionType: 'OWNER_INTERNAL_APPROVAL',
    ownerAuthority: OWNER_INTERNAL_APPROVAL_AUTHORITY,
    ownerLoginIdentity: SYSTEM_OWNER_LOGIN_IDENTITY,
    // A refusal is a workflow refusal, not a signed or signature-deferred approval.
    signatureDeferred: decision === 'APPROVE',
  };
}

/**
 * Audit-safe authorization context. Keys are deliberately neutral: the shared
 * audit guard rejects payload keys that look like credentials, so the context
 * never carries a field whose name resembles a secret.
 */
export function ownerAuthorizationContext(actor: ActorContext): Record<string, unknown> {
  return {
    authority: OWNER_INTERNAL_APPROVAL_AUTHORITY,
    accountState: actor.accountState,
    roles: [...actor.roles].sort(),
    decisionRef: OWNER_APPROVAL_DEFERRAL.decisionId,
    decisionDate: OWNER_APPROVAL_DEFERRAL.decidedOn,
  };
}
