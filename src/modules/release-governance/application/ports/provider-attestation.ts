import type {
  ReleaseCandidateIdentity,
  ReleaseGateKey,
  GateStatus,
} from '../../domain/release-approval.js';

export type ProviderGateKey = Extract<ReleaseGateKey, 'ci' | 'security' | 'database' | 'e2e'>;

export interface ProviderSignerPolicy {
  signerId: string;
  keyId: string;
  secret: string;
  provider: string;
  approvalReference: string;
  gates: ProviderGateKey[];
  environments: string[];
  maxEvidenceAgeSeconds: number;
}

/** Untrusted JSON boundary shape after structural validation. */
export interface ProviderGateAttestation {
  signerId: string;
  keyId: string;
  nonce: string;
  environment: string;
  identity: ReleaseCandidateIdentity & { releaseVersion: bigint };
  evidenceType: ProviderGateKey;
  status: GateStatus;
  immutableReference: string;
  observedAt: Date;
  evidenceDigest: string;
}

/** Attestation with signer, scope, age, and candidate identity verified. */
export interface VerifiedProviderAttestation extends ProviderGateAttestation {
  source: 'SIGNED_PROVIDER_ATTESTATION';
  provider: string;
  signerScope: ProviderGateKey[];
  approvalReference: string;
  signatureDigest: string;
}

export class ProviderAttestationError extends Error {
  constructor(
    readonly reason:
      | 'CONFIGURATION'
      | 'POLICY_NOT_CONFIGURED'
      | 'REGISTRY_NOT_APPROVED'
      | 'SIGNATURE'
      | 'SCOPE'
      | 'IDENTITY'
      | 'STALE'
      | 'PAYLOAD',
  ) {
    super(`Provider evidence rejected: ${reason.toLowerCase()}.`);
    this.name = 'ProviderAttestationError';
  }
}
