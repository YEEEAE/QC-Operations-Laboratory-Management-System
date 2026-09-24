import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { migrate } from '../../../scripts/db/migrate.js';
import { PostgresDocumentReviewQueueQuery } from '../../../src/modules/documents/infrastructure/postgres-review-queue.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const reviewerId = '01900000-0000-7000-8000-00000000e701';
const authorId = '01900000-0000-7000-8000-00000000e702';
const otherId = '01900000-0000-7000-8000-00000000e703';
const run = randomUUID().slice(0, 8);
const documentIds = [
  '01900000-0000-7000-8000-00000000e711',
  '01900000-0000-7000-8000-00000000e712',
  '01900000-0000-7000-8000-00000000e713',
];
const versionIds = [
  '01900000-0000-7000-8000-00000000e721',
  '01900000-0000-7000-8000-00000000e722',
  '01900000-0000-7000-8000-00000000e723',
];
let pool: Pool | undefined;
let db: Kysely<DatabaseSchema> | undefined;

describe('bounded document review queue parity', () => {
  beforeAll(async () => {
    const url = getTestDatabaseUrl(await startPostgresContainer({ tls: true }));
    pool = createPool({ connectionString: url, max: 4 });
    await migrate({ pool });
    db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    await pool.query(
      `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
       VALUES ($1, $2, 'Review owner', 'test-only-placeholder'),
              ($3, $4, 'Version author', 'test-only-placeholder'),
              ($5, $6, 'Other owner', 'test-only-placeholder')
       ON CONFLICT (id) DO NOTHING`,
      [reviewerId, `doc-reviewer-${run}`, authorId, `doc-author-${run}`, otherId, `doc-other-${run}`],
    );
    await pool.query(
      `INSERT INTO qc.document_identities (id, document_no, document_type, title, owner_id, active, created_by)
       VALUES ($1, $4, 'WI', 'Owned review document', $2, TRUE, $3),
              ($5, $6, 'WI', 'Other review document', $7, TRUE, $3),
              ($8, $9, 'WI', 'Self authored version', $7, TRUE, $2)`,
      [documentIds[0], reviewerId, authorId, `WI-RQ-${run}-1`, documentIds[1], `WI-RQ-${run}-2`, otherId, documentIds[2], `WI-RQ-${run}-3`],
    );
    await pool.query(
      `INSERT INTO qc.document_versions (id, document_id, revision, state, created_by)
       VALUES ($1, $2, '1', 'IN_REVIEW', $3),
              ($4, $5, '1', 'IN_REVIEW', $3),
              ($6, $7, '1', 'IN_REVIEW', $3)`,
      [versionIds[0], documentIds[0], authorId, versionIds[1], documentIds[1], versionIds[2], documentIds[2]],
    );
  });

  afterAll(async () => {
    await pool?.query('DELETE FROM qc.document_versions WHERE id = ANY($1::uuid[])', [versionIds]);
    await pool?.query('DELETE FROM qc.document_identities WHERE id = ANY($1::uuid[])', [documentIds]);
    await pool?.query('DELETE FROM qc.users WHERE id = ANY($1::uuid[])', [[reviewerId, authorId, otherId]]);
    await db?.destroy();
    await pool?.end();
    await stopPostgresContainer();
  });

  it('uses the exact total filter for its bounded page and excludes out-of-owner and self-authored rows', async () => {
    const query = new PostgresDocumentReviewQueueQuery(db!);
    const own = await query.listForReviewer({ actorId: reviewerId, global: false, own: true, limit: 1 });
    expect(own.total).toBe(1);
    expect(own.items).toHaveLength(1);
    expect(own.items[0]?.versionId).toBe(versionIds[0]);

    const global = await query.listForReviewer({ actorId: reviewerId, global: true, own: true, limit: 1 });
    expect(global.total).toBe(2);
    expect(global.items).toHaveLength(1);
    expect(global.items.every((item) => item.authorId !== reviewerId)).toBe(true);
  });
});
