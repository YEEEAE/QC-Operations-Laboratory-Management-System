import { getDatabase } from '../../../../shared/database/database.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { PostgresNcrRepository } from '../../ncr/infrastructure/postgres-repository.js';
import type { Ncr } from '../../ncr/domain/ncr.js';

/**
 * Read-only linkage helper (QC-100-FINAL-024): resolves the NCRs linked to a
 * finding through the NCR domain's own repository, which applies the same
 * owner/creator scope predicate as every other NCR read. The finding surface
 * therefore cannot disclose an NCR the account may not open, and it holds no
 * mutation authority over NCR state — the linkage is presentation only.
 */
export async function listRelatedNcrsForFinding(
  actor: ActorContext,
  findingId: string,
): Promise<readonly Ncr[]> {
  const repository = new PostgresNcrRepository(getDatabase());
  const all = await repository.list({ actor });
  return all.filter((ncr) => ncr.findingId === findingId);
}
