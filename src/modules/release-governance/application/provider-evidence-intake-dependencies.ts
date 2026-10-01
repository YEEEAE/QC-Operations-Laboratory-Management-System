import { getServerEnv } from '../../../config/env.js';
import { getDatabase } from '../../../shared/database/database.js';
import { PostgresReleaseGovernanceRepository } from '../infrastructure/postgres-repository.js';
import { recordProviderGateEvidence } from '../infrastructure/provider-evidence-writer.js';
import { IngestProviderEvidenceUseCase } from './ingest-provider-evidence.js';
import type { VerifiedProviderAttestation } from './ports/provider-attestation.js';

export function providerEvidenceIntakeDependencies() {
  const signerPolicy = getServerEnv().RELEASE_EVIDENCE_SIGNERS_JSON;
  let database: ReturnType<typeof getDatabase> | undefined;
  let releaseRepository: PostgresReleaseGovernanceRepository | undefined;
  const ensureInfrastructure = () => {
    database ??= getDatabase();
    releaseRepository ??= new PostgresReleaseGovernanceRepository(database);
    return { database, releaseRepository };
  };
  return new IngestProviderEvidenceUseCase(
    {
      getCandidate: (releaseId) => ensureInfrastructure().releaseRepository.getCandidate(releaseId),
      record: (attestation: VerifiedProviderAttestation) => {
        const infrastructure = ensureInfrastructure();
        return recordProviderGateEvidence(infrastructure.database, attestation);
      },
    },
    signerPolicy,
  );
}
