import { describe, expect, it } from 'vitest';
import { authorizeProductionRecovery } from '../../../src/modules/backup-recovery/application/production-recovery-authorization.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const base = {
  reauthenticated: true,
  signatureEvidenceId: 'sig-1',
  artifactId: 'backup-1',
  artifactSha256: 'a'.repeat(64),
  releaseId: 'rel-1',
  gitSha: 'a'.repeat(40),
  buildId: 'build-1',
  migrationHead: '0019_backup_catalog_identity',
  expectedVersion: 1n,
  currentVersion: 1n,
  reason: 'approved recovery test',
  requestId: 'req-1',
};
const actor = (id: string, roles: string[]): ActorContext => ({ id, roles, accountState: 'ACTIVE', permissions: [] });

describe('production recovery authorization', () => {
  it('denies Admin, Supervisor, and Manager', () => {
    for (const role of ['Admin', 'Supervisor', 'Manager'])
      expect(() => authorizeProductionRecovery({ ...base, actor: actor(role.toLowerCase(), [role]) })).toThrow();
  });
  it('requires reauthentication and signature for the system owner', () => {
    const owner = actor('yazeed', ['SYSTEM_OWNER']);
    expect(() => authorizeProductionRecovery({ ...base, actor: owner, reauthenticated: false })).toThrow();
    expect(() => authorizeProductionRecovery({ ...base, actor: owner, signatureEvidenceId: '' })).toThrow();
    expect(() => authorizeProductionRecovery({ ...base, actor: owner })).not.toThrow();
  });
});
