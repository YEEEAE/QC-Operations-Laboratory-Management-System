import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { readRecoveryManifest, type RecoveryManifest } from './verify-recovery-manifest.js';

export interface RestoredFilesReport {
  status: 'PASS' | 'FAIL';
  checked: number;
  failures: string[];
}

function safeObjectPath(root: string, storageKey: string): string {
  if (
    !storageKey ||
    storageKey.includes('\\') ||
    storageKey.startsWith('/') ||
    storageKey.includes('\0')
  )
    throw new Error(`Unsafe storage key: ${storageKey}`);
  const rootPath = resolve(root);
  const objectPath = resolve(rootPath, storageKey);
  if (objectPath !== rootPath && !objectPath.startsWith(`${rootPath}/`))
    throw new Error(`Unsafe storage key: ${storageKey}`);
  return objectPath;
}

export async function validateRestoredFiles(
  manifest: RecoveryManifest,
  objectRoot: string,
): Promise<RestoredFilesReport> {
  const failures: string[] = [];
  for (const object of manifest.fileObjects) {
    try {
      const path = safeObjectPath(objectRoot, object.storageKey);
      const [bytes, metadata] = await Promise.all([readFile(path), stat(path)]);
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (metadata.size !== object.sizeBytes) failures.push(`${object.storageKey}: size mismatch`);
      if (digest !== object.sha256.toLowerCase())
        failures.push(`${object.storageKey}: hash mismatch`);
    } catch {
      failures.push(`${object.storageKey}: missing or unreadable object`);
    }
  }
  return {
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    checked: manifest.fileObjects.length,
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifestPath = process.argv[process.argv.indexOf('--manifest') + 1];
  const objectRoot = process.argv[process.argv.indexOf('--object-root') + 1];
  if (!manifestPath || !objectRoot) {
    console.error('Usage: validate-restored-files.ts --manifest <path> --object-root <path>');
    process.exitCode = 2;
  } else
    readRecoveryManifest(manifestPath)
      .then((manifest) => validateRestoredFiles(manifest, objectRoot))
      .then((report) => {
        console.log(JSON.stringify(report));
        if (report.status !== 'PASS') process.exitCode = 1;
      })
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : 'Restored file validation failed.');
        process.exitCode = 1;
      });
}
