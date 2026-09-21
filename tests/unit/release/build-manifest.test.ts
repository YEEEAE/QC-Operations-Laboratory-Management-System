import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * QC-100-FINAL-036-A — reproducible build-artifact manifest.
 *
 * The manifest is the byte-level identity of a build output. Identical trees
 * must produce an identical digest (order-independent), and any added,
 * removed, or changed file must fail verification instead of reporting a
 * reproducible build.
 */

type Run = { status: number; stdout: string; stderr: string };

function run(args: string[]): Run {
  try {
    const stdout = execFileSync('node', ['scripts/release/build-manifest.mjs', ...args], {
      encoding: 'utf8',
      env: process.env,
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; status?: number };
    return {
      status: failure.status ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    };
  }
}

function buildTree(name: string, files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), `qc-manifest-${name}-`));
  for (const [relative, content] of Object.entries(files)) {
    const target = join(root, relative);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, content);
  }
  return root;
}

// Manifests are always stored outside the hashed tree so the evidence file
// itself can never show up as an added artifact.
const manifestPath = (name: string) => join(mkdtempSync(join(tmpdir(), 'qc-manifest-out-')), `${name}.json`);

const baseFiles = {
  'server/entry.mjs': 'console.log("entry");\n',
  'client/assets/app.js': 'export const app = 1;\n',
};

describe('QC-100-FINAL-036-A build manifest reproducibility', () => {
  it('produces an identical digest for two independently written identical trees', () => {
    const first = buildTree('a', baseFiles);
    const second = buildTree('b', { ...baseFiles });
    const firstManifest = manifestPath('first');
    const secondManifest = manifestPath('second');
    run(['--dir', first, '--write', firstManifest]);
    run(['--dir', second, '--write', secondManifest]);
    const left = JSON.parse(readFileSync(firstManifest, 'utf8'));
    const right = JSON.parse(readFileSync(secondManifest, 'utf8'));
    expect(left.files).toEqual(right.files);
    expect(left.digest).toBe(right.digest);
    expect(left.files.map((file: { path: string }) => file.path)).toEqual([
      'client/assets/app.js',
      'server/entry.mjs',
    ]);
  });

  it('detects a changed byte, an added file, and a removed file', () => {
    const original = buildTree('original', baseFiles);
    const manifest = manifestPath('original');
    run(['--dir', original, '--write', manifest]);

    const mutated = buildTree('mutated', {
      'server/entry.mjs': 'console.log("entry changed");\n',
      'client/assets/extra.js': 'export const extra = 1;\n',
    });
    const outcome = run(['--dir', mutated, '--verify', manifest]);
    expect(outcome.status).toBe(1);
    const summary = JSON.parse(outcome.stderr);
    expect(summary.reproducible).toBe(false);
    expect(summary.differences.join(' ')).toContain('changed: server/entry.mjs');
    expect(summary.differences.join(' ')).toContain('added: client/assets/extra.js');
    expect(summary.differences.join(' ')).toContain('missing: ');
  });

  it('reports a reproducible build only when the tree is byte-identical', () => {
    const tree = buildTree('verify', baseFiles);
    const manifest = manifestPath('verify');
    run(['--dir', tree, '--write', manifest]);
    const outcome = run(['--dir', tree, '--verify', manifest]);
    expect(outcome.status).toBe(0);
    expect(JSON.parse(outcome.stdout)).toMatchObject({ reproducible: true, files: 2 });
  });
});
