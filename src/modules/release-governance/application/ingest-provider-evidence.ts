import { AppError } from '../../../shared/errors/app-error.js';
import {
  ProviderAttestationError,
  type VerifiedProviderAttestation,
} from './ports/provider-attestation.js';
import type { ReleaseCandidateRecord } from '../ports/repository.js';
import {
  parseProviderSignerPolicies,
  verifyProviderAttestation,
} from './verify-provider-attestation.js';

export interface ProviderEvidenceIntakeRepository {
  getCandidate(releaseId: string): Promise<ReleaseCandidateRecord | undefined>;
  hasReconciledProductionGateDecision(releaseId: string): Promise<boolean>;
  record(
    attestation: VerifiedProviderAttestation,
  ): Promise<{ evidenceId: string; replayed: boolean }>;
}

export class IngestProviderEvidenceUseCase {
  constructor(
    private readonly repository: ProviderEvidenceIntakeRepository,
    private readonly signerPolicy: string | undefined,
  ) {}

  async execute(input: {
    rawBody: string;
    keyId: string | null;
    timestamp: string | null;
    signature: string | null;
  }) {
    if (Buffer.byteLength(input.rawBody, 'utf8') > 32_768)
      throw new ProviderAttestationError('PAYLOAD');
    if (!this.signerPolicy?.trim()) throw new ProviderAttestationError('POLICY_NOT_CONFIGURED');
    const policies = parseProviderSignerPolicies(this.signerPolicy);
    if (policies.length === 0) throw new ProviderAttestationError('POLICY_NOT_CONFIGURED');
    const attestation = verifyProviderAttestation({ ...input, policies });
    const candidate = await this.repository.getCandidate(attestation.identity.releaseId);
    if (!candidate) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    verifyProviderAttestation({
      ...input,
      policies,
      expectedIdentity: { ...candidate, releaseVersion: candidate.version },
    });
    if (candidate.state !== 'PENDING')
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    // Signer authentication does not approve the canonical gate requirements
    // or prove the referenced artifact. Intake must not mint evidence before
    // the authority-owned registry and its acceptance rules are reconciled.
    if (!(await this.repository.hasReconciledProductionGateDecision(candidate.releaseId)))
      throw new ProviderAttestationError('REGISTRY_NOT_APPROVED');
    return {
      attestation,
      result: await this.repository.record(attestation),
    };
  }
}
