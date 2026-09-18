import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { assertTestEnvironment, type TestDatabaseContainer } from './test-env.js';

const POSTGRES_18_IMAGE = 'postgres:18-alpine';

// Disposable externally-provisioned cluster (e.g. a local PG when no container runtime exists).
// Never point this at a shared or production database.
const externalDatabaseUrl = process.env.QC_TEST_DATABASE_URL;

export interface StartPostgresOptions {
  /**
   * Serve the disposable cluster over TLS and return a connection URI that
   * satisfies the canonical connection policy (an explicit, non-disabled
   * `sslmode`). Required by suites that pass the URI through
   * `getDatabaseConnectionConfig`, directly or via an operator script, because
   * `sslmode=disable` is rejected and a missing `sslmode` forces certificate
   * verification that a plain local cluster cannot satisfy.
   */
  tls?: boolean;
}

let startedContainer: StartedPostgreSqlContainer | undefined;
let startedUri: string | undefined;
let startedTls = false;
let sslDirectory: string | undefined;

function assertCanonicalExternalUrl(url: string): void {
  const mode = new URL(url).searchParams.get('sslmode')?.toLowerCase();
  if (!mode || mode === 'disable') {
    throw new Error(
      'QC_TEST_DATABASE_URL must declare a non-disabled sslmode to serve TLS-required suites. ' +
        'Point it at a disposable cluster that terminates TLS, or provide a container runtime.',
    );
  }
}

async function startTlsContainer(): Promise<string> {
  // Throwaway self-signed certificate for this test run only. The database is
  // created and removed inside the test process and never touches production.
  sslDirectory = mkdtempSync(join(tmpdir(), 'qc-test-pgssl-'));
  const keyPath = join(sslDirectory, 'server.key');
  const certPath = join(sslDirectory, 'server.crt');
  execFileSync('openssl', [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-days',
    '1',
    '-nodes',
    '-subj',
    '/CN=127.0.0.1',
    '-addext',
    'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ]);

  startedContainer = await new PostgreSqlContainer(POSTGRES_18_IMAGE)
    .withDatabase('qc_test')
    .withUsername('test')
    .withPassword('test')
    .withCopyFilesToContainer([
      { source: certPath, target: '/etc/pgssl/server.crt' },
      { source: keyPath, target: '/etc/pgssl/server.key' },
    ])
    .withEntrypoint([
      'sh',
      '-c',
      'chown postgres:postgres /etc/pgssl/server.key && chmod 600 /etc/pgssl/server.key && exec docker-entrypoint.sh "$@"',
      'sh',
    ])
    .withCommand([
      'postgres',
      '-c',
      'ssl=on',
      '-c',
      'ssl_cert_file=/etc/pgssl/server.crt',
      '-c',
      'ssl_key_file=/etc/pgssl/server.key',
    ])
    .start();

  const uri = startedContainer.getConnectionUri();
  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}sslmode=verify-full&sslrootcert=${certPath}`;
}

export async function startPostgresContainer(
  options: StartPostgresOptions = {},
): Promise<TestDatabaseContainer> {
  assertTestEnvironment();
  const tls = options.tls === true;

  if (externalDatabaseUrl) {
    if (tls) assertCanonicalExternalUrl(externalDatabaseUrl);
    return { getConnectionUri: () => externalDatabaseUrl };
  }

  if (startedUri) {
    if (startedTls !== tls) {
      throw new Error(
        'startPostgresContainer was called with conflicting TLS requirements in one test file.',
      );
    }
    const existing = startedUri;
    return { getConnectionUri: () => existing };
  }

  startedTls = tls;
  if (tls) {
    startedUri = await startTlsContainer();
  } else {
    startedContainer = await new PostgreSqlContainer(POSTGRES_18_IMAGE)
      .withDatabase('qc_test')
      .withUsername('test')
      .withPassword('test')
      .start();
    startedUri = startedContainer.getConnectionUri();
  }

  const uri = startedUri;
  return { getConnectionUri: () => uri };
}

export async function stopPostgresContainer(): Promise<void> {
  if (startedContainer) {
    await startedContainer.stop();
    startedContainer = undefined;
  }
  if (sslDirectory) {
    rmSync(sslDirectory, { recursive: true, force: true });
    sslDirectory = undefined;
  }
  startedUri = undefined;
}
