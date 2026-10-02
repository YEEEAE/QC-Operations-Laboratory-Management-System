import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresReleaseGovernanceRepository } from '../../../src/modules/release-governance/infrastructure/postgres-repository.js';
import { recordProviderGateEvidence } from '../../../src/modules/release-governance/infrastructure/provider-evidence-writer.js';
import type { VerifiedProviderAttestation } from '../../../src/modules/release-governance/application/ports/provider-attestation.js';
import { deriveReleaseEvidence } from '../../../src/modules/release-governance/domain/release-approval.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const gitSha = 'a'.repeat(40);
let pool: ReturnType<typeof createPool> | undefined;
let db: Kysely<DatabaseSchema>;
let releaseId: string;

beforeAll(async () => {
  const databaseUrl = getTestDatabaseUrl(await startPostgresContainer());
  pool = createPool({ connectionString: databaseUrl, max: 10 });
  await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
  await pool
    .query(
      'CREATE SCHEMA IF NOT EXISTS qc; CREATE OR REPLACE FUNCTION qc.uuidv7() RETURNS uuid AS $f$ BEGIN RETURN gen_random_uuid(); END $f$ LANGUAGE plpgsql',
    )
    .catch(() => undefined);
  await migrate({ pool });
  db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
  const row = await db
    .insertInto('release_candidates')
    .values({
      git_sha: gitSha,
      build_id: 'provider-ingestion-build',
      application_version: '1.0.0',
      migration_head: '0040_signed_release_gate_evidence',
      uat_cycle_id: 'UAT-provider-ingestion',
      uat_status: 'UNKNOWN',
      residual_risk_status: 'UNKNOWN',
      state: 'PENDING',
      version: 1n,
    })
    .returning('id')
    .executeTakeFirstOrThrow();
  releaseId = row.id;
}, 180000);

afterAll(async () => {
  await db?.destroy();
  await pool?.end().catch(() => undefined);
  await stopPostgresContainer();
});

function attestation(
  patch: Partial<VerifiedProviderAttestation> = {},
): VerifiedProviderAttestation {
  return {
    source: 'SIGNED_PROVIDER_ATTESTATION',
    provider: 'github-actions',
    signerId: 'ci-release-bot',
    keyId: 'ci-key',
    nonce: 'provider-nonce-000001',
    environment: 'production',
    identity: {
      releaseId,
      gitSha,
      buildId: 'provider-ingestion-build',
      applicationVersion: '1.0.0',
      migrationHead: '0040_signed_release_gate_evidence',
      uatCycleId: 'UAT-provider-ingestion',
      releaseVersion: 1n,
    },
    evidenceType: 'ci',
    status: 'PASS',
    immutableReference: 'https://github.com/example/repo/actions/runs/12345',
    observedAt: new Date(),
    evidenceDigest: 'b'.repeat(64),
    signerScope: ['ci'],
    approvalReference: 'OD-RELEASE-INGESTION-01',
    signatureDigest: 'c'.repeat(64),
    ...patch,
  };
}

describe('release provider evidence persistence and reconciliation', () => {
  it('rejects a replayed provider nonce and audits the first append atomically', async () => {
    const proof = attestation({ nonce: 'provider-nonce-single-0001' });
    const first = await recordProviderGateEvidence(db, proof);
    expect(first.replayed).toBe(false);
    await expect(recordProviderGateEvidence(db, proof)).rejects.toMatchObject({
      code: 'CONFLICT_DUPLICATE_COMMAND',
    });
    await expect(
      recordProviderGateEvidence(
        db,
        attestation({ evidenceDigest: 'd'.repeat(64), signatureDigest: 'e'.repeat(64) }),
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT_DUPLICATE_COMMAND' });

    const repository = new PostgresReleaseGovernanceRepository(db);
    const candidate = await repository.getCandidate(releaseId);
    const evidence = await repository.getEvidence(releaseId);
    expect(candidate).toBeDefined();
    expect(evidence.gateRecords).toHaveLength(1);
    const audit = await db
      .selectFrom('audit_events')
      .select(['action', 'subject_id', 'new_state'])
      .where('subject_id', '=', first.evidenceId)
      .execute();
    expect(audit).toEqual([
      expect.objectContaining({
        action: 'RELEASE_GATE_EVIDENCE_RECORDED',
        subject_id: first.evidenceId,
        new_state: 'PASS',
      }),
    ]);
    expect(evidence.gateRecords[0]).toMatchObject({
      source: 'SIGNED_PROVIDER_ATTESTATION',
      evidenceDigest: 'b'.repeat(64),
      signerId: 'ci-release-bot',
      signerKeyId: 'ci-key',
      signerScope: ['ci'],
    });
    const snapshot = deriveReleaseEvidence(candidate!, evidence.gateRecords, [], new Date());
    expect(snapshot.gates.ci).toBe('PASS');
    expect(snapshot.gates.security).toBe('UNVERIFIED');
    expect(await repository.hasReconciledProductionGateDecision(releaseId)).toBe(false);
  });

  it('allows only one concurrent append for a signer nonce', async () => {
    const nonce = 'provider-nonce-race-000001';
    const attempts = await Promise.allSettled([
      recordProviderGateEvidence(
        db,
        attestation({
          evidenceType: 'security',
          nonce,
          evidenceDigest: 'f'.repeat(64),
          signatureDigest: '1'.repeat(64),
        }),
      ),
      recordProviderGateEvidence(
        db,
        attestation({
          evidenceType: 'security',
          nonce,
          evidenceDigest: '0'.repeat(64),
          signatureDigest: '2'.repeat(64),
        }),
      ),
    ]);
    expect(attempts.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const claims = await db
      .selectFrom('release_provider_nonce_claims')
      .select('release_gate_evidence_id')
      .where('nonce', '=', nonce)
      .execute();
    expect(claims).toHaveLength(1);
  });

  it('rejects a foreign SHA and blocks mutation of stored evidence', async () => {
    const before = await db
      .selectFrom('release_gate_evidence')
      .select(['id', 'evidence_digest', 'audit_info'])
      .where('release_id', '=', releaseId)
      .execute();
    expect(before).toHaveLength(1);
    await expect(
      recordProviderGateEvidence(
        db,
        attestation({ identity: { ...attestation().identity, gitSha: 'd'.repeat(40) } }),
      ),
    ).rejects.toThrow();
    const after = await db
      .selectFrom('release_gate_evidence')
      .select(['id', 'evidence_digest', 'audit_info'])
      .where('release_id', '=', releaseId)
      .execute();
    expect(after).toEqual(before);
    const result = before[0];
    await expect(
      db
        .updateTable('release_gate_evidence')
        .set({ status: 'FAIL' })
        .where('id', '=', result.id)
        .execute(),
    ).rejects.toThrow();
    await expect(
      db.deleteFrom('release_gate_evidence').where('id', '=', result.id).execute(),
    ).rejects.toThrow();
    await expect(pool!.query('TRUNCATE qc.release_gate_evidence')).rejects.toThrow();
  });
});
