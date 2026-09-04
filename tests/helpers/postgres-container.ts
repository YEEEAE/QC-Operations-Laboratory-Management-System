import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { assertTestEnvironment } from './test-env.js';

const POSTGRES_18_IMAGE = 'postgres:18-alpine';

let postgresContainer: StartedPostgreSqlContainer | undefined;

export async function startPostgresContainer(): Promise<StartedPostgreSqlContainer> {
  assertTestEnvironment();

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
