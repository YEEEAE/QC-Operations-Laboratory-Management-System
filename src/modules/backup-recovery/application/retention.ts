import type { BackupArtifactStore } from '../ports/artifact-store.js';

export const BACKUP_RETENTION_DAYS = 30;
const retentionMs = BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export async function expireBackupArtifacts(input: {
  store: BackupArtifactStore;
  now: Date;
  eligibleReferences: ReadonlySet<string>;
}): Promise<{ deleted: readonly string[]; protected: readonly string[] }> {
  const entries = await input.store.list();
  const eligible = entries.filter((entry) => input.eligibleReferences.has(entry.reference));
  const oldestEligible = eligible.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.reference;
  const deleted: string[] = [];
  const protectedReferences: string[] = [];
  for (const entry of entries) {
    if (input.now.getTime() - entry.createdAt.getTime() <= retentionMs) continue;
    if (entry.reference === oldestEligible) {
      protectedReferences.push(entry.reference);
      continue;
    }
    await input.store.delete(entry.reference);
    deleted.push(entry.reference);
  }
  return { deleted, protected: protectedReferences };
}
