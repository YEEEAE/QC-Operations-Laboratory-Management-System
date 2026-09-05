/**
 * Session cookie contract (SECURITY-ARCHITECTURE §12).
 * __Host- prefix forces: Secure, HttpOnly, Path=/, no Domain attribute.
 * Secure stays enabled in every environment: the __Host- prefix mandates it,
 * and browsers treat localhost/127.0.0.1 as trustworthy origins during
 * development. SameSite=Strict by default per §12.
 */

export const SESSION_COOKIE_NAME = '__Host-qc_session';

export interface SessionCookieOptions {
  path: string;
  httpOnly: boolean;
  sameSite: 'strict';
  secure: boolean;
  maxAge?: number;
}

export function sessionCookieOptions(options?: { expired?: boolean }): SessionCookieOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: true,
    ...(options?.expired ? { maxAge: 0 } : {}),
  };
}
