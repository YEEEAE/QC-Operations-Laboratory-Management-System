import { randomBytes } from 'node:crypto';
import { TRACEPARENT_HEADER, REQUEST_ID_HEADER } from '../../config/constants';
import { uuidv7 } from '../id/uuid';

export interface RequestContext {
  requestId: string;
  traceId: string;
  spanId: string;
  actor?: never;
}
const safeId = /^[A-Za-z0-9._:-]{1,128}$/;
function hex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}
export function createRequestContext(request: Request): RequestContext {
  const supplied = request.headers.get(REQUEST_ID_HEADER);
  const requestId = supplied && safeId.test(supplied) ? supplied : `req_${uuidv7()}`;
  const traceparent = request.headers
    .get(TRACEPARENT_HEADER)
    ?.match(/^00-([0-9a-f]{32})-([0-9a-f]{16})-0[1-9a-f]$/i);
  return { requestId, traceId: traceparent?.[1] ?? hex(16), spanId: traceparent?.[2] ?? hex(8) };
}
