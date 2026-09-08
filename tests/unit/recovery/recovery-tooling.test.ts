import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  parseRecoveryManifest,
  validateRecoveryManifest,
  type RecoveryManifest,
} from '../../../scripts/recovery/verify-recovery-manifest.js';
import { validateRestoredFiles } from '../../../scripts/recovery/validate-restored-files.js';
import { runRecoveryChecklist } from '../../../scripts/recovery/run-recovery-checklist.js';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const manifest = (overrides: Partial<RecoveryManifest> = {}): RecoveryManifest => ({
  manifestVersion: 1,
  backupSetId: 'backup-2026-09-08-001',
  environment: 'production',
  createdAt: '2026-09-08T08:00:00.000Z',
  backupJobResult: 'SUCCEEDED',
  restoreVerificationStatus: 'NOT_VERIFIED',
  database: {
    restoreReference: 'provider-neutral-restore-reference',
    postgresqlVersion: '18',
    migrationLedger: [{ version: '0001', name: '0001_core_schema', checksum: 'a'.repeat(64) }],
    coreRelations: ['qc.users', 'qc.audit_events'],
    historyRelations: ['qc.audit_events', 'qc.schema_migrations'],
  },
  fileObjects: [
    { storageKey: 'evidence/report.txt', sha256: hash('restored evidence'), sizeBytes: 17 },
  ],
  appContext: {
    gitCommitSha: 'a'.repeat(40),
    releaseId: 'release-2026-09-08-001',
    migrationHead: '0001',
  },
  knownGaps: [],
  ...overrides,
});

describe('recovery manifest verification', () => {
  it('rejects a manifest that turns backup creation into restore verification', () => {
    expect(() =>
      validateRecoveryManifest({ ...manifest(), restoreVerificationStatus: 'VERIFIED' }),
    ).toThrow(/evidence/i);
  });

  it('rejects provider PITR claims without an approved provider context', () => {
    expect(() =>
      validateRecoveryManifest({
        ...manifest(),
        database: { ...manifest().database, pitr: { provider: 'unknown', target: 'latest' } },
      }),
    ).toThrow(/provider/i);
  });

  it('parses JSON and requires core, history, file, and application context', () => {
    expect(parseRecoveryManifest(JSON.stringify(manifest())).backupSetId).toBe(
      'backup-2026-09-08-001',
    );
    expect(() => parseRecoveryManifest(JSON.stringify({ manifestVersion: 1 }))).toThrow(
      /database|file|application/i,
    );
  });
});

describe('restored file validation', () => {
  it('validates bytes and detects missing or mismatched objects without claiming database recovery', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qc-recovery-'));
    await mkdir(join(root, 'evidence'), { recursive: true });
    await writeFile(join(root, 'evidence/report.txt'), 'restored evidence');

    const result = await validateRestoredFiles(manifest(), root);
    expect(result.status).toBe('PASS');
    expect(result.checked).toBe(1);

    const mismatch = await validateRestoredFiles(
      { ...manifest(), fileObjects: [{ ...manifest().fileObjects[0], sha256: 'b'.repeat(64) }] },
      root,
    );
    expect(mismatch.status).toBe('FAIL');
    expect(mismatch.failures[0]).toMatch(/hash/i);
  });
});

describe('provider-aware recovery checklist', () => {
  it('keeps provider restore and manual application gates blocked without external evidence', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qc-recovery-checklist-'));
    const manifestPath = join(root, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest()));

    const result = await runRecoveryChecklist({ manifestPath });

    expect(result.overall).toBe('RESTORE_NOT_VERIFIED');
    expect(result.items.find((item) => item.id === 'manifest-schema')?.status).toBe('PASS');
    expect(result.items.find((item) => item.id === 'render-physical-restore')?.status).toBe(
      'BLOCKED',
    );
    expect(result.items.find((item) => item.id === 'restored-database')?.status).toBe('BLOCKED');
    expect(result.items.find((item) => item.id === 'authorization-enforcement')?.status).toBe(
      'BLOCKED',
    );
  });

  it('runs file validation when an isolated object root is supplied but still cannot claim restore proof', async () => {
    const root = await mkdtemp(join(tmpdir(), 'qc-recovery-checklist-files-'));
    await mkdir(join(root, 'evidence'), { recursive: true });
    await writeFile(join(root, 'evidence/report.txt'), 'restored evidence');
    const manifestPath = join(root, 'manifest.json');
    await writeFile(manifestPath, JSON.stringify(manifest()));

    const result = await runRecoveryChecklist({ manifestPath, objectRoot: root });

    expect(result.overall).toBe('RESTORE_NOT_VERIFIED');
    expect(result.items.find((item) => item.id === 'restored-file-objects')).toMatchObject({
      status: 'PASS',
    });
    expect(result.nextAction).toMatch(/Do not mark RESTORE VERIFIED/i);
  });
});
