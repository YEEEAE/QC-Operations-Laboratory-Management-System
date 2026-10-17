import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { rootRedirectDestination } from '../../../src/shared/identity/session-recovery.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

/** The canonical design manifest in the Stitch handoff (§10.4). */
function designManifest(): string[] {
  const handoff = read('audit/QC-UNIVERSE-STITCH-HANDOFF.md');
  const block = handoff.split('### 10.4 Canonical route manifest')[1].split('```text')[1];
  return block
    .split('```')[0]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/'));
}

describe('design route boundaries', () => {
  it('keeps the two runtime redirects out of the 86-screen design manifest', () => {
    const manifest = designManifest();
    expect(manifest).toHaveLength(86);
    expect(new Set(manifest).size).toBe(86);
    expect(manifest).not.toContain('/');
    expect(manifest).not.toContain('/laboratory');
    expect(manifest).toContain('/404');
    expect(manifest).toContain('/500');
  });

  it('resolves the root redirect through the server session, never a static page', () => {
    expect(read('src/pages/index.astro')).toContain('rootRedirectDestination(');
    expect(rootRedirectDestination(false, undefined)).toBe('/login?returnTo=%2Fdashboard');
    expect(rootRedirectDestination(false, '/quality/capa')).toBe(
      '/login?returnTo=%2Fquality%2Fcapa',
    );
    expect(rootRedirectDestination(false, 'https://attacker.example')).toBe(
      '/login?returnTo=%2Fdashboard',
    );
    expect(rootRedirectDestination(true, '/quality/capa')).toBe('/dashboard');
  });

  it('sends /laboratory to the laboratory register with a server redirect', () => {
    expect(read('src/pages/laboratory/index.astro').trim()).toBe(
      "---\nreturn Astro.redirect('/laboratory/tests');\n---",
    );
  });
});
