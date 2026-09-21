import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { normalizeServerManifest } from '../../../scripts/release/normalize-server-manifest.mjs';

/**
 * QC-100-FINAL-036-B — deterministic build output.
 *
 * Astro emits `server/manifest_<hash>.mjs` and embeds that generated name
 * inside the chunk itself, so the whole server bundle changes identity on every
 * build. The normalizer must rename the chunk and rewrite exactly the
 * references that point at it — and must refuse to touch anything it does not
 * recognise, so a future adapter change cannot be silently corrupted.
 */

const GENERATED = 'manifest_C9AxHDn3.mjs';

function buildServerTree(name: string, files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), `qc-build-${name}-`));
  for (const [relative, content] of Object.entries(files)) {
    const target = join(root, relative);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

const generatedTree = (extra: Record<string, string> = {}) => ({
  'entry.mjs': `import { manifest } from './${GENERATED}';\nexport default manifest;\n`,
  [GENERATED]: `export const manifest = {"\\u0000@astrojs-manifest":"${GENERATED}"};\n`,
  'renderers.mjs': 'export const renderers = [];\n',
  ...extra,
});

describe('QC-100-FINAL-036-B deterministic build output', () => {
  it('renames the generated chunk and rewrites its self-reference and importer', async () => {
    const server = buildServerTree('happy', generatedTree());
    const result = await normalizeServerManifest(server);

    expect(result).toMatchObject({ normalized: true, manifest: 'manifest.mjs', references: 2 });
    expect(result.rewritten).toEqual(['entry.mjs', 'manifest.mjs']);
    expect(readFileSync(join(server, 'entry.mjs'), 'utf8')).toContain("from './manifest.mjs'");
    expect(readFileSync(join(server, 'manifest.mjs'), 'utf8')).toContain(
      '"\\u0000@astrojs-manifest":"manifest.mjs"',
    );
    expect(() => readFileSync(join(server, GENERATED), 'utf8')).toThrow();
  });

  it('is idempotent once the output already carries the stable name', async () => {
    const server = buildServerTree('idempotent', generatedTree());
    await normalizeServerManifest(server);
    const entryBefore = readFileSync(join(server, 'entry.mjs'), 'utf8');

    const second = await normalizeServerManifest(server);
    expect(second).toMatchObject({ normalized: false, references: 0 });
    expect(readFileSync(join(server, 'entry.mjs'), 'utf8')).toBe(entryBefore);
  });

  it('refuses to rewrite a reference from an unexpected file', async () => {
    const server = buildServerTree(
      'unexpected',
      generatedTree({ 'chunks/other.mjs': `export const x = '${GENERATED}';\n` }),
    );
    await expect(normalizeServerManifest(server)).rejects.toThrow(
      /Unexpected reference to manifest_.* in chunks\/other\.mjs/,
    );
  });

  it('refuses to guess when the manifest chunk is missing or ambiguous', async () => {
    const missing = buildServerTree('missing', { 'entry.mjs': 'export default {};\n' });
    await expect(normalizeServerManifest(missing)).rejects.toThrow(/exactly one generated/);

    const ambiguous = buildServerTree('ambiguous', {
      ...generatedTree(),
      'manifest_Other123.mjs': 'export const other = 1;\n',
    });
    await expect(normalizeServerManifest(ambiguous)).rejects.toThrow(/exactly one generated/);
  });

  it('fails closed when the server output directory does not exist', async () => {
    await expect(
      normalizeServerManifest(join(tmpdir(), 'qc-build-does-not-exist')),
    ).rejects.toThrow(/Server build output directory is missing/);
  });
});
