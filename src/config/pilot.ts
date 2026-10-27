import { getServerEnv } from './env.js';

export type PilotReadiness = 'IMPLEMENTED' | 'CONFIGURED' | 'VERIFIED' | 'APPROVED' | 'NOT CONFIGURED' | 'NOT VERIFIED' | 'NOT APPROVED';

export function pilotEnvironmentView() {
  const env = getServerEnv();
  const profile = env.APP_ENVIRONMENT_PROFILE;
  const scope = {
    site: env.PILOT_SCOPE_SITE,
    department: env.PILOT_SCOPE_DEPARTMENT,
    line: env.PILOT_SCOPE_LINE,
    shift: env.PILOT_SCOPE_SHIFT,
  };
  const prefix = profile === 'pilot' ? 'PILOT' : 'STAGING';
  const fileStorageConfigured = profile === 'pilot'
    ? Boolean(env.PILOT_R2_ENDPOINT && env.PILOT_R2_ACCESS_KEY_ID && env.PILOT_R2_SECRET_ACCESS_KEY && env.PILOT_R2_BUCKET)
    : profile === 'staging'
      ? Boolean(env.STAGING_R2_ENDPOINT && env.STAGING_R2_ACCESS_KEY_ID && env.STAGING_R2_SECRET_ACCESS_KEY && env.STAGING_R2_BUCKET)
      : false;
  const profileConfigured = (profile === 'pilot' || profile === 'staging') && Boolean(env.DATABASE_URL) && fileStorageConfigured;
  const scopeConfigured = Object.values(scope).every((value) => Boolean(value?.trim()));
  const fullyConfigured = profileConfigured && (profile === 'staging' || scopeConfigured);
  return {
    profile,
    hostnameLabel: prefix.toLowerCase(),
    fileStorageConfigured,
    enabled: profile === 'pilot' && env.PILOT_ENABLED === 'true',
    shadowMode: profile !== 'pilot' ? 'NOT APPLICABLE' as const : env.PILOT_SHADOW_MODE === 'true' ? 'ENABLED' as const : 'DISABLED' as const,
    scope,
    stages: {
      implementation: 'IMPLEMENTED' as const,
      configuration: fullyConfigured ? 'CONFIGURED' as const : 'NOT CONFIGURED' as const,
      verification: 'NOT VERIFIED' as const,
      approval: 'NOT APPROVED' as const,
    },
    realMasterData: 'NOT APPROVED' as const,
  };
}

export function isPilotShadowMode(): boolean {
  const env = getServerEnv();
  return env.APP_ENVIRONMENT_PROFILE === 'pilot' && env.PILOT_ENABLED === 'true' && env.PILOT_SHADOW_MODE === 'true';
}

export function getPilotScope() {
  const { scope } = pilotEnvironmentView();
  return scope;
}
