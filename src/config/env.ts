import { z } from 'zod';
import { ENV_KEYS } from './constants';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().trim().pipe(z.url()).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  SERVICE_VERSION: z.string().trim().min(1).default('0.1.0'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().trim().pipe(z.url()).optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().trim().min(1).optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

export class InvalidEnvironmentError extends Error {
  readonly missing: readonly string[];
  readonly invalid: readonly string[];

  constructor(missing: readonly string[], invalid: readonly string[]) {
    super(
      `Invalid server environment configuration (${[...missing, ...invalid].join(', ') || 'unknown'})`,
    );
    this.name = 'InvalidEnvironmentError';
    this.missing = missing;
    this.invalid = invalid;
  }
}

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  const result = envSchema.safeParse(input);
  if (result.success) {
    const missing =
      result.data.NODE_ENV === 'production'
        ? [
            !result.data.DATABASE_URL ? ENV_KEYS.databaseUrl : '',
            !result.data.SESSION_SECRET ? ENV_KEYS.sessionSecret : '',
          ].filter(Boolean)
        : [];
    if (missing.length === 0) return result.data;
    throw new InvalidEnvironmentError(missing, []);
  }

  const missing: string[] = [];
  const invalid: string[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'unknown');
    if (issue.code === 'invalid_type' && issue.input === undefined) missing.push(key);
    else invalid.push(key);
  }
  throw new InvalidEnvironmentError([...new Set(missing)], [...new Set(invalid)]);
}

let cachedEnv: ServerEnv | undefined;
export function getServerEnv(): ServerEnv {
  return (cachedEnv ??= parseServerEnv(process.env));
}

export function resetServerEnvForTests(): void {
  cachedEnv = undefined;
}

export const serverEnvKeys = ENV_KEYS;
