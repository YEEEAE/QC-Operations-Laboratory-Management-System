import { getDatabase } from '../../../../shared/database/database.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { PostgresFindingRepository } from '../infrastructure/postgres-repository.js';
import type { Finding } from '../domain/finding.js';

/**
 * Read-only linkage helper (QC-100-FINAL-024): lists findings through the
 * finding domain's own repository, which applies the same owner/creator scope
 * predicate as every other finding read. Used by the NCR detail page to resolve
 * its source finding without querying the findings table directly.
 */
export async function listFindingsForActor(actor: ActorContext): Promise<readonly Finding[]> {
  const repository = new PostgresFindingRepository(getDatabase());
  return repository.list({ actor });
}
