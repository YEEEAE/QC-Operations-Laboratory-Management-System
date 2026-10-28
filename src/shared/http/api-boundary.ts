const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export type JsonBodyReadResult =
  | { ok: true; rawBody: string }
  | { ok: false; status: 400 | 403 | 413 | 415; code: string };

/** Read a bounded UTF-8 JSON body for machine-facing API routes. */
export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number,
  options: { rejectBrowserOrigin?: boolean } = {},
): Promise<JsonBodyReadResult> {
  if (options.rejectBrowserOrigin && request.headers.has('origin')) {
    return { ok: false, status: 403, code: 'ORIGIN_NOT_ALLOWED' };
  }

  const contentType = request.headers.get('content-type');
  if (!contentType) return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
  const [mediaType, ...parameters] = contentType.split(';').map((part) => part.trim());
  if (mediaType.toLowerCase() !== 'application/json')
    return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
  for (const parameter of parameters) {
    const match = /^charset\s*=\s*(?:"([^"]+)"|([^\s;]+))$/i.exec(parameter);
    const charset = (match?.[1] ?? match?.[2])?.toLowerCase();
    if (!charset || charset !== 'utf-8')
      return { ok: false, status: 415, code: 'UNSUPPORTED_MEDIA_TYPE' };
  }

  const contentEncoding = request.headers.get('content-encoding');
  if (contentEncoding && contentEncoding.toLowerCase() !== 'identity')
    return { ok: false, status: 415, code: 'UNSUPPORTED_CONTENT_ENCODING' };

  const contentLength = request.headers.get('content-length');
  let declaredBytes: number | undefined;
  if (contentLength !== null) {
    if (!/^(0|[1-9]\d*)$/.test(contentLength))
      return { ok: false, status: 400, code: 'INVALID_CONTENT_LENGTH' };
    declaredBytes = Number(contentLength);
    if (!Number.isSafeInteger(declaredBytes))
      return { ok: false, status: 400, code: 'INVALID_CONTENT_LENGTH' };
    if (declaredBytes > maxBytes) return { ok: false, status: 413, code: 'PAYLOAD_TOO_LARGE' };
  }

  if (!request.body) return { ok: false, status: 400, code: 'INVALID_JSON' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, code: 'PAYLOAD_TOO_LARGE' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, code: 'INVALID_JSON' };
  }

  if (declaredBytes !== undefined && declaredBytes !== totalBytes)
    return { ok: false, status: 400, code: 'INVALID_CONTENT_LENGTH' };

  try {
    const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes);
    return { ok: true, rawBody: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, status: 400, code: 'INVALID_JSON' };
  }
}

/** JSON API responses are private and do not grant cross-origin browser access. */
export function apiJsonResponse(
  status: number,
  body: Record<string, unknown>,
  additionalHeaders?: HeadersInit,
): Response {
  const headers = new Headers(additionalHeaders);
  headers.set('content-type', JSON_CONTENT_TYPE);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify(body), { status, headers });
}
