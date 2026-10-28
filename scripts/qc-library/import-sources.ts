/** QC-DOC-NEON-361: resumable, owner-gated import of originals into PostgreSQL BYTEA. */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, readFile, realpath } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Kysely, PostgresDialect, sql } from 'kysely';
import type { Pool } from 'pg';

import { isNamedSystemOwner } from '../../src/shared/authorization/p05-authority.js';
import type { DatabaseSchema } from '../../src/shared/database/db-types.js';
import { getDatabaseConnectionConfig, createPool } from '../../src/shared/database/pool.js';
import { PostgresByteaObjectStore } from '../../src/shared/files/postgres-bytea-object-store.js';
import { resolveActor } from '../../src/modules/identity/application/identity-dependencies.js';
import { loadLocalEnv, loadLocalMigrationEnv, loadLocalOperatorEnv } from '../db/load-local-env.js';
import { loadMigrations, verifyMigrationIntegrity } from '../db/migrate.js';

const MAX_ENTRIES = 20_000;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;
const LIBRARY_SUBJECT = 'QC_LIBRARY_SOURCE';

interface SourceEntry {
  file_name: string;
  classification: string;
  document_code_filename: string;
  revision_filename: string;
  file_size_bytes: number;
  sha256: string;
  export_relative_path: string;
  content_approval_status: string;
  read_completely_by_codex: boolean;
}
interface Manifest {
  file_records: SourceEntry[];
  duplicate_aliases: Array<{ excluded_filename: string; canonical_filename: string; sha256: string }>;
}
interface ExtractionRecord {
  manifestRow: number;
  sourcePath: string;
  sha256: string;
  extraction: { kind?: string; text?: string; contentStatus?: string; members?: Array<Record<string, unknown>>;
    extractedMemberContent?: Array<Record<string, unknown>> };
}
interface CliOptions {
  sourceRoot: string;
  manifestPath: string;
  extractionPath: string;
  apply: boolean;
  profile?: string;
  projectId?: string;
  branchId?: string;
  databaseName?: string;
  actorId?: string;
  changeReference?: string;
  approvalReference?: string;
  recoveryReference?: string;
}

function fail(message: string): never { throw new Error(message); }
function parseArgs(args: string[]): CliOptions {
  const result: CliOptions = {
    sourceRoot: resolve('Documents/QC_Library_Source_Import'),
    manifestPath: resolve('Documents/QC_Library_Source_Import/SOURCE_MANIFEST.json'),
    extractionPath: resolve('.ci-results/QC-DOC-NEON-361/SOURCE_CONTENT_EXTRACTION.jsonl'),
    apply: false,
  };
  const keys: Record<string, keyof CliOptions> = {
    '--source-root': 'sourceRoot', '--manifest': 'manifestPath', '--extraction': 'extractionPath',
    '--profile': 'profile', '--project-id': 'projectId', '--branch-id': 'branchId', '--database': 'databaseName',
    '--actor-id': 'actorId', '--change-reference': 'changeReference', '--approval-reference': 'approvalReference',
    '--recovery-reference': 'recoveryReference',
  };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--apply') { result.apply = true; continue; }
    const key = keys[args[i]];
    if (!key || !args[i + 1]) fail(`Invalid argument: ${args[i]}`);
    (result[key] as string | undefined) = args[++i];
  }
  return result;
}

function safeRelative(value: string): string[] {
  if (!value || value.includes('\\') || value.includes('\0') || isAbsolute(value)) fail('Unsafe manifest path.');
  const parts = value.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) fail('Unsafe manifest path.');
  return parts;
}

async function safeSource(root: string, relativePath: string): Promise<string | undefined> {
  let current = root;
  try {
    for (const part of safeRelative(relativePath)) {
      current = resolve(current, part);
      if ((await lstat(current)).isSymbolicLink()) fail('Manifest path traverses a symbolic link.');
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
    throw error;
  }
  const final = await realpath(current);
  const withinRoot = relative(root, final);
  if (!withinRoot || withinRoot.startsWith(`..${sep}`) || withinRoot === '..' || isAbsolute(withinRoot)) fail('Manifest path escapes source root.');
  if (!(await lstat(final)).isFile()) fail('Manifest source is not a regular file.');
  return final;
}

async function hashFile(path: string): Promise<{ sha256: string; size: number }> {
  const hash = createHash('sha256');
  let size = 0;
  for await (const chunk of createReadStream(path)) {
    size += chunk.byteLength;
    hash.update(chunk);
    if (size > MAX_FILE_BYTES) fail('A source exceeds the 100 MiB per-file limit.');
  }
  return { sha256: hash.digest('hex'), size };
}

async function* streamFile(path: string): AsyncIterable<Uint8Array> {
  for await (const chunk of createReadStream(path)) yield new Uint8Array(chunk);
}

function mimeType(filename: string): string {
  switch (extname(filename).toLowerCase()) {
    case '.pdf': return 'application/pdf';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xls': return 'application/vnd.ms-excel';
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.odt': return 'application/vnd.oasis.opendocument.text';
    case '.zip': return 'application/zip';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

function safeRef(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized || normalized.length > 200 || /^(?:tbd|pending|none|n\/a)$/i.test(normalized)) fail(`--${field} must be a concrete recorded reference.`);
  return normalized;
}

function assertTarget(options: CliOptions, env: NodeJS.ProcessEnv): void {
  const fields: Array<[string, string | undefined, string | undefined]> = [
    ['profile', options.profile, env.QC_LIBRARY_EXPECTED_PROFILE],
    ['project ID', options.projectId, env.QC_LIBRARY_EXPECTED_PROJECT_ID],
    ['branch ID', options.branchId, env.QC_LIBRARY_EXPECTED_BRANCH_ID],
    ['database', options.databaseName, env.QC_LIBRARY_EXPECTED_DATABASE],
  ];
  for (const [label, requested, expected] of fields) {
    if (!requested || !expected || requested !== expected) fail(`Target ${label} does not exactly match the operator-configured expected target.`);
  }
  if (options.profile !== 'staging' || env.APP_ENVIRONMENT_PROFILE !== 'staging' || env.NODE_ENV === 'production')
    fail('Source import apply is supported only from a local operator session targeting an explicitly configured staging profile.');
  if (env.QC_LIBRARY_IMPORT_ALLOW !== 'true' || env.QC_SEED_ALLOW_NON_PRODUCTION !== 'true')
    fail('Staging source import requires QC_LIBRARY_IMPORT_ALLOW=true and QC_SEED_ALLOW_NON_PRODUCTION=true.');
  const directUrl = env.DATABASE_URL_UNPOOLED?.trim();
  if (!directUrl) fail('DATABASE_URL_UNPOOLED is required for source import.');
  let actualHost: string;
  try { actualHost = new URL(directUrl).hostname; } catch { fail('Direct database target URL is invalid.'); }
  if (!env.QC_LIBRARY_EXPECTED_DB_HOST || actualHost !== env.QC_LIBRARY_EXPECTED_DB_HOST)
    fail('Direct database hostname does not match the operator-configured staging endpoint.');
  if (env.STAGING_DATABASE_HOST !== actualHost || env.STAGING_DATABASE_NAME !== options.databaseName ||
      env.NEON_BRANCH !== 'staging' || env.QC_LIBRARY_VERIFIED_PROJECT_ID !== options.projectId ||
      env.QC_LIBRARY_VERIFIED_BRANCH_ID !== options.branchId)
    fail('Direct database host, database name, and selected Neon branch must match the staging runtime target configuration.');
}

function reviewedArchiveAllowsBytes(record: ExtractionRecord | undefined): boolean {
  if (!record || record.extraction.kind !== 'ZIP' || !Array.isArray(record.extraction.members)) return false;
  const members = record.extraction.members;
  if (members.some((member) => !['MEMBER_METADATA_ONLY', 'MEMBER_CONTENT_EXTRACTED', 'DIRECTORY_ENTRY'].includes(String(member.status)))) return false;
  const review = record.extraction.extractedMemberContent ?? [];
  const payload = JSON.stringify({ members, review }).toLowerCase();
  return !/(?:bs\s*en\s*)?iso[\s_-]*\d{3,5}|standard|aql/.test(payload);
}

async function dryRun(manifest: Manifest, root: string, extraction: Map<number, ExtractionRecord>): Promise<Record<string, unknown>> {
  let bytes = 0;
  const counts = { canonical: manifest.file_records.length, availableAndMatched: 0, unavailable: 0, conflicts: 0, extractionMismatches: 0, standardsLicenseGated: 0, archivesHeld: 0, readableExtracted: 0, needsRescan: 0 };
  for (const [index, entry] of manifest.file_records.entries()) {
    if (entry.classification === 'STANDARD') { counts.standardsLicenseGated += 1; continue; }
    const path = await safeSource(root, entry.export_relative_path);
    if (!path) { counts.unavailable += 1; continue; }
    const stat = await lstat(path);
    if (stat.size > MAX_FILE_BYTES || bytes + stat.size > MAX_TOTAL_BYTES) fail('Source collection exceeds configured total byte limits.');
    bytes += stat.size;
    const actual = await hashFile(path);
    if (actual.sha256 !== entry.sha256.toLowerCase() || actual.size !== Number(entry.file_size_bytes)) { counts.conflicts += 1; continue; }
    if (extname(entry.file_name).toLowerCase() === '.zip' && !reviewedArchiveAllowsBytes(extraction.get(index + 1))) { counts.archivesHeld += 1; continue; }
    counts.availableAndMatched += 1;
    const extracted = extraction.get(index + 1);
    if (extracted?.sha256.toLowerCase() !== actual.sha256) counts.extractionMismatches += 1;
    const status = extracted?.sha256.toLowerCase() === actual.sha256 ? extracted.extraction.contentStatus : 'NEEDS_SOURCE_RESCAN';
    if (status === 'EXTRACTED_COMPLETE') counts.readableExtracted += 1;
    if (status === 'NEEDS_SOURCE_RESCAN') counts.needsRescan += 1;
  }
  return { mode: 'DRY_RUN', target: 'NOT CONNECTED', counts, verifiedSourceBytes: bytes, databaseWrites: 0,
    note: 'Dry-run validates local source bytes only. It neither connects to Neon nor claims database persistence.' };
}

async function upsertOccurrence(input: {
  database: Kysely<DatabaseSchema>; batchId: string; manifestSha: string; row: number; entry: SourceEntry;
  state: string; licenseState: string; content: ExtractionRecord | undefined; sha: string; size: number;
  fileId: string | null; objectId: string | null;
}): Promise<string> {
  const { database, batchId, manifestSha, row, entry, state, licenseState, content, sha, size, fileId, objectId } = input;
  const extraction = content?.extraction;
  const extractionStatus = licenseState === 'LICENSE_REVIEW_REQUIRED'
    ? 'LICENSE_CONTENT_NOT_RETAINED'
    : extraction?.contentStatus ?? 'NOT_READ';
  const reviewState = state === 'UNAVAILABLE' ? 'UNAVAILABLE'
    : state === 'SOURCE_CONFLICT' ? 'SOURCE_CONFLICT'
      : extractionStatus === 'NEEDS_SOURCE_RESCAN' ? 'NEEDS_SOURCE_RESCAN'
        : extractionStatus === 'EXTRACTED_COMPLETE' ? 'READABLE'
          : 'PARTIAL';
  const extractedText = licenseState === 'LICENSE_REVIEW_REQUIRED' || entry.classification === 'ARCHIVE'
    ? null : extraction?.text ?? null;
  const contentMetadata = {
    filenameCodeCandidate: entry.document_code_filename || null,
    filenameRevisionCandidate: entry.revision_filename || null,
    sourceTitleCandidate: entry.classification !== 'STANDARD' && extraction?.text
      ? extraction.text.split(/\r?\n/).find((line) => line.trim())?.slice(0, 512) ?? null : null,
    sourceApprovalStatus: entry.content_approval_status || 'NOT_APPROVED',
    documentCodeConfirmed: false,
    revisionConfirmed: false,
    extractionKind: extraction?.kind ?? null,
    archiveMembers: extraction?.kind === 'ZIP' ? extraction.members ?? [] : undefined,
    filenameRevisionCandidateOnly: true,
  };
  const result = await database
    .insertInto('library_source_occurrences')
    .values({
      batch_id: batchId, manifest_row: row, manifest_sha256: manifestSha,
      original_filename: entry.file_name, source_path: entry.export_relative_path,
      source_title: null, classification: entry.classification,
      filename_code: entry.document_code_filename || null, filename_revision: entry.revision_filename || null,
      content_code: null, content_revision: null, review_state: reviewState as never,
      license_state: licenseState as never, sha256: entry.sha256.toLowerCase(), file_size_bytes: Number(entry.file_size_bytes),
      binary_object_id: objectId, file_id: fileId, source_location: null,
      provenance: { manifestRow: row, sourceApprovalStatus: entry.content_approval_status || 'NOT_APPROVED',
        actualSha256: sha, actualSizeBytes: size },
      extracted_text: extractedText, extraction_status: extractionStatus as never, content_metadata: contentMetadata,
    })
    .onConflict((oc) => oc.columns(['manifest_sha256', 'source_path', 'sha256']).doUpdateSet({
      batch_id: batchId, manifest_row: row, review_state: reviewState as never,
      license_state: licenseState as never, file_size_bytes: Number(entry.file_size_bytes),
      binary_object_id: objectId, file_id: fileId, extracted_text: extractedText,
      extraction_status: extractionStatus as never, content_metadata: contentMetadata,
      provenance: { manifestRow: row, sourceApprovalStatus: entry.content_approval_status || 'NOT_APPROVED',
        actualSha256: sha, actualSizeBytes: size },
    }))
    .returning('id')
    .executeTakeFirstOrThrow();
  return result.id;
}

async function verifyDbAndActor(database: Kysely<DatabaseSchema>, options: CliOptions) {
  const actual = await sql<{ database_name: string; role_name: string; version: string }>`
    SELECT current_database() AS database_name, current_user AS role_name,
           current_setting('server_version') AS version
  `.execute(database);
  const row = actual.rows[0];
  if (!row || row.database_name !== options.databaseName || !row.version.startsWith('18.')) fail('Connected database identity or PostgreSQL major version mismatch.');
  const actor = await resolveActor(database, options.actorId!);
  if (!actor || !isNamedSystemOwner(actor)) fail('Import actor must resolve to the active canonical named SYSTEM_OWNER.');
  return { actor, databaseRole: row.role_name, databaseVersion: row.version };
}

async function applyImport(manifest: Manifest, manifestSha: string, options: CliOptions, env: NodeJS.ProcessEnv,
  root: string, extraction: Map<number, ExtractionRecord>): Promise<Record<string, unknown>> {
  assertTarget(options, env);
  const changeReference = safeRef(options.changeReference, 'change-reference');
  const approvalReference = safeRef(options.approvalReference, 'approval-reference');
  const recoveryReference = safeRef(options.recoveryReference, 'recovery-reference');
  if (changeReference !== env.QC_LIBRARY_APPROVED_CHANGE_REFERENCE ||
      approvalReference !== env.QC_LIBRARY_APPROVED_APPROVAL_REFERENCE ||
      recoveryReference !== env.QC_LIBRARY_VERIFIED_RECOVERY_REFERENCE)
    fail('Change, approval, and recovery references must match operator-configured verified staging controls.');
  const connection = env.DATABASE_URL_UNPOOLED!;
  const pool = createPool({ ...getDatabaseConnectionConfig(connection), application_name: 'qc-source-library-import' }) as unknown as Pool;
  const database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) }).withSchema('qc');
  let migrationClient: Awaited<ReturnType<Pool['connect']>> | undefined;
  try {
    const identity = await verifyDbAndActor(database, options);
    migrationClient = await pool.connect();
    await migrationClient.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', ['qc-operations-schema-migrations-v1']);
    await migrationClient.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [`qc-library-import:${manifestSha}`]);
    const migrations = await loadMigrations();
    await verifyMigrationIntegrity(migrationClient, migrations);
    const applied = await migrationClient.query<{ version: string }>(
      'SELECT version FROM qc.schema_migrations ORDER BY version',
    );
    if (migrations.at(-1)?.version !== '0068' || applied.rows.length !== migrations.length ||
        applied.rows.at(-1)?.version !== '0068')
      fail('Exact source migration prefix through 0068 must already be applied on this staging target.');
    const tables = await sql<{ source_table: boolean; alias_table: boolean; search_column: boolean }>`
      SELECT to_regclass('qc.library_source_occurrences') IS NOT NULL AS source_table,
             to_regclass('qc.library_source_aliases') IS NOT NULL AS alias_table,
             EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='qc'
               AND table_name='library_source_occurrences' AND column_name='extracted_text') AS search_column
    `.execute(database);
    if (!tables.rows[0]?.source_table || !tables.rows[0]?.alias_table || !tables.rows[0]?.search_column)
      fail('Migrations 0066 and 0068 must be applied and inspected on this exact staging target before import.');

    const batchExisting = await database.selectFrom('library_import_batches').selectAll()
      .where('manifest_sha256', '=', manifestSha).where('target_project_id', '=', options.projectId!)
      .where('target_branch_id', '=', options.branchId!).where('target_database', '=', options.databaseName!)
      .executeTakeFirst();
    let batchId: string;
    if (batchExisting) {
      if (batchExisting.actor_id !== identity.actor.id || batchExisting.change_reference !== changeReference ||
          batchExisting.approval_reference !== approvalReference || batchExisting.recovery_reference !== recoveryReference)
        fail('Existing import batch has different actor or approval references; refusing to resume it.');
      if (batchExisting.state === 'COMPLETED') return { mode: 'APPLY', state: 'COMPLETED_ALREADY', batchId: batchExisting.id };
      batchId = batchExisting.id;
      await database.updateTable('library_import_batches').set({ state: 'RUNNING', sanitized_error: null, completed_at: null })
        .where('id', '=', batchId).execute();
    } else {
      const inserted = await database.insertInto('library_import_batches').values({
        manifest_sha256: manifestSha, actor_id: identity.actor.id, profile: 'staging',
        target_project_id: options.projectId!, target_branch_id: options.branchId!, target_database: options.databaseName!,
        change_reference: changeReference, approval_reference: approvalReference, recovery_reference: recoveryReference,
        state: 'RUNNING', counters: {}, sanitized_error: null, completed_at: null,
      }).returning('id').executeTakeFirstOrThrow();
      batchId = inserted.id;
    }

    const store = new PostgresByteaObjectStore(database);
    let totalSeenBytes = 0;
    let imported = 0, linkedExisting = 0, missing = 0, conflict = 0, licenseGated = 0, archiveHeld = 0, extractionReview = 0;
    const canonicalFiles = new Map<string, { fileId: string | null; objectId: string | null; source: SourceEntry }>();
    for (const [index, entry] of manifest.file_records.entries()) {
      const rowNo = index + 1;
      let fileId: string | null = null;
      let objectId: string | null = null;
      let sourceState = 'SOURCE_STORED';
      let licenseState = entry.classification === 'STANDARD' ? 'LICENSE_REVIEW_REQUIRED' : 'NOT_APPLICABLE';
      let actualSha = entry.sha256.toLowerCase();
      let actualSize = Number(entry.file_size_bytes);
      const path = await safeSource(root, entry.export_relative_path);
      let sourcePath: string | undefined;
      if (!path) { sourceState = 'UNAVAILABLE'; missing += 1; actualSha = entry.sha256.toLowerCase(); }
      else {
        sourcePath = path;
        const stat = await lstat(path);
        if (stat.size > MAX_FILE_BYTES || totalSeenBytes + stat.size > MAX_TOTAL_BYTES) fail('Source import exceeds configured byte limits.');
        totalSeenBytes += stat.size;
        const actual = await hashFile(path);
        actualSha = actual.sha256; actualSize = actual.size;
        if (actual.sha256 !== entry.sha256.toLowerCase() || actual.size !== Number(entry.file_size_bytes)) {
          sourceState = 'SOURCE_CONFLICT'; conflict += 1;
        }
      }
      const extractionRecord = extraction.get(rowNo);
      const sourceBoundExtraction = extractionRecord?.sha256.toLowerCase() === actualSha ? extractionRecord : undefined;
      const isZip = extname(entry.file_name).toLowerCase() === '.zip';
      const licensed = entry.classification === 'STANDARD';
      const archiveAllowed = isZip && reviewedArchiveAllowsBytes(sourceBoundExtraction) && entry.classification !== 'ARCHIVE';
      const importBytes = Boolean(sourcePath && sourceState === 'SOURCE_STORED' && !licensed && (!isZip || archiveAllowed));
      if (licensed) { sourceState = sourcePath ? 'LICENSE_REVIEW_REQUIRED' : 'UNAVAILABLE'; licenseGated += 1; }
      if (isZip && !archiveAllowed) { sourceState = sourcePath ? 'ARCHIVE_REVIEW_REQUIRED' : 'UNAVAILABLE'; archiveHeld += 1; }
      if (sourceState === 'SOURCE_CONFLICT') conflict += 0;

      const storageKey = `qc-library/${manifestSha}/source-${String(rowNo).padStart(4, '0')}`;
      if (importBytes && sourcePath) {
        const prior = await database.selectFrom('files').select(['id', 'sha256', 'size_bytes', 'storage_provider'])
          .where('storage_key', '=', storageKey).executeTakeFirst();
        if (prior) {
          if (prior.sha256.toLowerCase() !== actualSha || Number(prior.size_bytes) !== actualSize || prior.storage_provider !== store.provider)
            fail(`Existing file metadata conflicts at manifest row ${rowNo}.`);
          fileId = prior.id;
          const object = await database.selectFrom('library_binary_object_keys as k')
            .innerJoin('library_binary_objects as o', 'o.id', 'k.object_id')
            .select(['o.id as object_id']).where('k.storage_key', '=', storageKey)
            .where('o.object_state', '=', 'COMPLETE').where('o.integrity_status', '=', 'VERIFIED').executeTakeFirst();
          objectId = object?.object_id ?? null;
          if (!objectId) fail(`Existing file at manifest row ${rowNo} does not resolve to a verified BYTEA object.`);
          linkedExisting += 1;
        } else {
          await store.putStream(storageKey, { contentType: 'application/octet-stream', sizeBytes: actualSize,
            sha256: actualSha, open: () => streamFile(sourcePath!) });
          const object = await database.selectFrom('library_binary_object_keys as k')
            .innerJoin('library_binary_objects as o', 'o.id', 'k.object_id')
            .select(['o.id as object_id']).where('k.storage_key', '=', storageKey)
            .where('o.object_state', '=', 'COMPLETE').where('o.integrity_status', '=', 'VERIFIED').executeTakeFirstOrThrow();
          objectId = object.object_id;
          fileId = (await database.insertInto('files').values({
            original_filename: basename(entry.file_name), storage_key: storageKey, storage_provider: store.provider,
            mime_type: mimeType(entry.file_name), extension: extname(entry.file_name).replace(/^\./, '') || null,
            size_bytes: actualSize, sha256: actualSha, uploaded_by: identity.actor.id, uploaded_at: new Date(), state: 'ACTIVE',
          }).returning('id').executeTakeFirstOrThrow()).id;
          imported += 1;
        }
      }

      const occurrenceId = await database.transaction().execute(async (trx) => {
        const id = await upsertOccurrence({ database: trx, batchId, manifestSha, row: rowNo, entry,
          state: sourceState, licenseState, content: sourceBoundExtraction, sha: actualSha, size: actualSize, fileId, objectId });
        if (fileId && !sourceState.includes('LICENSE') && !sourceState.includes('ARCHIVE')) {
          const link = await trx.selectFrom('evidence_links').select('id').where('file_id', '=', fileId)
            .where('subject_type', '=', LIBRARY_SUBJECT).where('subject_id', '=', id).executeTakeFirst();
          if (!link) await trx.insertInto('evidence_links').values({ file_id: fileId, subject_type: LIBRARY_SUBJECT,
            subject_id: id, evidence_type: 'SOURCE_ORIGINAL', description: 'Manifest-bound original source file',
            linked_by: identity.actor.id, linked_at: new Date(), removed_at: null, removal_reason: null }).execute();
        }
        return id;
      });
      if (!sourceBoundExtraction || sourceBoundExtraction.extraction.contentStatus === 'NEEDS_SOURCE_RESCAN' ||
          sourceBoundExtraction.extraction.contentStatus === 'EXTRACTION_ERROR') extractionReview += 1;
      canonicalFiles.set(entry.file_name, { fileId, objectId, source: entry });
      void occurrenceId;
    }

    let aliases = 0;
    for (const [index, alias] of manifest.duplicate_aliases.entries()) {
      const canonical = canonicalFiles.get(alias.canonical_filename);
      if (!canonical || alias.sha256.toLowerCase() !== canonical.source.sha256.toLowerCase()) fail(`Alias row ${index + 1} does not resolve to the canonical manifest item.`);
      await database.insertInto('library_source_aliases').values({ batch_id: batchId, manifest_sha256: manifestSha,
        alias_filename: alias.excluded_filename, canonical_filename: alias.canonical_filename,
        sha256: alias.sha256.toLowerCase(), file_id: canonical.fileId, binary_object_id: canonical.objectId,
        provenance: { aliasSourcePath: null, sourcePathReason: 'Exporter alias manifest provides filenames and digest only.' },
      }).onConflict((oc) => oc.columns(['batch_id', 'alias_filename', 'sha256']).doNothing()).execute();
      aliases += 1;
    }

    const state = missing || conflict || licenseGated || archiveHeld || extractionReview ? 'PARTIAL' : 'COMPLETED';
    const counters = { canonicalRows: manifest.file_records.length, objectsImported: imported,
      canonicalFileRowsReused: linkedExisting, unavailable: missing, sourceConflicts: conflict,
      standardsLicenseGated: licenseGated, archivesHeld: archiveHeld, extractionNeedsReview: extractionReview,
      exactDuplicateAliases: aliases, importedOriginalBytes: imported ? 'verified on per-object read-back before COMPLETE' : '0' };
    await database.updateTable('library_import_batches').set({ state, counters, sanitized_error: null, completed_at: new Date() })
      .where('id', '=', batchId).execute();
    return { mode: 'APPLY', state, batchId, target: { profile: 'staging', projectId: options.projectId, branchId: options.branchId,
      database: options.databaseName, postgresVersion: identity.databaseVersion, role: identity.databaseRole }, counters };
  } catch (error) {
    // Raw exception messages can contain target or SQL details. Persist only a stable class.
    const message = error instanceof Error ? error.name : 'UnknownError';
    throw new Error(`Source import stopped safely (${message}).`);
  } finally {
    if (migrationClient) {
      try {
        await migrationClient.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [`qc-library-import:${manifestSha}`]);
        await migrationClient.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', ['qc-operations-schema-migrations-v1']);
      } finally {
        migrationClient.release();
      }
    }
    await database.destroy();
  }
}

export async function runImport(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<Record<string, unknown>> {
  loadLocalEnv(env); loadLocalOperatorEnv(env); loadLocalMigrationEnv(env);
  const options = parseArgs(args);
  if (options.apply) {
    if (options.profile !== 'staging') fail('This importer has no production apply mode.');
    options.projectId = safeRef(options.projectId, 'project-id');
    options.branchId = safeRef(options.branchId, 'branch-id');
    options.databaseName = safeRef(options.databaseName, 'database');
    options.actorId = safeRef(options.actorId, 'actor-id');
  }
  const root = await realpath(options.sourceRoot);
  const manifestPath = resolve(options.manifestPath);
  const sourceRel = relative(root, manifestPath);
  if (!sourceRel || sourceRel.startsWith(`..${sep}`) || isAbsolute(sourceRel)) fail('Manifest must be inside source root.');
  const manifestBytes = await readFile(manifestPath);
  const manifestSha = createHash('sha256').update(manifestBytes).digest('hex');
  const manifest = JSON.parse(manifestBytes.toString('utf8')) as Manifest;
  if (!Array.isArray(manifest.file_records) || manifest.file_records.length > MAX_ENTRIES || !Array.isArray(manifest.duplicate_aliases)) fail('Manifest structure is invalid.');
  const extraction = new Map<number, ExtractionRecord>();
  const extractionText = await readFile(options.extractionPath, 'utf8');
  for (const line of extractionText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const record = JSON.parse(line) as ExtractionRecord;
    if (!Number.isInteger(record.manifestRow) || record.manifestRow < 1 || record.manifestRow > manifest.file_records.length) fail('Extraction row is outside the source manifest.');
    extraction.set(record.manifestRow, record);
  }
  if (extraction.size !== manifest.file_records.length || manifest.file_records.some((entry, index) => {
    const record = extraction.get(index + 1);
    return !record || record.sourcePath !== entry.export_relative_path;
  })) fail('Run read-sources.py for this exact manifest before import.');
  const plan = await dryRun(manifest, root, extraction);
  if (!options.apply) return plan;
  return applyImport(manifest, manifestSha, options, env, root, extraction);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runImport(process.argv.slice(2)).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Import failed.';
    console.error(message); process.exitCode = 1;
  });
}
