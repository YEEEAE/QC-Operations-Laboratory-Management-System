import { defineMiddleware } from 'astro:middleware';
import { createRequestContext } from './shared/http/request-context';

export const onRequest = defineMiddleware(({ request, locals }, next) => {
  locals.requestContext = createRequestContext(request);
  return next();
});
