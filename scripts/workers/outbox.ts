import { getDatabase } from '../../src/shared/database/database';
import { PostgresOutboxRepository } from '../../src/shared/outbox/postgres-outbox-repository';
import { createQcOutboxHandler } from '../../src/shared/outbox/qc-event-handler';
import { processOutboxBatch } from '../../src/shared/outbox/worker';
const database = getDatabase();
const repository = new PostgresOutboxRepository(database);
await processOutboxBatch(repository, createQcOutboxHandler(database));
