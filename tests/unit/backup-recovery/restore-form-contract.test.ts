import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const restorePage = readFileSync('src/pages/system/backups/[backupId]/restore.astro', 'utf8');
const backupDetailPage = readFileSync('src/pages/system/backups/[backupId]/index.astro', 'utf8');
const systemAction = readFileSync('src/actions/system.ts', 'utf8');
const postgresRepository = readFileSync(
  'src/modules/backup-recovery/infrastructure/postgres-repository.ts',
  'utf8',
);

describe('restore-intent transport contract', () => {
  it('submits expected backup snapshot and one stable idempotency key in native and enhanced POST', () => {
    expect(restorePage).toContain('method="post"');
    expect(restorePage).toContain('name="expectedVersion"');
    expect(restorePage).toContain('name="idempotencyKey"');
    expect(restorePage).toContain("expectedVersion: field(formData, 'expectedVersion')");
    expect(restorePage).toContain('idempotencyKey: values.idempotencyKey');
    expect(restorePage).toContain("expectedVersion: String(data.get('expectedVersion') ?? '')");
    expect(restorePage).toContain("idempotencyKey: String(data.get('idempotencyKey') ?? '')");
  });

  it('keeps the action server-validated and requires both concurrency tokens', () => {
    expect(systemAction).toContain('expectedVersion: z.string().regex(/^[a-f0-9]{64}$/i)');
    expect(systemAction).toContain('idempotencyKey: z.string().uuid()');
    expect(systemAction).toContain('backupRestoreActionDependencies().requestRestore.execute');
  });

  it('rechecks eligibility under the backup lock and correlates audit to the planned intent', () => {
    expect(postgresRepository).toContain('.forUpdate()');
    expect(postgresRepository).toContain(
      'backupEligibilityVersion(currentBackup) !== input.expectedVersion',
    );
    expect(postgresRepository).toContain('restoreRunId: restore.id');
    expect(postgresRepository).toContain('expectedBackupVersion: input.expectedVersion');
    expect(postgresRepository).toContain('input.idempotencyKey');
  });

  it('reports intent-only semantics and does not expose production execution', () => {
    expect(restorePage).toContain('every recorded request stays planned');
    expect(restorePage).toContain('no recovery provider');
    expect(restorePage).toContain('Production restore remains DENIED');
  });

  it('reloads the planned intent in backup history rather than claiming restore completion', () => {
    expect(restorePage).toContain('Astro.redirect(`/system/backups/${backupId}`, 303)');
    expect(backupDetailPage).toContain('stateLabel(run.state)');
    expect(backupDetailPage).toContain('Restore operations recorded for this backup set');
    expect(backupDetailPage).toContain('A completed backup job is not restore evidence.');
  });
});
