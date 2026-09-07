import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LOCAL_ENV_KEYS = new Set([
  'NODE_ENV',
  'DATABASE_URL',
  'SESSION_SECRET',
  'SERVICE_VERSION',
  'RATE_LIMIT_LOGIN_MAX',
  'RATE_LIMIT_LOGIN_WINDOW_SECONDS',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'OTEL_EXPORTER_OTLP_HEADERS',
  'BOOTSTRAP_ADMIN_IDENTITY',
  'BOOTSTRAP_ADMIN_PASSWORD',
  'BOOTSTRAP_ADMIN_DISPLAY_NAME',
  'BOOTSTRAP_ADMIN_EMAIL',
]);

function parseValue(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '').trim();
}

export function parseLocalEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match || !LOCAL_ENV_KEYS.has(match[1])) continue;
    parsed[match[1]] = parseValue(match[2]);
  }
  return parsed;
}

export function loadLocalEnv(
  environment: NodeJS.ProcessEnv = process.env,
  path = resolve(process.cwd(), '.env'),
): void {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const [key, value] of Object.entries(parseLocalEnvFile(contents))) {
    if (environment[key] === undefined) environment[key] = value;
  }
}
