import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { assertTestEnvironment } from './test-env.js';

const POSTGRES_18_IMAGE = 'postgres:18-alpine';

// Disposable externally-provisioned cluster (e.g. a local PG when no container runtime exists).
// Never point this at a shared or production database.
const externalDatabaseUrl = process.env.QC_TEST_DATABASE_URL;

let postgresContainer: StartedPostgreSqlContainer | undefined;

export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  assertTestEnvironment();

  if (externalDatabaseUrl) {
    return { getConnectionUri: () => externalDatabaseUrl } as StartedPostgreSqlContainer;
  }


  postgresContainer ??= await new PostgreSqlContainer(POSTGRES_18_IMAGE)
    .withDatabase('qc_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  return postgresContainer;
}

export async function stopPostgresContainer(): Promise<void> {
  if (!postgresContainer) return;

  await postgresContainer.stop();
  postgresContainer = undefined;
}
