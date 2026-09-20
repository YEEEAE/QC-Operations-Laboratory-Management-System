import { getDatabase } from '../../../shared/database/database.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

/**
 * Read-only journey linkage (QC-100-FINAL-024): resolves the source receiving
 * item recorded on a laboratory test (`lab_tests.source_receiving_item_id`,
 * FK to `qc.receiving_items`).
 *
 * The read follows the same two-step scope rule the laboratory register uses:
 * 1. the calling actor must be able to read the laboratory test itself, and
 * 2. the receiving row is returned only when it is actually referenced by that
 *    test — a bare receiving id never crosses this boundary.
 *
 * The returned shape is presentation-only provenance: it never carries the
 * receiving workflow's mutation authority, and the caller links to the
 * receiving workspace without being able to change receiving state here.
 */
export async function getSourceReceivingForLabTest(
  actor: ActorContext,
  labTestId: string,
): Promise<{ id: string; receivingNo: string } | undefined> {
  if (!/^[0-9a-f-]{36}$/i.test(labTestId)) return undefined;
  const db = getDatabase();
  // The lab test row itself is fetched with its author; the scope check reuses
  // the same permission grant (`PERM-LAB-VIEW` with GLOBAL/OWN scopes) the
  // register applies, so a scoped actor cannot pivot into receiving records
  // through a test they cannot read.
  const grant = actor.permissions.find((p: { code: string }) => p.code === 'PERM-LAB-VIEW');
  if (!grant || grant.active === false) return undefined;
  const scopes = grant.scopes;
  if (!scopes.includes('GLOBAL') && !scopes.includes('OWN')) return undefined;
  const testRow = await db
    .selectFrom('lab_tests')
    .select(['id', 'author_id', 'source_receiving_item_id'])
    .where('id', '=', labTestId)
    .executeTakeFirst();
  if (!testRow?.source_receiving_item_id) return undefined;
  if (!scopes.includes('GLOBAL') && testRow.author_id !== actor.id) return undefined;
  const receiving = await db
    .selectFrom('receiving_items')
    .select(['id', 'receiving_no'])
    .where('id', '=', testRow.source_receiving_item_id)
    .executeTakeFirst();
  return receiving ? { id: receiving.id, receivingNo: receiving.receiving_no } : undefined;
}
