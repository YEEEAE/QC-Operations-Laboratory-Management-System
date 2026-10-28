import { createHash, randomUUID } from 'node:crypto';
import { sql, type Kysely, type QueryExecutor } from 'kysely';

import { AppError } from '../errors/app-error';
import type { DatabaseSchema } from '../database/db-types';
import type { ObjectStore, StoredObject } from './object-store';

const CHUNK_BYTES = 512 * 1024;
const READ_BATCH_CHUNKS = 8;

interface ObjectMetadata {
  object_id: string;
  sha256: string;
  size_bytes: string | number;
  mime_type: string;
  object_state: string;
  integrity_status: string;
  chunk_count: number;
}

/**
 * Stores file payloads in immutable PostgreSQL BYTEA chunks. `get()` preserves
 * the legacy complete-buffer ObjectStore contract; `getStream()` offers a
 * bounded-memory, pre-verified path for future authorized streaming routes.
 */
export class PostgresByteaObjectStore implements ObjectStore {
  readonly provider = 'POSTGRES_BYTEA';

  constructor(private readonly database: Kysely<DatabaseSchema>) {}

  async put(key: string, object: StoredObject): Promise<void> {
    const digest = createHash('sha256').update(object.bytes).digest('hex');
    return this.putStream(key, {
      contentType: object.contentType,
      sizeBytes: object.bytes.byteLength,
      sha256: digest,
      open: async function* () { yield object.bytes; },
    });
  }

  async putStream(
    key: string,
    input: {
      contentType: string;
      sizeBytes: number;
      sha256: string;
      open: () => AsyncIterable<Uint8Array>;
    },
  ): Promise<void> {
    this.assertKey(key);
    if (
      !Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes <= 0 ||
      !input.contentType.trim() ||
      !/^[0-9a-f]{64}$/.test(input.sha256)
    )
      throw new AppError('VALIDATION_FAILED');

    const inputHash = createHash('sha256');
    let inputBytes = 0;
    for await (const chunk of input.open()) {
      inputHash.update(chunk);
      inputBytes += chunk.byteLength;
      if (inputBytes > input.sizeBytes) throw new AppError('VALIDATION_FAILED');
    }
    if (inputBytes !== input.sizeBytes || inputHash.digest('hex') !== input.sha256)
      throw new AppError('VALIDATION_FAILED');

    const digest = input.sha256;
    const chunkCount = Math.ceil(input.sizeBytes / CHUNK_BYTES);

    await this.database.transaction().execute(async (trx) => {
      const existingKey = await sql<{
        object_id: string;
        sha256: string;
        size_bytes: string | number;
        mime_type: string;
        object_state: string;
        integrity_status: string;
      }>`
        SELECT k.object_id::text AS object_id, o.sha256, o.size_bytes, o.mime_type,
               o.object_state, o.integrity_status
        FROM qc.library_binary_object_keys k
        JOIN qc.library_binary_objects o ON o.id = k.object_id
        WHERE k.storage_key = ${key}
        FOR UPDATE OF o
      `.execute(trx);
      if (existingKey.rows[0]) {
        const row = existingKey.rows[0];
        if (
          row.sha256 !== digest ||
          Number(row.size_bytes) !== input.sizeBytes ||
          row.mime_type !== input.contentType ||
          row.object_state !== 'COMPLETE' ||
          row.integrity_status !== 'VERIFIED'
        )
          throw new AppError('CONFLICT_STALE');
        return;
      }

      let objectId: string;
      const existingDigest = await sql<{
        id: string;
        size_bytes: string | number;
        mime_type: string;
        object_state: string;
        integrity_status: string;
        chunk_count: number;
      }>`
        SELECT id::text AS id, size_bytes, mime_type, object_state, integrity_status, chunk_count
        FROM qc.library_binary_objects
        WHERE sha256 = ${digest}
        FOR UPDATE
      `.execute(trx);

      const existing = existingDigest.rows[0];
      if (existing) {
        if (
          Number(existing.size_bytes) !== input.sizeBytes ||
          existing.mime_type !== input.contentType ||
          existing.object_state !== 'COMPLETE' ||
          existing.integrity_status !== 'VERIFIED'
        )
          throw new AppError('VALIDATION_FAILED');
        objectId = existing.id;
        await this.assertReadback(trx, objectId, existing.chunk_count, input.sizeBytes, digest);
      } else {
        const id = randomUUID();
        await sql`
          INSERT INTO qc.library_binary_objects
            (id, sha256, size_bytes, mime_type, object_state, chunk_count, integrity_status)
          VALUES (${id}::uuid, ${digest}, ${input.sizeBytes}, ${input.contentType}, 'STAGING', ${chunkCount}, 'PENDING')
        `.execute(trx);
        objectId = id;

        const writeHash = createHash('sha256');
        let writtenBytes = 0;
        let chunkNo = 0;
        let pending = Buffer.alloc(0);
        for await (const inputChunk of input.open()) {
          writeHash.update(inputChunk);
          writtenBytes += inputChunk.byteLength;
          if (writtenBytes > input.sizeBytes) throw new AppError('VALIDATION_FAILED');
          let offset = 0;
          while (offset < inputChunk.byteLength) {
            const take = Math.min(CHUNK_BYTES - pending.byteLength, inputChunk.byteLength - offset);
            pending = pending.byteLength
              ? Buffer.concat([pending, Buffer.from(inputChunk.subarray(offset, offset + take))])
              : Buffer.from(inputChunk.subarray(offset, offset + take));
            offset += take;
            if (pending.byteLength === CHUNK_BYTES) {
              await this.insertChunk(trx, objectId, chunkNo, pending);
              chunkNo += 1;
              pending = Buffer.alloc(0);
            }
          }
        }
        if (pending.byteLength) {
          await this.insertChunk(trx, objectId, chunkNo, pending);
          chunkNo += 1;
        }
        if (
          writtenBytes !== input.sizeBytes ||
          chunkNo !== chunkCount ||
          writeHash.digest('hex') !== digest
        )
          throw new AppError('VALIDATION_FAILED');

        await this.assertReadback(trx, objectId, chunkCount, input.sizeBytes, digest);
        await sql`
          UPDATE qc.library_binary_objects
          SET object_state = 'COMPLETE', integrity_status = 'VERIFIED'
          WHERE id = ${objectId}::uuid AND object_state = 'STAGING'
        `.execute(trx);
      }

      await sql`
        INSERT INTO qc.library_binary_object_keys (storage_key, object_id)
        VALUES (${key}, ${objectId}::uuid)
      `.execute(trx);
    });
  }

  private async insertChunk(
    executor: QueryExecutor,
    objectId: string,
    chunkNo: number,
    bytes: Uint8Array,
  ): Promise<void> {
    await sql`
      INSERT INTO qc.library_binary_chunks (object_id, chunk_no, chunk_bytes)
      VALUES (${objectId}::uuid, ${chunkNo}, ${Buffer.from(bytes)})
    `.execute(executor);
  }

  async get(key: string): Promise<StoredObject | undefined> {
    const source = await this.getStream(key);
    if (!source) return undefined;
    const parts: Uint8Array[] = [];
    let length = 0;
    for await (const part of source.stream) {
      parts.push(part);
      length += part.byteLength;
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return { bytes, contentType: source.contentType };
  }

  async getForProvider(provider: string, key: string): Promise<StoredObject | undefined> {
    return provider === this.provider ? this.get(key) : undefined;
  }

  async getStream(
    key: string,
  ): Promise<{ contentType: string; sizeBytes: number; stream: AsyncIterable<Uint8Array> } | undefined> {
    this.assertKey(key);
    const metadata = await this.findCompleteObject(key);
    if (!metadata) return undefined;
    return this.streamVerifiedObject(metadata);
  }

  async getStreamByObjectId(
    objectId: string,
  ): Promise<{ contentType: string; sizeBytes: number; stream: AsyncIterable<Uint8Array> } | undefined> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(objectId))
      throw new AppError('VALIDATION_FAILED');
    const result = await sql<ObjectMetadata>`
      SELECT id::text AS object_id, sha256, size_bytes, mime_type,
             object_state, integrity_status, chunk_count
      FROM qc.library_binary_objects
      WHERE id = ${objectId}::uuid
        AND object_state = 'COMPLETE'
        AND integrity_status = 'VERIFIED'
    `.execute(this.database);
    const metadata = result.rows[0];
    if (!metadata) return undefined;
    return this.streamVerifiedObject(metadata);
  }

  private async streamVerifiedObject(
    metadata: ObjectMetadata,
  ): Promise<{ contentType: string; sizeBytes: number; stream: AsyncIterable<Uint8Array> }> {
    const sizeBytes = Number(metadata.size_bytes);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) throw new AppError('VALIDATION_FAILED');
    await this.assertReadback(
      this.database,
      metadata.object_id,
      metadata.chunk_count,
      sizeBytes,
      metadata.sha256,
    );

    const database = this.database;
    const objectId = metadata.object_id;
    const chunkCount = metadata.chunk_count;
    const stream = (async function* (): AsyncGenerator<Uint8Array> {
      for (let first = 0; first < chunkCount; first += READ_BATCH_CHUNKS) {
        const result = await sql<{ chunk_no: number; chunk_bytes: Uint8Array }>`
          SELECT chunk_no, chunk_bytes
          FROM qc.library_binary_chunks
          WHERE object_id = ${objectId}::uuid
            AND chunk_no >= ${first}
            AND chunk_no < ${Math.min(first + READ_BATCH_CHUNKS, chunkCount)}
          ORDER BY chunk_no
        `.execute(database);
        if (result.rows.length !== Math.min(READ_BATCH_CHUNKS, chunkCount - first))
          throw new AppError('VALIDATION_FAILED');
        for (let index = 0; index < result.rows.length; index += 1) {
          const row = result.rows[index];
          if (row.chunk_no !== first + index) throw new AppError('VALIDATION_FAILED');
          yield new Uint8Array(row.chunk_bytes);
        }
      }
    })();

    return { contentType: metadata.mime_type, sizeBytes, stream };
  }

  async delete(key: string): Promise<void> {
    this.assertKey(key);
    await this.database.transaction().execute(async (trx) => {
      const reference = await sql<{ count: string }>`
        SELECT count(*)::text AS count
        FROM qc.files
        WHERE storage_key = ${key} AND storage_provider = ${this.provider}
      `.execute(trx);
      // FileService calls delete only to roll back an uncommitted metadata write.
      // Keep the alias and immutable bytes if a committed file already references it.
      if (Number(reference.rows[0]?.count ?? 0) > 0) return;

      const deleted = await sql<{ object_id: string }>`
        DELETE FROM qc.library_binary_object_keys
        WHERE storage_key = ${key}
        RETURNING object_id::text AS object_id
      `.execute(trx);
      // Content-addressed payloads are immutable and retained even when an
      // uncommitted upload is rolled back; orphan cleanup needs a separate
      // retention decision and must never run on the upload path.
      void deleted;
    });
  }

  private async findCompleteObject(key: string): Promise<ObjectMetadata | undefined> {
    const result = await sql<ObjectMetadata>`
      SELECT o.id::text AS object_id, o.sha256, o.size_bytes, o.mime_type,
             o.object_state, o.integrity_status, o.chunk_count
      FROM qc.library_binary_object_keys k
      JOIN qc.library_binary_objects o ON o.id = k.object_id
      WHERE k.storage_key = ${key}
        AND o.object_state = 'COMPLETE'
        AND o.integrity_status = 'VERIFIED'
    `.execute(this.database);
    return result.rows[0];
  }

  private async assertReadback(
    executor: QueryExecutor,
    objectId: string,
    expectedChunks: number,
    expectedSize: number,
    expectedDigest: string,
  ): Promise<void> {
    const hash = createHash('sha256');
    let total = 0;
    let nextChunk = 0;
    while (nextChunk < expectedChunks) {
      const end = Math.min(nextChunk + READ_BATCH_CHUNKS, expectedChunks);
      const result = await sql<{ chunk_no: number; chunk_bytes: Uint8Array }>`
        SELECT chunk_no, chunk_bytes FROM qc.library_binary_chunks
        WHERE object_id = ${objectId}::uuid AND chunk_no >= ${nextChunk} AND chunk_no < ${end}
        ORDER BY chunk_no
      `.execute(executor);
      if (result.rows.length !== end - nextChunk) throw new AppError('VALIDATION_FAILED');
      for (const row of result.rows) {
        if (row.chunk_no !== nextChunk) throw new AppError('VALIDATION_FAILED');
        hash.update(row.chunk_bytes);
        total += row.chunk_bytes.byteLength;
        nextChunk += 1;
      }
    }
    if (total !== expectedSize || hash.digest('hex') !== expectedDigest)
      throw new AppError('VALIDATION_FAILED');
  }

  private assertKey(key: string): void {
    if (!key || key.length > 512 || key.includes('\0') || key.startsWith('/') || key.includes('..'))
      throw new AppError('VALIDATION_FAILED');
  }
}
