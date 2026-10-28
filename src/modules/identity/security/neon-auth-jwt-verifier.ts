import {
  createRemoteJWKSet,
  customFetch,
  decodeProtectedHeader,
  jwtVerify,
} from 'jose';
import type { ServerEnv } from '../../../config/env.js';

const APPROVED_JWKS_URL =
  'https://ep-fragrant-bar-b5ns86ri.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json';
const MAX_TOKEN_LENGTH = 8_192;
const MAX_JWKS_BYTES = 256 * 1024;

export interface VerifiedNeonAuthToken {
  /** External subject only; it is not a QC user id, role, or permission. */
  subject: string;
  issuer: string;
  audience: string | string[];
  expiresAt: number;
  notBefore?: number;
}

export interface NeonAuthJwtVerifier {
  verify(token: string, sessionPolicy: NeonAuthSessionPolicy): Promise<VerifiedNeonAuthToken>;
}

export interface NeonAuthSessionPolicy {
  /** Resolve an approved local identity and reject inactive or revoked session context. */
  assertActiveLocalIdentity(token: VerifiedNeonAuthToken): Promise<void>;
}

let cachedVerifierSettings: string | undefined;
let cachedVerifier: NeonAuthJwtVerifier | undefined;

export class NeonAuthTokenVerificationError extends Error {
  readonly code = 'NEON_AUTH_TOKEN_INVALID';

  constructor() {
    super('Neon Auth token could not be verified');
    this.name = 'NeonAuthTokenVerificationError';
  }
}

function boundedJwksFetch(url: string, options: Parameters<typeof fetch>[1]) {
  const target = new URL(url);
  if (target.href !== APPROVED_JWKS_URL) {
    throw new NeonAuthTokenVerificationError();
  }
  return fetch(target, {
    method: 'GET',
    signal: options?.signal,
    redirect: 'manual',
    headers: { accept: 'application/jwk-set+json, application/json' },
  });
}

async function limitedJwksFetch(url: string, options: Parameters<typeof fetch>[1]): Promise<Response> {
  const response = await boundedJwksFetch(url, options);
  if (response.status !== 200) return response;
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_JWKS_BYTES) {
    await response.body?.cancel();
    throw new NeonAuthTokenVerificationError();
  }
  if (!response.body) return response;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_JWKS_BYTES) {
        await reader.cancel();
        throw new NeonAuthTokenVerificationError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Response(body, { status: response.status, headers: response.headers });
}

/**
 * Creates an optional cryptographic verifier. It never creates a QC session or
 * actor; those require a separate approved subject mapping and local session
 * policy. JWKS is fetched lazily on the first explicit verify call.
 */
export function createNeonAuthJwtVerifier(env: ServerEnv) {
  if (env.NEON_AUTH_ENABLED !== 'true') return undefined;
  if (
    env.NEON_AUTH_JWKS_URL !== APPROVED_JWKS_URL ||
    !env.NEON_AUTH_ISSUER ||
    !env.NEON_AUTH_AUDIENCE
  ) {
    throw new Error('Neon Auth verification is enabled without complete approved settings');
  }
  const settingsKey = JSON.stringify([
    env.NEON_AUTH_JWKS_URL,
    env.NEON_AUTH_ISSUER,
    env.NEON_AUTH_AUDIENCE,
  ]);
  if (cachedVerifier && cachedVerifierSettings === settingsKey) return cachedVerifier;

  const remoteJwks = createRemoteJWKSet(new URL(APPROVED_JWKS_URL), {
    timeoutDuration: 5_000,
    cooldownDuration: 30_000,
    cacheMaxAge: 600_000,
    headers: { accept: 'application/jwk-set+json, application/json' },
    [customFetch]: limitedJwksFetch,
  });

  const verifier: NeonAuthJwtVerifier = {
    async verify(
      token: string,
      sessionPolicy: NeonAuthSessionPolicy,
    ): Promise<VerifiedNeonAuthToken> {
      try {
        if (!sessionPolicy || typeof sessionPolicy.assertActiveLocalIdentity !== 'function') {
          throw new NeonAuthTokenVerificationError();
        }
        if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
          throw new NeonAuthTokenVerificationError();
        }
        const header = decodeProtectedHeader(token);
        if (
          header.alg !== 'EdDSA' ||
          header.typ !== 'JWT' ||
          typeof header.kid !== 'string' ||
          header.kid.length === 0 ||
          header.kid.length > 256 ||
          'jku' in header ||
          'x5u' in header ||
          'jwk' in header
        ) {
          throw new NeonAuthTokenVerificationError();
        }

        const { payload } = await jwtVerify(token, remoteJwks, {
          issuer: env.NEON_AUTH_ISSUER,
          audience: env.NEON_AUTH_AUDIENCE,
          algorithms: ['EdDSA'],
          typ: 'JWT',
          requiredClaims: ['exp', 'sub'],
        });
        if (
          typeof payload.sub !== 'string' ||
          payload.sub.length === 0 ||
          typeof payload.iss !== 'string' ||
          (typeof payload.aud !== 'string' &&
            (!Array.isArray(payload.aud) || !payload.aud.every((item) => typeof item === 'string'))) ||
          typeof payload.exp !== 'number'
        ) {
          throw new NeonAuthTokenVerificationError();
        }

        const verifiedToken: VerifiedNeonAuthToken = {
          subject: payload.sub,
          issuer: payload.iss,
          audience: payload.aud as string | string[],
          expiresAt: payload.exp,
          ...(typeof payload.nbf === 'number' ? { notBefore: payload.nbf } : {}),
        };
        await sessionPolicy.assertActiveLocalIdentity(verifiedToken);
        return verifiedToken;
      } catch {
        // Do not include the token, claims, JWKS response, URL, or raw JOSE error.
        throw new NeonAuthTokenVerificationError();
      }
    },
  };
  cachedVerifier = verifier;
  cachedVerifierSettings = settingsKey;
  return verifier;
}
