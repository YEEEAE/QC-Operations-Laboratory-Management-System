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

const server = spawn('uvx', ['postgres-mcp', '--access-mode=restricted'], {
  env: {
    ...process.env,
    DATABASE_URI: databaseUrl,
  },
  stdio: 'inherit',
});

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
