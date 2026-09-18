import type { APIRoute } from 'astro';
import { AppError } from '../../../shared/errors/app-error.js';
import { reportingDependencies } from '../../../modules/reporting/application/dependencies.js';

const EXPORT_FORMATS = new Set(['csv', 'xlsx']);

function problem(status: number, title: string): Response {
  return new Response(
    JSON.stringify({ type: 'about:blank', title, status }),
    { status, headers: { 'content-type': 'application/json; charset=utf-8' } },
  );
}

/**
 * Spreadsheet export for a canonical registered report (REQ-RPT-002/006/007).
 *
 * The export executes the same server-side use case as the on-screen dataset,
 * so screen rows, CSV rows, and XLSX rows always agree. Authorization is
 * re-checked server-side against the report's run/export permissions; the
 * actor is derived from the session, never from the browser. Exports are
 * served as attachments with an explicit filename so they are never rendered
 * in-place.
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
  const actor = locals.actor;
  if (!actor) return problem(401, 'AUTH_REQUIRED');
  const code = params.reportCode ?? '';
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  if (!EXPORT_FORMATS.has(format)) return problem(400, 'VALIDATION_INVALID_QUERY');
  try {
    const result = await reportingDependencies().exportReport.execute(
      actor,
      code,
      format.toUpperCase() as 'CSV' | 'XLSX',
      {
        from: url.searchParams.get('from') ?? undefined,
        to: url.searchParams.get('to') ?? undefined,
        lot: url.searchParams.get('lot') ?? undefined,
        itemCode: url.searchParams.get('itemCode') ?? undefined,
        workflowState: url.searchParams.get('workflowState') ?? undefined,
        inspectionResult: url.searchParams.get('inspectionResult') ?? undefined,
        releaseSystem: url.searchParams.has('releaseSystem')
          ? url.searchParams.get('releaseSystem') === 'true'
          : undefined,
      },
    );
    return new Response(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        'content-type': result.mimeType,
        'content-disposition': `attachment; filename="${result.filename}"`,
        'x-content-type-options': 'nosniff',
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'RESOURCE_NOT_FOUND') return problem(404, 'RESOURCE_NOT_FOUND');
      if (error.code.startsWith('AUTHZ_')) return problem(403, error.code);
      return problem(400, error.code);
    }
    return problem(500, 'INTERNAL_ERROR');
  }
};