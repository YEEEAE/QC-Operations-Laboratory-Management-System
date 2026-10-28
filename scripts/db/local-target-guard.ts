import { parseServerEnv } from '../../src/config/env.js';

function targetKey(value: string): string {
  const url = new URL(value);
  const labels = url.hostname.toLowerCase().split('.');
  if (labels[0]?.endsWith('-pooler')) labels[0] = labels[0].slice(0, -'-pooler'.length);
  return `${labels.join('.')}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`;
}

/** Fail closed for local database CLIs before opening a PostgreSQL connection. */
export function assertSafeLocalDatabaseCommand(
  environment: NodeJS.ProcessEnv = process.env,
  targetUrl?: string,
  options: { productionApproved?: boolean } = {},
): void {
  const profile = environment.APP_ENVIRONMENT_PROFILE;
  if (!profile) {
    throw new Error('Local database command blocked: APP_ENVIRONMENT_PROFILE must be explicit.');
  }
  if (profile === 'production') {
    const productionContextProvided =
      options.productionApproved === true &&
      Boolean(environment.MIGRATION_PRODUCTION_RELEASE_ID?.trim()) &&
      Boolean(environment.MIGRATION_PRODUCTION_APPROVAL_REFERENCE?.trim());
    if (!productionContextProvided) {
      throw new Error(
        'Database command blocked: production requires an explicit approved release context.',
      );
    }
  }
  if ((profile === 'development' || profile === 'test') && (environment.NODE_ENV ?? 'development') !== profile) {
    throw new Error('Local database command blocked: APP_ENVIRONMENT_PROFILE and NODE_ENV disagree.');
  }

  const runtimeEnvironment = {
    ...environment,
    DATABASE_URL_UNPOOLED: undefined,
    MIGRATION_DATABASE_URL: undefined,
  };
  const runtime = parseServerEnv(runtimeEnvironment);
  const runtimeUrl = runtime.DATABASE_URL;
  const selectedTarget = targetUrl ?? runtimeUrl;
  if (!runtimeUrl || !selectedTarget) {
    throw new Error('Database command blocked: an explicitly bound runtime database target is required.');
  }

  if (profile === 'development' || profile === 'test') {
    const hostname = new URL(selectedTarget).hostname.toLowerCase();
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname)) {
      throw new Error('Database command blocked: development/test database hosts must be loopback.');
    }
    return;
  }

  if (targetKey(selectedTarget) !== targetKey(runtimeUrl)) {
    throw new Error('Database command blocked: operator target differs from the active profile identity.');
  }
}
