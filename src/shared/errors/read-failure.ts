import { AppError } from './app-error.js';

/** Internal read outcome. Detail routes must render MISSING and DENIED alike. */
export type ReadFailure = 'MISSING' | 'DENIED' | 'UNAVAILABLE';

export function classifyReadFailure(error: unknown): ReadFailure {
  if (error instanceof AppError) {
    if (error.code === 'RESOURCE_NOT_FOUND') return 'MISSING';
    if (error.category === 'AUTHORIZATION' || error.category === 'AUTHENTICATION') return 'DENIED';
  }
  return 'UNAVAILABLE';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** A controlled SSR response for failed primary reads; it contains no record identifiers or provider details. */
export function providerUnavailableResponse(title: string, retryHref: string): Response {
  const safeTitle = escapeHtml(title);
  const safeHref = escapeHtml(
    retryHref.startsWith('/') && !retryHref.startsWith('//') ? retryHref : '/',
  );
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safeTitle} · QC Operations</title></head><body><main><p>QC Operations</p><h1>${safeTitle}</h1><p role="alert">The source did not confirm this read. No conclusion about record existence is available, and no data was changed.</p><a href="${safeHref}">Retry this page</a></main><style>body{margin:0;background:#f6f8fb;color:#17243a;font:16px/1.5 system-ui,sans-serif}main{max-width:42rem;margin:12vh auto;padding:2rem;background:white;border:1px solid #cbd5e1;border-radius:1rem}h1{font-size:1.5rem}a{color:#075eaf;font-weight:700}</style></body></html>`,
    {
      status: 503,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    },
  );
}
