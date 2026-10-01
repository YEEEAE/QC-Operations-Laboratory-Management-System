import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';

export interface DocumentSourceDigestFile {
  fileId: string;
  fileRole: string;
  sha256: string;
}

/** Create a server-derived digest binding the document, revision, and exact source files. */
export function documentContentDigest(input: {
  documentId: string;
  revision: string;
  files: readonly DocumentSourceDigestFile[];
}): string {
  const revision = input.revision.trim();
  if (!revision || input.files.length === 0) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { files: ['select at least one approved source file'] },
    });
  }

  const files = input.files
    .map((file) => {
      const fileRole = file.fileRole.trim();
      if (!file.fileId || !fileRole || !/^[0-9a-f]{64}$/i.test(file.sha256)) {
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      }
      return { fileId: file.fileId, fileRole, sha256: file.sha256.toLowerCase() };
    })
    .sort((left, right) => {
      const fileIdOrder = left.fileId < right.fileId ? -1 : left.fileId > right.fileId ? 1 : 0;
      return fileIdOrder || (left.fileRole < right.fileRole ? -1 : left.fileRole > right.fileRole ? 1 : 0);
    });

  if (new Set(files.map((file) => file.fileId)).size !== files.length) {
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { files: ['a source file can only be selected once'] },
    });
  }

  return createHash('sha256')
    .update(
      JSON.stringify({
        schema: 'qc.controlled-document-content.v1',
        documentId: input.documentId,
        revision,
        files,
      }),
    )
    .digest('hex');
}
