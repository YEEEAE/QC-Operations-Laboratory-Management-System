/* global console, process */

/**
 * Deterministic server-manifest normalization (QC-100-FINAL-036-B).
 *
 * Astro emits the SSR manifest as `manifest_<rollup-hash>.mjs` and embeds that
 * same generated file name inside the chunk's own asset map. The chunk
 * therefore contains its own name, whose value is derived from the chunk's
 * hash — a fixed point that resolves differently between two otherwise
 * byte-identical builds. `entry.mjs` imports the chunk, so the whole server
 * bundle changes identity on every build and DEP-003 ("build once, promote the
 * same artifact") cannot be proven.
 *
 * This module renames the generated chunk to a stable `manifest.mjs` and
 * rewrites only the references that point at it, then fails closed if the
 * reference set is anything other than the expected one. Nothing else in the
 * output is modified or reordered, so the digest of the build tree becomes a
 * function of the source alone.
 *
 * It is intentionally idempotent: a tree that already carries the stable name
 * is left untouched.
 */

import { readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GENERATED_MANIFEST_CHUNK = /^manifest_[A-Za-z0-9_-]{1,64}\.mjs$/;
const STABLE_MANIFEST_FILE = 'manifest.mjs';

// Only these server outputs may legitimately reference the generated chunk.
// Anything else is reported instead of rewritten, so a future Astro/adapter
// change can never be silently corrupted by this normalizer.
const EXPECTED_REFERRERS = ['entry.mjs'];

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

const toPosix = (path) => path.split(sep).join('/');

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}

/**
 * @param {string} serverDirectory Absolute path of the Astro server build output.
 * @returns {Promise<{normalized: boolean, manifest: string, rewritten: string[], references: number}>}
 */
export async function normalizeServerManifest(serverDirectory) {
  const directory = resolve(serverDirectory);

  let serverEntries;
  try {
    serverEntries = await readdir(directory);
  } catch {
    throw new Error('Server build output directory is missing.');
  }

  const generatedChunks = serverEntries.filter((name) => GENERATED_MANIFEST_CHUNK.test(name));
  const hasStableManifest = serverEntries.includes(STABLE_MANIFEST_FILE);

  if (generatedChunks.length === 0 && hasStableManifest)
    return { normalized: false, manifest: STABLE_MANIFEST_FILE, rewritten: [], references: 0 };
  if (generatedChunks.length !== 1)
    throw new Error(
      `Expected exactly one generated Astro server manifest chunk, found ${generatedChunks.length}. Refusing to guess.`,
    );
  if (hasStableManifest)
    throw new Error(
      `Both ${generatedChunks[0]} and ${STABLE_MANIFEST_FILE} exist in the server output; refusing to overwrite.`,
    );

  const generatedName = generatedChunks[0];
  const allowedReferrers = new Set([...EXPECTED_REFERRERS, generatedName]);

  const files = await walk(directory);
  const referrers = [];
  let references = 0;
  for (const file of files) {
    const relativePath = toPosix(relative(directory, file));
    const source = await readFile(file, 'utf8');
    const found = countOccurrences(source, generatedName);
    if (found === 0) continue;
    references += found;
    if (!allowedReferrers.has(relativePath))
      throw new Error(
        `Unexpected reference to ${generatedName} in ${relativePath}; refusing to rewrite unverified build output.`,
      );
    referrers.push({ path: file, relativePath });
  }

  if (referrers.length === 0)
    throw new Error(
      `Generated manifest chunk ${generatedName} is not referenced anywhere; refusing to rename it.`,
    );

  const stablePath = resolve(directory, STABLE_MANIFEST_FILE);
  const generatedPath = resolve(directory, generatedName);
  const stats = await stat(generatedPath);
  if (!stats.isFile()) throw new Error(`${generatedName} is not a regular file.`);

  // Rewrite references first (including the chunk's own self-reference), then
  // rename, so no reader ever sees a dangling file name.
  const rewritten = [];
  for (const referrer of referrers) {
    const source = await readFile(referrer.path, 'utf8');
    const next = source.split(generatedName).join(STABLE_MANIFEST_FILE);
    if (next !== source) {
      await writeFile(referrer.path, next, 'utf8');
      rewritten.push(
        referrer.relativePath === generatedName ? STABLE_MANIFEST_FILE : referrer.relativePath,
      );
    }
  }
  await rename(generatedPath, stablePath);

  return {
    normalized: true,
    manifest: STABLE_MANIFEST_FILE,
    rewritten: rewritten.sort(),
    references,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2] ?? 'dist/server';
  normalizeServerManifest(directory)
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error) => {
      console.error(
        error instanceof Error ? error.message : 'Unable to normalize the server manifest.',
      );
      process.exitCode = 1;
    });
}
