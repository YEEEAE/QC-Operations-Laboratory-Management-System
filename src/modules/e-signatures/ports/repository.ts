import type { SignatureEvidence } from '../domain/signature-evidence.js';

export interface SignatureEvidenceRepository {
  create(input: SignatureEvidence): Promise<SignatureEvidence>;
  get(id: string): Promise<SignatureEvidence | undefined>;
}

export interface ReauthenticationVerifier {
  verify(input: { actorId: string; secret: string; requestId: string }): Promise<boolean>;
}
