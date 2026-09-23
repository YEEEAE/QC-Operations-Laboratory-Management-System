import { AppError } from '../errors/app-error';
import { uuidv7 } from '../id/uuid';
import { withSpan, recordCounter } from '../observability/telemetry';
import type { EvidenceLink, FileRecord, FileUploadInput } from './file-record';
import type { FileRepository } from './file-repository';
import type { ObjectStore } from './object-store';
import { sha256 } from './sha256';

const EXECUTABLE_FILENAME_EXTENSION =
  /\.(?:ade|adp|app|bat|cmd|com|cpl|exe|gadget|hta|inf|ins|isp|jar|jse|lib|lnk|mde|msc|msi|msp|mst|pif|ps1|reg|scr|sct|sh|sys|vb|vbe|vbs|wsc|wsf|wsh)$/i;
const MIME_TYPE =
  /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(?:;\s*charset=[a-z0-9._-]+)?$/i;
const SAFE_EXTENSION = /^[a-z0-9]{1,10}$/i;
export interface FileSecurityPolicy {
  /** Explicitly approved MIME allowlist for the target evidence type. */
  allowedMimeTypes: readonly string[];
  /** Explicitly approved maximum for the target evidence type. */
  maxSizeBytes: number;
  /** Must fail closed when the configured scanner is unavailable. */
  scan(bytes: Uint8Array, mimeType: string): Promise<'CLEAN' | 'MALICIOUS'>;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function sniffKnownMimeType(bytes: Uint8Array): string | undefined {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (startsWith(bytes, [0x4d, 0x5a])) return 'application/x-executable';
  return undefined;
}

function isPlainText(bytes: Uint8Array): boolean {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Plain text may contain tab/newline controls, but not binary control bytes.
    // eslint-disable-next-line no-control-regex
    return !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text);
  } catch {
    return false;
  }
}

function assertSafeFileUpload(input: FileUploadInput, policy: FileSecurityPolicy): void {
  const filename = input.originalFilename.trim();
  const extension = input.extension?.trim().replace(/^\./, '');
  if (
    !filename ||
    filename === '.' ||
    filename === '..' ||
    filename.length > 255 ||
    // Rejecting C0/DEL control characters is the intent of this check, so the
    // control-character range is deliberate (not an accidental literal).
    // eslint-disable-next-line no-control-regex
    /[\\/\0\r\n\u0000-\u001f\u007f]/.test(filename) ||
    EXECUTABLE_FILENAME_EXTENSION.test(filename) ||
    !MIME_TYPE.test(input.mimeType) ||
    !Number.isSafeInteger(policy.maxSizeBytes) ||
    policy.maxSizeBytes <= 0 ||
    input.bytes.byteLength > policy.maxSizeBytes ||
    !policy.allowedMimeTypes.includes(input.mimeType) ||
    (extension !== undefined &&
      (!SAFE_EXTENSION.test(extension) ||
        (filename.includes('.') &&
          filename.split('.').at(-1)?.toLowerCase() !== extension.toLowerCase())))
  ) {
    throw new AppError('VALIDATION_FAILED');
  }

  // Compare a known content signature to the declaration even when a malicious
  // client declares a more permissive allowed type such as text/plain.
  const detectedMimeType = sniffKnownMimeType(input.bytes);
  if (detectedMimeType === 'application/x-executable') throw new AppError('VALIDATION_FAILED');
  if (detectedMimeType && detectedMimeType !== input.mimeType)
    throw new AppError('VALIDATION_FAILED');
  if (input.mimeType === 'text/plain' && !isPlainText(input.bytes))
    throw new AppError('VALIDATION_FAILED');

  // Validate a client-declared type whenever that format has an unambiguous
  // signature. The policy's MIME allowlist remains required.
  const expectedSignature =
    input.mimeType === 'application/pdf'
      ? [0x25, 0x50, 0x44, 0x46, 0x2d]
      : input.mimeType === 'image/png'
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        : input.mimeType === 'image/jpeg'
          ? [0xff, 0xd8, 0xff]
          : input.mimeType === 'image/gif'
            ? [0x47, 0x49, 0x46, 0x38]
            : undefined;
  if (expectedSignature && !startsWith(input.bytes, expectedSignature))
    throw new AppError('VALIDATION_FAILED');
}

export type FileAccessAuthorizer = (input: {
  action: 'UPLOAD' | 'VIEW' | 'DOWNLOAD';
  actorId: string;
  subjectType: string;
  subjectId: string;
}) => Promise<void>;

/**
 * File/evidence service with bounded telemetry (OBSERVABILITY-ARCHITECTURE
 * §42/§43): operation/outcome counters only — never filenames, subject ids,
 * or content details.
 */
export class FileService {
  constructor(
    private readonly repository: FileRepository,
    private readonly store: ObjectStore,
    private readonly authorizeAccess: FileAccessAuthorizer,
    private readonly securityPolicy?: FileSecurityPolicy,
  ) {}

  async upload(input: FileUploadInput): Promise<{ file: FileRecord; evidence: EvidenceLink }> {
    return withSpan(
      'file.upload',
      async (span) => {
        try {
          const result = await this.uploadInner(input);
          recordCounter('qc_file_operations_total', 1, {
            domain: 'files',
            operation: 'upload',
            outcome: 'success',
          });
          return result;
        } catch (error) {
          recordCounter('qc_file_operations_total', 1, {
            domain: 'files',
            operation: 'upload',
            outcome: 'error',
          });
          span.setAttribute(
            'error_family',
            error instanceof AppError ? error.code : 'INTERNAL_ERROR',
          );
          throw error;
        }
      },
      { domain: 'files', operation: 'upload' },
    );
  }

  private async uploadInner(
    input: FileUploadInput,
  ): Promise<{ file: FileRecord; evidence: EvidenceLink }> {
    await this.authorizeAccess({
      action: 'UPLOAD',
      actorId: input.uploadedBy,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
    });
    if (!this.securityPolicy) throw new AppError('POLICY_SOURCE_REQUIRED');
    assertSafeFileUpload(input, this.securityPolicy);
    if ((await this.securityPolicy.scan(input.bytes, input.mimeType)) !== 'CLEAN')
      throw new AppError('VALIDATION_FAILED');
    const digest = sha256(input.bytes);
    const fileId = uuidv7();
    const storageKey = `files/${fileId}`;
    await this.store.put(storageKey, { bytes: input.bytes, contentType: input.mimeType });
    const file: FileRecord = {
      id: fileId,
      originalFilename: input.originalFilename,
      storageKey,
      storageProvider: 'OBJECT_STORE',
      mimeType: input.mimeType,
      ...(input.extension ? { extension: input.extension } : {}),
      sizeBytes: input.bytes.byteLength,
      sha256: digest,
      uploadedBy: input.uploadedBy,
      uploadedAt: new Date(),
      state: 'ACTIVE',
    };
    const evidence: EvidenceLink = {
      id: uuidv7(),
      fileId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ...(input.evidenceType ? { evidenceType: input.evidenceType } : {}),
      ...(input.description ? { description: input.description } : {}),
      linkedBy: input.uploadedBy,
      linkedAt: new Date(),
    };
    try {
      await this.repository.createWithEvidence(file, evidence);
    } catch (error) {
      // The object is private and has no committed metadata/link yet. Attempt
      // compensation without hiding the original database failure.
      try {
        await this.store.delete(storageKey);
      } catch (cleanupError) {
        // Preserve both failures so an orphan cannot be mistaken for a fully
        // handled rollback. The caller still receives a sanitized boundary error.
        throw new AggregateError(
          [error, cleanupError],
          'File persistence failed and temporary object cleanup also failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
    return { file, evidence };
  }

  private async download(
    actorId: string,
    link: EvidenceLink,
  ): Promise<{ file: FileRecord; object: { bytes: Uint8Array; contentType: string } }> {
    return withSpan(
      'file.download',
      async (span) => {
        try {
          const result = await this.downloadInner(actorId, link);
          recordCounter('qc_file_operations_total', 1, {
            domain: 'files',
            operation: 'download',
            outcome: 'success',
          });
          return result;
        } catch (error) {
          recordCounter('qc_file_operations_total', 1, {
            domain: 'files',
            operation: 'download',
            outcome: 'error',
          });
          span.setAttribute(
            'error_family',
            error instanceof AppError ? error.code : 'INTERNAL_ERROR',
          );
          throw error;
        }
      },
      { domain: 'files', operation: 'download' },
    );
  }

  /**
   * Resolve the evidence link from the repository before authorizing and
   * reading the object. Callers must provide an opaque link id, never a
   * client-shaped subject/file pair, to prevent object substitution.
   */
  async downloadByEvidenceId(
    actorId: string,
    evidenceId: string,
  ): Promise<{ file: FileRecord; object: { bytes: Uint8Array; contentType: string } }> {
    const link = await this.repository.findEvidence(evidenceId);
    if (!link || link.removedAt) throw new AppError('RESOURCE_NOT_FOUND');
    return this.download(actorId, link);
  }

  private async downloadInner(
    actorId: string,
    link: EvidenceLink,
  ): Promise<{ file: FileRecord; object: { bytes: Uint8Array; contentType: string } }> {
    await this.authorizeAccess({
      action: 'DOWNLOAD',
      actorId,
      subjectType: link.subjectType,
      subjectId: link.subjectId,
    });
    const file = await this.repository.findById(link.fileId);
    if (!file || file.state !== 'ACTIVE') throw new AppError('RESOURCE_NOT_FOUND');
    const object = await this.store.get(file.storageKey);
    if (!object) throw new AppError('RESOURCE_NOT_FOUND');
    if (
      object.bytes.byteLength !== file.sizeBytes ||
      object.contentType !== file.mimeType ||
      sha256(object.bytes) !== file.sha256
    )
      throw new AppError('VALIDATION_FAILED');
    return { file, object: { bytes: object.bytes, contentType: file.mimeType } };
  }
}
