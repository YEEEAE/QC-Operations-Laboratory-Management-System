import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

const SCOPED_INLINE_PROPS = new Set(['--bar-size', '--legend-color']);

describe('design token contract (Prompt 1)', () => {
  it('defines status success/error aliases instead of consuming undefined tokens', () => {
    const tokens = read('src/ui/styles/tokens.css');
    expect(tokens).toContain('--status-success:');
    expect(tokens).toContain('--status-error:');
    expect(tokens).toContain('--status-pass');
    expect(tokens).toContain('--status-danger');
  });

  it('keeps PASS and RELEASED as distinct visual tokens', () => {
    const tokens = read('src/ui/styles/tokens.css');
    const pass = tokens.match(/--status-pass:\s*(#[0-9a-fA-F]{6})/)?.[1];
    const released = tokens.match(/--status-released:\s*(#[0-9a-fA-F]{6})/)?.[1];
    expect(pass).toBeTruthy();
    expect(released).toBeTruthy();
    expect(pass!.toLowerCase()).not.toBe(released!.toLowerCase());
  });

  it('consumes no undefined global custom properties outside scoped inline props', () => {
    const defined = new Set<string>(
      [...read('src/ui/styles/tokens.css').matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]),
    );
    for (const file of [
      'src/ui/styles/global.css',
      'src/ui/styles/density.css',
      'src/ui/styles/motion.css',
    ]) {
      try {
        for (const m of read(file).matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
      } catch {
        // Optional style layers may not exist in every checkout.
      }
    }
    const consumers = [
      'src/pages/dashboard/index.astro',
      'src/pages/login.astro',
      'src/pages/system/health.astro',
      'src/pages/system/backups/index.astro',
      'src/ui/shell/Topbar.astro',
      'src/ui/shell/Sidebar.astro',
      'src/ui/components/StatusBadge.astro',
      'src/ui/components/FormErrorSummary.astro',
    ];
    const missing: string[] = [];
    for (const file of consumers) {
      const source = read(file);
      for (const m of source.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!defined.has(m[1]) && !SCOPED_INLINE_PROPS.has(m[1])) missing.push(`${file}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps the dashboard on the universal topbar instead of replacing it', () => {
    expect(read('src/pages/dashboard/index.astro')).not.toContain('slot="topbar"');
  });

  it('exposes a linked error list contract in the form error summary', () => {
    const summary = read('src/ui/components/FormErrorSummary.astro');
    expect(summary).toContain('errors?:');
    expect(summary).toContain('fieldId');
    expect(summary).toContain('href={`#${item.fieldId}`}');
  });

  it('never renders a false zero badge for unavailable counts', () => {
    const topbar = read('src/ui/shell/Topbar.astro');
    expect(topbar).not.toContain('approvalCount = 0');
    expect(topbar).not.toContain('notificationCount = 0');
    expect(topbar).toContain("typeof approvalCount === 'number'");
    expect(topbar).toContain("typeof notificationCount === 'number'");
  });

  it('keeps zoom enabled through the viewport contract', () => {
    const layout = read('src/ui/layouts/BaseLayout.astro');
    expect(layout).toContain('width=device-width, initial-scale=1');
    expect(layout).not.toContain('maximum-scale=1');
    expect(layout).not.toContain('user-scalable=no');
  });
});
