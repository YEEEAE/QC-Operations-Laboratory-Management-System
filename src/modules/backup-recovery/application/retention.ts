import type { BackupArtifactStore } from '../ports/artifact-store.js';

export interface ApprovedRetentionPolicy {
  readonly retentionMs: number;
  readonly approvalReference: string;
}

export async function expireBackupArtifacts(input: {
  store: BackupArtifactStore;
  now: Date;
  eligibleReferences: ReadonlySet<string>;
  policy?: ApprovedRetentionPolicy;
}): Promise<{ deleted: readonly string[]; protected: readonly string[] }> {
  const entries = await input.store.list();
  const eligible = entries.filter((entry) => input.eligibleReferences.has(entry.reference));
  const protectedReferences: string[] = [];
  if (
    !input.policy ||
    !input.policy.approvalReference.trim() ||
    !Number.isFinite(input.policy.retentionMs) ||
    input.policy.retentionMs <= 0
  )
    return { deleted: [], protected: eligible.map((entry) => entry.reference) };
  const oldestEligible = eligible.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
    ?.reference;
  const deleted: string[] = [];
  for (const entry of entries) {
    if (!input.eligibleReferences.has(entry.reference)) continue;
    if (input.now.getTime() - entry.createdAt.getTime() <= input.policy.retentionMs) continue;
    if (entry.reference === oldestEligible) {
      protectedReferences.push(entry.reference);
      continue;
    }
    await input.store.delete(entry.reference);
    deleted.push(entry.reference);
  }
  return { deleted, protected: protectedReferences };
}
