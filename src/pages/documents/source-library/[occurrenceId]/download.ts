import type { APIRoute } from 'astro';
import { isNamedSystemOwner } from '../../../../shared/authorization/p05-authority.js';
import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresByteaObjectStore } from '../../../../shared/files/postgres-bytea-object-store.js';

export const GET: APIRoute = async ({ params, locals }) => {
  const actor = locals.actor;
  if (!actor) return new Response(null, { status: 401 });
  if (!isNamedSystemOwner(actor)) return new Response(null, { status: 404 });
  const occurrenceId = params.occurrenceId;
  if (!occurrenceId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(occurrenceId))
    return new Response(null, { status: 404 });

  try {
    const database = getDatabase();
    const source = await database
      .selectFrom('library_source_occurrences')
      .innerJoin('library_binary_objects', 'library_binary_objects.id', 'library_source_occurrences.binary_object_id')
      .innerJoin('files', 'files.id', 'library_source_occurrences.file_id')
      .select([
        'library_source_occurrences.original_filename as original_filename',
        'library_source_occurrences.license_state as license_state',
        'library_source_occurrences.review_state as review_state',
        'library_binary_objects.id as object_id',
        'library_binary_objects.mime_type as mime_type',
        'library_binary_objects.size_bytes as size_bytes',
        'files.mime_type as file_mime_type',
      ])
      .where('library_source_occurrences.id', '=', occurrenceId)
      .where('library_binary_objects.object_state', '=', 'COMPLETE')
      .where('library_binary_objects.integrity_status', '=', 'VERIFIED')
      .executeTakeFirst();
    if (!source || !['NOT_APPLICABLE', 'AUTHORIZED'].includes(source.license_state) || !['READABLE', 'PARTIAL'].includes(source.review_state))
      return new Response(null, { status: 404 });

    const binary = await new PostgresByteaObjectStore(database).getStreamByObjectId(source.object_id);
    if (!binary || binary.sizeBytes !== Number(source.size_bytes)) return new Response(null, { status: 404 });
    const iterator = binary.stream[Symbol.asyncIterator]();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const next = await iterator.next();
          if (next.done) controller.close();
          else controller.enqueue(next.value);
        } catch {
          controller.error(new Error('Source download integrity verification failed.'));
        }
      },
      async cancel() {
        await iterator.return?.();
      },
    });
    const safeName = source.original_filename.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 180) || 'source-file';
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': source.file_mime_type,
        'content-length': String(binary.sizeBytes),
        'content-disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(source.original_filename)}`,
        'cache-control': 'private, no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    // Missing/unapplied schema or provider failures fail closed without leaking source metadata.
    return new Response('Source library unavailable.', {
      status: 503,
      headers: { 'cache-control': 'private, no-store', 'content-type': 'text/plain; charset=utf-8' },
    });
  }
};
