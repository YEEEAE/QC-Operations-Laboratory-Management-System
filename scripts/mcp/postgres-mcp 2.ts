import { spawn } from 'node:child_process';

import { loadLocalEnv } from '../db/load-local-env.ts';

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  process.stderr.write(
    'Postgres MCP is not configured: set DATABASE_URL in the environment or the ignored .env file.\n',
  );
  process.exit(78);
}

const {
  DATABASE_URL: _databaseUrl,
  ...inheritedEnvironment
} = process.env;

const server = spawn(
  'npx',
  ['--yes', '@microsoft/postgres-mcp', 'run', '--no-telemetry'],
  {
    env: {
      ...inheritedEnvironment,
      POSTGRES_MCP_CONNECTION_STRING: databaseUrl,
      POSTGRES_MCP_PROFILE_NAME: 'qc-project',
      POSTGRES_MCP_DISABLE_CWD_ACCESS: '1',
    },
    stdio: 'inherit',
  },
);

server.on('error', (error) => {
  process.stderr.write(`Postgres MCP failed to start: ${error.message}\n`);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
