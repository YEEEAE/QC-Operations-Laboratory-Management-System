import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../../src/pages/api/release-evidence.js';
import { IngestProviderEvidenceUseCase } from '../../../src/modules/release-governance/application/ingest-provider-evidence.js';
import { providerSignature } from '../../../src/modules/release-governance/application/verify-provider-attestation.js';
import { createSignatureEvidence } from '../../../src/modules/e-signatures/domain/signature-evidence.js';
import { migrate, loadMigrations } from '../../../scripts/db/migrate.js';
import { PostgresReleaseGovernanceRepository } from '../../../src/modules/release-governance/infrastructure/postgres-repository.js';
import { recordProviderGateEvidence } from '../../../src/modules/release-governance/infrastructure/provider-evidence-writer.js';
import type { VerifiedProviderAttestation } from '../../../src/modules/release-governance/application/ports/provider-attestation.js';
import { deriveReleaseEvidence } from '../../../src/modules/release-governance/domain/release-approval.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

let intake: IngestProviderEvidenceUseCase;
vi.mock(
  '../../../src/modules/release-governance/application/provider-evidence-intake-dependencies.js',
  () => ({ providerEvidenceIntakeDependencies: () => intake }),
);

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
}, 180000);

beforeEach(async () => {
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
});

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
        attestation({
          nonce: proof.nonce,
          evidenceDigest: 'd'.repeat(64),
          signatureDigest: 'e'.repeat(64),
        }),
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
    expect(attempts.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { code: 'CONFLICT_DUPLICATE_COMMAND' },
    });
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
    const first = await recordProviderGateEvidence(db, attestation());
    before.push(
      await db
        .selectFrom('release_gate_evidence')
        .select(['id', 'evidence_digest', 'audit_info'])
        .where('id', '=', first.evidenceId)
        .executeTakeFirstOrThrow(),
    );
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
  it('increments bigint evidence versions as 1, 2, 3 rather than concatenating driver strings', async () => {
    for (const n of [1, 2, 3]) {
      await recordProviderGateEvidence(
        db,
        attestation({
          nonce: `provider-version-nonce-${n}`,
          evidenceDigest: String(n).repeat(64),
          signatureDigest: String(n + 3).repeat(64),
        }),
      );
    }
    const rows = await db
      .selectFrom('release_gate_evidence')
      .select('evidence_version')
      .where('release_id', '=', releaseId)
      .orderBy('evidence_version')
      .execute();
    expect(rows.map((row) => BigInt(row.evidence_version))).toEqual([1n, 2n, 3n]);
  });

  it('rolls back evidence and nonce when the audit append fails', async () => {
    const nonce = 'provider-rollback-nonce-01';
    await pool!.query(
      `CREATE FUNCTION qc.test_provider_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN IF NEW.action = 'RELEASE_GATE_EVIDENCE_RECORDED' THEN RAISE EXCEPTION 'injected provider audit failure'; END IF; RETURN NEW; END $f$; CREATE TRIGGER test_provider_audit_failure BEFORE INSERT ON qc.audit_events FOR EACH ROW EXECUTE FUNCTION qc.test_provider_audit_failure();`,
    );
    try {
      await expect(recordProviderGateEvidence(db, attestation({ nonce }))).rejects.toThrow(
        /injected provider audit failure/,
      );
      expect(
        await db
          .selectFrom('release_gate_evidence')
          .select('id')
          .where('release_id', '=', releaseId)
          .execute(),
      ).toEqual([]);
      expect(
        await db
          .selectFrom('release_provider_nonce_claims')
          .select('nonce')
          .where('nonce', '=', nonce)
          .execute(),
      ).toEqual([]);
      expect(
        await db
          .selectFrom('audit_events')
          .select('id')
          .where('action', '=', 'RELEASE_GATE_EVIDENCE_RECORDED')
          .where('payload', '@>', { releaseId })
          .execute(),
      ).toEqual([]);
    } finally {
      await pool!.query(
        'DROP TRIGGER test_provider_audit_failure ON qc.audit_events; DROP FUNCTION qc.test_provider_audit_failure()',
      );
    }
    await expect(recordProviderGateEvidence(db, attestation({ nonce }))).resolves.toMatchObject({
      replayed: false,
    });
  });

  it('rechecks candidate state under lock and leaves evidence/nonce/audit unchanged on denial', async () => {
    await db
      .updateTable('release_candidates')
      .set({ state: 'RELEASE_APPROVED' })
      .where('id', '=', releaseId)
      .execute();
    await expect(
      recordProviderGateEvidence(db, attestation({ nonce: 'provider-state-denial-01' })),
    ).rejects.toMatchObject({ code: 'DOMAIN_INVALID_TRANSITION' });
    expect(
      await db
        .selectFrom('release_gate_evidence')
        .select('id')
        .where('release_id', '=', releaseId)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('release_provider_nonce_claims')
        .select('nonce')
        .where('nonce', '=', 'provider-state-denial-01')
        .execute(),
    ).toEqual([]);
  });
  it('verifies the PG18 source checksum ledger and zero orphan nonce claims', async () => {
    const version = (await pool!.query('SHOW server_version_num')).rows[0].server_version_num;
    expect(Math.floor(Number(version) / 10000)).toBe(18);
    const migrations = await loadMigrations();
    const ledger = await pool!.query(
      'SELECT version, name, checksum FROM qc.schema_migrations ORDER BY version',
    );
    expect(ledger.rows).toEqual(
      migrations.map(({ version, name, checksum }) => ({ version, name, checksum })),
    );
    const orphans = await pool!.query(
      'SELECT count(*)::int AS count FROM qc.release_provider_nonce_claims n LEFT JOIN qc.release_gate_evidence e ON e.id = n.release_gate_evidence_id AND e.signer_id = n.signer_id AND e.signer_key_id = n.signer_key_id WHERE e.id IS NULL',
    );
    expect(orphans.rows[0].count).toBe(0);
  });

  it('denies a signed PASS through the HTTP handler when the real registry is unapproved, with no writes', async () => {
    const repository = new PostgresReleaseGovernanceRepository(db);
    const secret = 'synthetic-only-provider-secret-for-local-tests';
    intake = new IngestProviderEvidenceUseCase(
      {
        getCandidate: (id) => repository.getCandidate(id),
        hasReconciledProductionGateDecision: (id) =>
          repository.hasReconciledProductionGateDecision(id),
        record: (proof) => recordProviderGateEvidence(db, proof),
      },
      JSON.stringify([
        {
          signerId: 'ci-release-bot',
          keyId: 'ci-key',
          secret,
          provider: 'github-actions',
          approvalReference: 'SYNTHETIC-TEST-NOT-OWNER-APPROVAL',
          gates: ['ci'],
          environments: ['production'],
          maxEvidenceAgeSeconds: 3600,
        },
      ]),
    );
    const proof = attestation({ nonce: 'provider-http-authority-denial-01' });
    const rawBody = JSON.stringify(proof, (_, v) => (typeof v === 'bigint' ? String(v) : v));
    const timestamp = new Date().toISOString();
    const request = new Request('http://localhost/api/release-evidence', {
      method: 'POST',
      headers: {
        'x-qc-key-id': 'ci-key',
        'x-qc-timestamp': timestamp,
        'x-qc-signature': providerSignature(secret, timestamp, rawBody),
      },
      body: rawBody,
    });
    const result = await POST({ request } as Parameters<typeof POST>[0]);
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ status: 503, code: 'BLOCKED_BY_AUTHORITY_SOURCE' });
    const unsigned = await POST({
      request: new Request('http://localhost/api/release-evidence', {
        method: 'POST',
        body: rawBody,
      }),
    } as Parameters<typeof POST>[0]);
    expect(unsigned.status).toBe(401);
    expect(await unsigned.json()).toEqual({ status: 401, code: 'EVIDENCE_SIGNATURE_REJECTED' });
    expect(
      await db
        .selectFrom('release_gate_evidence')
        .select('id')
        .where('release_id', '=', releaseId)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('release_provider_nonce_claims')
        .select('nonce')
        .where('nonce', '=', proof.nonce)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('audit_events')
        .select('id')
        .where('payload', '@>', { releaseId })
        .execute(),
    ).toEqual([]);
  });

  it('denies direct approval persistence without the canonical registry and rolls back the idempotency reservation', async () => {
    const repository = new PostgresReleaseGovernanceRepository(db);
    const candidate = (await repository.getCandidate(releaseId))!;
    const evidence = deriveReleaseEvidence(candidate, [], [], new Date());
    const requestId = 'registry-denial-direct-approval';
    const actor = {
      id: '01900000-0000-7000-8000-00000000e001',
      loginIdentity: 'yazeed',
      accountState: 'ACTIVE' as const,
      roles: ['SYSTEM_OWNER'],
      permissions: [{ code: 'PERM-APR-APPROVE' as const, scopes: ['GLOBAL' as const] }],
    };
    const signature = createSignatureEvidence({
      actorId: actor.id,
      subjectType: 'RELEASE_CANDIDATE',
      subjectId: releaseId,
      subjectVersion: 1n,
      action: 'RELEASE_APPROVE',
      meaning: 'Synthetic denial test only',
      signedAt: new Date(),
      snapshotHash: 'a'.repeat(64),
      reauthMethod: 'PASSWORD',
      requestId,
    });
    await expect(
      repository.approve({
        actor,
        candidate,
        expectedVersion: 1n,
        evidence,
        uatStatus: 'UNKNOWN',
        residualRiskStatus: 'UNKNOWN',
        gateSnapshot: evidence.gates,
        riskSnapshot: [],
        signature,
        requestId,
      }),
    ).rejects.toMatchObject({
      code: 'AUTHZ_DENIED',
      messageKey: 'release.productionGateRegisterNotReconciled',
    });
    expect((await repository.getCandidate(releaseId))?.state).toBe('PENDING');
    expect(
      await db
        .selectFrom('idempotency_records')
        .select('key')
        .where('key', '=', `RELEASE:APPROVE:${releaseId}:${requestId}`)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('release_approvals')
        .select('id')
        .where('release_id', '=', releaseId)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('electronic_signatures')
        .select('id')
        .where('request_id', '=', requestId)
        .execute(),
    ).toEqual([]);
    expect(
      await db
        .selectFrom('audit_events')
        .select('id')
        .where('request_id', '=', requestId)
        .execute(),
    ).toEqual([]);
  });
});
