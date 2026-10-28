import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

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

interface SourceManifest {
  original_library_items_seen: number;
  files_materialized: number;
  unique_canonical_files: number;
  exact_duplicate_files: number;
  counts_by_category: Record<string, number>;
  file_records: SourceEntry[];
  duplicate_aliases: Array<Record<string, string>>;
  known_untransferred_sources: unknown[];
}

const defaultSourceRoot = resolve(
  process.cwd(),
  'Documents/QC_Library_Source_Import',
);
const defaultOutputRoot = resolve(process.cwd(), '.ci-results/QC-DOC-NEON-360');
const MAX_ENTRIES = 20_000;
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  return `${columns.map(csvCell).join(',')}\n${rows
    .map((row) => columns.map((column) => csvCell(row[column])).join(','))
    .join('\n')}\n`;
}

function csvFields(line: string): string[] {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      result.push(value);
      value = '';
    } else value += char;
  }
  result.push(value);
  return result;
}

function safeRelativePath(value: string): string[] {
  if (!value || value.includes('\\') || value.includes('\0') || isAbsolute(value))
    throw new Error('Manifest path is not a safe relative POSIX path.');
  const parts = value.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..'))
    throw new Error('Manifest path contains an unsafe segment.');
  return parts;
}

async function assertNoSymlink(root: string, parts: string[]): Promise<string> {
  let current = root;
  for (const part of parts) {
    current = resolve(current, part);
    const info = await lstat(current);
    if (info.isSymbolicLink()) throw new Error('Manifest path traverses a symbolic link.');
  }
  const resolved = await realpath(current);
  const relativePath = relative(root, resolved);
  if (!relativePath || relativePath.startsWith(`..${sep}`) || relativePath === '..' || isAbsolute(relativePath))
    throw new Error('Resolved manifest path escapes the source root.');
  return resolved;
}

async function sha256File(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

function filenameStatus(entry: SourceEntry): string {
  return entry.classification === 'STANDARD' ? 'LICENSE_REVIEW_REQUIRED' : 'NOT_REVIEWED';
}

function expectedRoute(entry: SourceEntry): string {
  switch (entry.classification) {
    case 'WORK_INSTRUCTION': return 'CONTROLLED_DOCUMENTS/WORK_INSTRUCTIONS';
    case 'IN_PROCESS': return 'WORK/IN_PROCESS_CONTROL_TEMPLATES';
    case 'STANDARD': return 'CONTROLLED_REFERENCES/STANDARDS';
    case 'TECHNICAL_FILE': return 'CONTROLLED_DOCUMENTS/TECHNICAL_FILES';
    case 'SOP': return 'CONTROLLED_DOCUMENTS/SOP';
    case 'REVIEW': return 'DOCUMENT_REVIEW/CHANGE_REQUESTS';
    case 'OPERATIONAL': return 'OPERATIONAL_EVIDENCE';
    case 'ARCHIVE': return 'OPERATIONAL_EVIDENCE/ARCHIVE_REVIEW';
    default: return 'MANUAL_CLASSIFICATION_REVIEW';
  }
}

function parseArgs(args: string[]): { sourceRoot: string; outputRoot: string; mode: string } {
  let sourceRoot = defaultSourceRoot;
  let outputRoot = defaultOutputRoot;
  let mode = 'scan';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--source-root' && args[i + 1]) sourceRoot = resolve(args[++i]);
    else if (args[i] === '--output-root' && args[i + 1]) outputRoot = resolve(args[++i]);
    else if (args[i] === '--mode' && args[i + 1]) mode = args[++i];
    else throw new Error('Usage: scan-sources.ts [--mode scan|prepare] [--source-root PATH] [--output-root PATH]');
  }
  if (!['scan', 'prepare'].includes(mode)) throw new Error('Mode must be scan or prepare.');
  const allowedOutput = resolve(process.cwd(), '.ci-results');
  const outputRelative = relative(allowedOutput, outputRoot);
  if (outputRelative.startsWith(`..${sep}`) || outputRelative === '..' || isAbsolute(outputRelative))
    throw new Error('Output must remain under the ignored .ci-results directory.');
  return { sourceRoot, outputRoot, mode };
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const sourceRoot = await realpath(options.sourceRoot);
  const manifestPath = resolve(sourceRoot, 'SOURCE_MANIFEST.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as SourceManifest;
  if (!Array.isArray(manifest.file_records) || manifest.file_records.length > MAX_ENTRIES)
    throw new Error('Manifest entry list is missing or exceeds the entry-count limit.');

  const coverage: Array<Record<string, unknown>> = [];
  const contentPlan: Array<Record<string, unknown>> = [];
  const licenseQueue: Array<Record<string, unknown>> = [];
  const seenDigests = new Map<string, string[]>();
  let presentBytes = 0;
  let hashedCount = 0;
  let mismatchCount = 0;
  let missingCount = 0;
  let oversizedCount = 0;
  let unsafeCount = 0;

  for (const [index, entry] of manifest.file_records.entries()) {
    const relativePath = entry.export_relative_path;
    let status = 'UNAVAILABLE';
    let actualSize: number | null = null;
    let actualDigest: string | null = null;
    try {
      const parts = safeRelativePath(relativePath);
      const path = await assertNoSymlink(sourceRoot, parts);
      const info = await lstat(path);
      if (!info.isFile()) throw new Error('Manifest source is not a regular file.');
      actualSize = info.size;
      if (info.size > MAX_FILE_BYTES || presentBytes + info.size > MAX_TOTAL_BYTES) {
        status = 'OVERSIZED_NOT_HASHED';
        oversizedCount += 1;
      } else {
        actualDigest = await sha256File(path);
        presentBytes += info.size;
        hashedCount += 1;
        if (actualDigest !== entry.sha256.toLowerCase() || info.size !== Number(entry.file_size_bytes)) {
          status = 'SOURCE_CONFLICT';
          mismatchCount += 1;
        } else {
          status = entry.classification === 'ARCHIVE' ? 'ARCHIVE_REVIEW_REQUIRED' : 'HASH_VERIFIED_CONTENT_NOT_REVIEWED';
          seenDigests.set(actualDigest, [...(seenDigests.get(actualDigest) ?? []), relativePath]);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source path error.';
      if (message.includes('unsafe') || message.includes('symbolic link') || message.includes('escapes')) {
        status = 'UNSAFE_PATH';
        unsafeCount += 1;
      } else if (message.includes('ENOENT')) {
        status = 'UNAVAILABLE';
        missingCount += 1;
      } else {
        status = 'READ_ERROR';
        unsafeCount += 1;
      }
    }

    const licenseState = filenameStatus(entry);
    coverage.push({
      manifest_row: index + 1,
      original_filename: entry.file_name,
      source_path: relativePath,
      classification: entry.classification,
      suggested_destination: expectedRoute(entry),
      filename_code_candidate: entry.document_code_filename,
      filename_revision_candidate: entry.revision_filename,
      content_confirmed_code: '',
      content_confirmed_revision: '',
      expected_size_bytes: entry.file_size_bytes,
      actual_size_bytes: actualSize,
      expected_sha256: entry.sha256,
      actual_sha256: actualDigest,
      integrity_status: status,
      content_review_status: 'NOT_REVIEWED_BY_SCANNER',
      source_approval_status: entry.content_approval_status,
      license_status: licenseState,
      read_completely_by_codex_in_export: entry.read_completely_by_codex,
    });
    contentPlan.push({
      manifestRow: index + 1,
      sourcePath: relativePath,
      classification: entry.classification,
      suggestedDestination: expectedRoute(entry),
      expectedSha256: entry.sha256,
      integrityStatus: status,
      contentReviewStatus: 'NOT_REVIEWED',
      operationalState: 'SOURCE_REFERENCED_PENDING_REVIEW',
      approvalState: 'NOT_APPROVED',
      licenseState,
      createDigitalTemplate: false,
      activateOrEffect: false,
    });
    if (entry.classification === 'STANDARD')
      licenseQueue.push({
        original_filename: entry.file_name,
        source_path: relativePath,
        edition_candidate: entry.revision_filename,
        sha256: entry.sha256,
        physical_status: status,
        license_state: 'LICENSE_REVIEW_REQUIRED',
        bytes_may_be_stored: false,
      });
  }

  const aliasCsv = await readFile(resolve(sourceRoot, 'DEDUPLICATED_ALIASES.csv'), 'utf8');
  const aliasLines = aliasCsv.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const aliasHeaders = csvFields(aliasLines[0] ?? '');
  const aliasRows = aliasLines.slice(1).map((line) => {
    const fields = csvFields(line);
    return Object.fromEntries(aliasHeaders.map((header, index) => [header, fields[index] ?? '']));
  });

  const revisionFlags = manifest.file_records
    .filter((entry) => /wound\s*drainage/i.test(entry.file_name) && /WI|work instruction/i.test(entry.file_name))
    .map((entry) => ({
      source_path: entry.export_relative_path,
      filename_revision_candidate: entry.revision_filename,
      content_revision: '',
      status: 'SOURCE_REVISION_CONFLICT_REQUIRES_BODY_CONFIRMATION',
      note: 'Export handoff flags a filename Rev.5 versus document-header Rev.4 conflict; this scanner does not resolve it.',
    }));

  const objectGroups = [...seenDigests.entries()].map(([sha256, paths]) => ({
    sha256,
    canonical_path: paths[0],
    aliases_in_manifest: paths.slice(1),
    manifest_occurrences: paths.length,
    physical_verified: true,
    import_state: 'NOT_IMPORTED',
  }));
  const summary = {
    mode: options.mode,
    sourceRoot,
    manifest: {
      originalLibraryItemsSeen: manifest.original_library_items_seen,
      filesMaterialized: manifest.files_materialized,
      uniqueCanonicalFiles: manifest.unique_canonical_files,
      exactDuplicateFiles: manifest.exact_duplicate_files,
      declaredCountsByCategory: manifest.counts_by_category,
    },
    currentScan: {
      manifestRows: manifest.file_records.length,
      sha256Hashed: hashedCount,
      presentBytesHashed: presentBytes,
      unavailable: missingCount,
      mismatches: mismatchCount,
      oversized: oversizedCount,
      unsafeOrReadErrors: unsafeCount,
      physicallyVerifiedUniqueDigests: objectGroups.length,
      duplicateAliasRows: aliasRows.length,
      contentReadStatus: 'NOT REVIEWED — SHA-256 verification does not mean the document body was reviewed',
      isoLicenseReviewRequired: licenseQueue.length,
      actualDatabaseStoredAndVerified: 0,
    },
    targetGate: {
      schemaDeployed: false,
      recoveryReferenceVerified: false,
      migrationSequenceReconciled: true,
      productionProtected: false,
      importAllowed: false,
      blocker: 'PRODUCTION_IMPORT_BLOCKED: no recoverable snapshot is listed for the current unprotected production branch; approved change and license references are not configured.',
    },
    generatedAt: new Date().toISOString(),
  };

  await mkdir(options.outputRoot, { recursive: true });
  const coverageColumns = Object.keys(coverage[0] ?? {});
  await writeFile(resolve(options.outputRoot, 'SOURCE_COVERAGE_MATRIX.csv'), csv(coverage, coverageColumns));
  await writeFile(resolve(options.outputRoot, 'REVISION_CONFLICTS.csv'), csv(revisionFlags, [
    'source_path', 'filename_revision_candidate', 'content_revision', 'status', 'note',
  ]));
  await writeFile(resolve(options.outputRoot, 'DIGITIZATION_PLAN.json'), `${JSON.stringify({
    entries: contentPlan,
    inProcessTemplates: 'DRAFT_ONLY_AFTER_CONTENT_REVIEW; NONE_CREATED_BY_SCANNER',
    quarantineTemplates: 'SOURCE_MISSING_UNLESS_MATCHED_ACTUAL_F-823-T_ORIGINAL_AND_APPROVAL',
    existingCatalogIdentityCount: 194,
    existingDigitizedDraftCount: 13,
    productionImportAllowed: false,
  }, null, 2)}\n`);
  await writeFile(resolve(options.outputRoot, 'CONTENT_ADDRESSING_PLAN.json'), `${JSON.stringify({
    canonicalObjects: objectGroups,
    aliasRows: aliasRows,
    manifestExpectedCanonicalObjects: manifest.unique_canonical_files,
    verifiedCanonicalObjects: objectGroups.length,
  }, null, 2)}\n`);
  await writeFile(resolve(options.outputRoot, 'LICENSE_REVIEW_QUEUE.csv'), csv(licenseQueue, [
    'original_filename', 'source_path', 'edition_candidate', 'sha256', 'physical_status', 'license_state', 'bytes_may_be_stored',
  ]));
  await writeFile(resolve(options.outputRoot, 'scan-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url) || basename(invokedPath) === 'scan-sources.ts') {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Source scan failed.';
    console.error(`QC source scan failed: ${message}`);
    process.exitCode = 1;
  });
}
