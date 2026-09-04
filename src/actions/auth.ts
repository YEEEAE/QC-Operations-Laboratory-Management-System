import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { safeReturnTo } from '../shared/http/safe-return-to.js';
import { toActionError } from '../shared/errors/action-error.js';
import { identityDependencies } from '../modules/identity/application/identity-dependencies.js';
import { LoginUseCase } from '../modules/identity/application/login.js';
import { LogoutUseCase } from '../modules/identity/application/logout.js';

const login = defineAction({ accept: 'form', input: z.object({ loginIdentity: z.string(), password: z.string(), returnTo: z.string().optional() }), handler: async (input, context) => {
  try {
    const deps = identityDependencies();
    const result = await new LoginUseCase(deps.users, deps.passwords, deps.sessionService).execute(input.loginIdentity, input.password);
    context.cookies.set('__Host-qc_session', result.cookie.split(';')[0].split('=').slice(1).join('='), { path: '/', httpOnly: true, sameSite: 'strict', secure: import.meta.env.PROD });
    return { ok: true, redirectTo: safeReturnTo(input.returnTo) };
  } catch (error) { const mapped = toActionError(error, context.locals.requestContext?.requestId); throw new ActionError('BAD_REQUEST', mapped.error.messageKey); }
}});

const logout = defineAction({ accept: 'form', handler: async (_, context) => {
  try { const deps = identityDependencies(); const cookie = await new LogoutUseCase(deps.sessionService).execute(context.cookies.get('__Host-qc_session')?.value); const [name, value] = cookie.split(';', 1)[0].split('='); context.cookies.set(name, decodeURIComponent(value ?? ''), { path: '/', httpOnly: true, sameSite: 'strict', secure: import.meta.env.PROD, maxAge: 0 }); return { ok: true, redirectTo: '/login' }; }
  catch (error) { const mapped = toActionError(error, context.locals.requestContext?.requestId); throw new ActionError('BAD_REQUEST', mapped.error.messageKey); }
}});

export const server = { login, logout };
