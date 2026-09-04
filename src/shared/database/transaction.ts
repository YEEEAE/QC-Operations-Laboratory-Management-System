import type { Kysely, Transaction } from 'kysely';

import { translateDatabaseError } from './database.js';
import type { DatabaseSchema } from './db-types.js';

export type DatabaseTransaction = Transaction<DatabaseSchema>;

export async function inTransaction<T>(
  database: Kysely<DatabaseSchema>,
  work: (transaction: DatabaseTransaction) => Promise<T>,
): Promise<T> {
  try {
    return await database.transaction().execute(work);
  } catch (error) {
    throw translateDatabaseError(error);
  }
}
