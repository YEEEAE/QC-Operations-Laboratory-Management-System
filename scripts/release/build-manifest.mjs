/* global console, process */

/**
 * Deterministic build-artifact content manifest (QC-100-FINAL-036-A).
 *
 * Produces a sorted `sha256  <relative-path>` listing for a build output
 * directory (default `dist/`) plus a single digest over the whole listing.
 * Two builds of the same source are byte-reproducible only when their
 * manifests are identical; `--verify` fails closed on any added, removed, or
 * changed file. Paths and hashes only — file contents are never printed.
 *
 * Usage:
 *   node scripts/release/build-manifest.mjs [--dir dist]                print manifest JSON
 *   node scripts/release/build-manifest.mjs [--dir dist] --write file   persist manifest
 *   node scripts/release/build-manifest.mjs [--dir dist] --verify file  compare and fail on drift
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function hashFileTree(rootDirectory) {
  const root = resolve(rootDirectory);
  const paths = (await walk(root)).sort((a, b) => a.localeCompare(b, 'en'));
  const files = [];
  for (const path of paths) {
    const sha256 = createHash('sha256').update(await readFile(path)).digest('hex');
    files.push({ path: relative(root, path).split(sep).join('/'), sha256 });
  }
  const digest = createHash('sha256')
    .update(files.map((file) => `${file.sha256}  ${file.path}`).join('\n'), 'utf8')
    .digest('hex');
  return { root: relative(repositoryRoot, root) || '.', files, digest };
}

export function diffManifests(expected, actual) {
  const expectedByPath = new Map(expected.files.map((file) => [file.path, file.sha256]));
  const actualByPath = new Map(actual.files.map((file) => [file.path, file.sha256]));
  const problems = [];
  for (const [path, sha256] of expectedByPath) {
    if (!actualByPath.has(path)) problems.push(`missing: ${path}`);
    else if (actualByPath.get(path) !== sha256) problems.push(`changed: ${path}`);
  }
  for (const path of actualByPath.keys()) {
    if (!expectedByPath.has(path)) problems.push(`added: ${path}`);
  }
  return problems.sort((a, b) => a.localeCompare(b, 'en'));
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function filterArgs(args) {
  return args.filter((arg) => arg !== '--');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = filterArgs(process.argv.slice(2));
    const directory = valueAfter(args, '--dir') ?? 'dist';
    const writeTarget = valueAfter(args, '--write');
    const verifyTarget = valueAfter(args, '--verify');
    if (writeTarget && verifyTarget) throw new Error('Use either --write or --verify, not both.');

    const manifest = await hashFileTree(resolve(repositoryRoot, directory));
    if (writeTarget) {
      await writeFile(
        resolve(repositoryRoot, writeTarget),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8',
      );
      console.log(
        JSON.stringify({ wrote: writeTarget, files: manifest.files.length, digest: manifest.digest }),
      );
    } else if (verifyTarget) {
      const expected = JSON.parse(
        await readFile(resolve(repositoryRoot, verifyTarget), 'utf8'),
      );
      const problems = diffManifests(expected, manifest);
      if (problems.length > 0) {
        console.error(
          JSON.stringify(
            {
              reproducible: false,
              digest: manifest.digest,
              expectedDigest: expected.digest,
              differences: problems.slice(0, 20),
              totalDifferences: problems.length,
            },
            null,
            2,
          ),
        );
        process.exitCode = 1;
      } else {
        console.log(JSON.stringify({ reproducible: true, files: manifest.files.length, digest: manifest.digest }));
      }
    } else {
      console.log(JSON.stringify({ files: manifest.files.length, digest: manifest.digest }));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to build the artifact manifest.');
    process.exitCode = 1;
  }
}
