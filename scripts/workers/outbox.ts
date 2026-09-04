import { getDatabase } from '../../src/shared/database/database';
import { PostgresOutboxRepository } from '../../src/shared/outbox/postgres-outbox-repository';
import { processOutboxBatch } from '../../src/shared/outbox/worker';
const repository = new PostgresOutboxRepository(getDatabase());
await processOutboxBatch(repository, async () => {
  /* Provider delivery is configured by the owning application use case. */
});
