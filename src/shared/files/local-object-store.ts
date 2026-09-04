import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppError } from '../errors/app-error';
import type { ObjectStore, StoredObject } from './object-store';

function safePath(root: string, key: string): string {
  if (!key || key.includes('\\') || key.startsWith('/') || key.includes('\0'))
    throw new AppError('VALIDATION_FAILED');
  const path = resolve(root, key);
  const base = resolve(root) + '/';
  if (!path.startsWith(base)) throw new AppError('VALIDATION_FAILED');
  return path;
}

export class LocalObjectStore implements ObjectStore {
  constructor(
    private readonly root: string,
    environment: 'development' | 'test' | 'production' = 'development',
  ) {
    if (environment === 'production') throw new AppError('SYSTEM_CONFIGURATION_INVALID');
  }

  async put(key: string, object: StoredObject): Promise<void> {
    const path = safePath(this.root, key);
    await mkdir(resolve(path, '..'), { recursive: true });
    await writeFile(path, object.bytes);
    await writeFile(`${path}.content-type`, object.contentType, 'utf8');
  }

  async get(key: string): Promise<StoredObject | undefined> {
    try {
      const path = safePath(this.root, key);
      let contentType = 'application/octet-stream';
      try {
        contentType = (await readFile(`${path}.content-type`, 'utf8')).trim() || contentType;
      } catch {
        /* metadata is optional for old test objects */
      }
      return { bytes: new Uint8Array(await readFile(path)), contentType };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }
}
