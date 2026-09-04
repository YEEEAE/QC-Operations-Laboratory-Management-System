import { defineMiddleware } from 'astro:middleware';
import { createRequestContext } from './shared/http/request-context';
import { getDatabase } from './shared/database/database.js';
import { identityDependencies, resolveActor } from './modules/identity/application/identity-dependencies.js';
import { ResolveSessionUseCase } from './modules/identity/application/resolve-session.js';

const publicPaths = new Set(['/login']);
export const onRequest = defineMiddleware(async ({ request, url, locals, cookies, redirect }, next) => {
  locals.requestContext = createRequestContext(request);
  const token = cookies.get('__Host-qc_session')?.value;
  if (token) {
    try { const deps = identityDependencies(getDatabase()); const resolved = await new ResolveSessionUseCase(deps.sessionService).execute(token); locals.user = resolved.user; locals.actor = await resolveActor(deps.database, resolved.user.id); }
    catch { locals.user = undefined; locals.actor = undefined; }
  }
  if (!publicPaths.has(url.pathname) && !locals.user && !url.pathname.startsWith('/api/')) return redirect(`/login?returnTo=${encodeURIComponent(`${url.pathname}${url.search}`)}`, 303);
  if (url.pathname === '/login' && locals.user) return redirect('/dashboard', 303);
  return next();
});
