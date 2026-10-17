import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dashboard = readFileSync(new URL('../../../src/pages/dashboard/index.astro', import.meta.url), 'utf8');
const presentation = dashboard.split('/* CA-P-DASHBOARD:')[1] ?? '';

describe('CAPA A local dashboard overview', () => {
  it('contains the presentation without changing the workspace shell', () => {
    expect(presentation).toContain('.decision-room');
    expect(presentation).not.toMatch(/\.app-sidebar|\.sidebar|\.app-shell|\.app-topbar/);
    expect(dashboard).not.toContain('<script');
    expect(dashboard).not.toContain('slot="sidebar"');
  });

  it('lets narrow panels and nested metric grids shrink without hiding content', () => {
    expect(presentation).toContain('minmax(min(100%,15rem),1fr)');
    expect(presentation).toContain('minmax(min(100%,14rem),1fr)');
    expect(presentation).toContain('min-inline-size:0');
    expect(presentation).not.toMatch(/overflow\s*:\s*hidden|display\s*:\s*none/);
  });

  it('keeps interactive links and disclosures at a readable target floor', () => {
    expect(presentation).toContain('.decision-room a { min-inline-size:44px; }');
    expect(presentation).toMatch(/\.decision-room summary\s*\{[^}]*min-block-size:44px/);
    expect(presentation).toContain(':focus-visible');
    expect(presentation).toContain('outline-color:Highlight');
  });

  it('keeps the visible flow/chart order the same as reading order', () => {
    expect(presentation).toContain('.main-column :global(.chart),.main-column .series-state { order:0; }');
    expect(dashboard).not.toContain('order:-1');
    expect(presentation).not.toContain('perspective(');
    expect(presentation).toContain('@media print');
  });
});
