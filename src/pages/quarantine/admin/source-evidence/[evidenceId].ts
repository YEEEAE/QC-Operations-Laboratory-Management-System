import { createHash } from 'node:crypto';
import { realpath, readFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import type { APIRoute } from 'astro';
import { getDatabase } from '../../../../shared/database/database.js';

const EVIDENCE_ROOT = 'QC_Controlled_Forms_and_Operational_Evidence';

export const GET: APIRoute = async ({ params, locals }) => {
  const actor = locals.actor;
  if (!actor || actor.accountState !== 'ACTIVE' || !actor.permissions.some((permission) =>
    permission.code === 'PERM-ADM-TEMPLATES' && permission.active !== false))
    return new Response(null, { status: 404 });

  const id = params.evidenceId ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return new Response(null, { status: 404 });

  try {
    const evidence = await getDatabase().selectFrom('inspection_report_source_evidence')
      .select(['source_file', 'source_sha256'])
      .where('id', '=', id)
      .executeTakeFirst();
    if (!evidence) return new Response(null, { status: 404 });

    const evidenceRoot = await realpath(resolve(process.cwd(), EVIDENCE_ROOT));
    const portableReference = evidence.source_file.replaceAll('\\', '/');
    const relativeReference = portableReference.startsWith(`${EVIDENCE_ROOT}/`)
      ? portableReference.slice(EVIDENCE_ROOT.length + 1)
      : portableReference;
    if (!relativeReference || isAbsolute(relativeReference) || relativeReference.split('/').includes('..'))
      return new Response(null, { status: 404 });

    const path = await realpath(resolve(evidenceRoot, relativeReference));
    const resolvedRelative = relative(evidenceRoot, path);
    if (!resolvedRelative || resolvedRelative.startsWith(`..${sep}`) || isAbsolute(resolvedRelative))
      return new Response(null, { status: 404 });

    const bytes = await readFile(path);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (digest !== evidence.source_sha256) return new Response(null, { status: 409 });

    const extension = basename(path).toLowerCase().split('.').pop();
    const contentType = extension === 'pdf' ? 'application/pdf'
      : extension === 'png' ? 'image/png'
      : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
      : extension === 'heic' ? 'application/octet-stream'
      : 'application/octet-stream';
    const filename = encodeURIComponent(basename(path));
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(bytes.byteLength),
        'Content-Disposition': `inline; filename*=UTF-8''${filename}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
};
