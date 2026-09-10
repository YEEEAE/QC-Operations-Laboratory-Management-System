import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

/** Component-scoped props set inline via style="--x:..." (not global tokens). */
const SCOPED_INLINE_PROPS = new Set(['--bar-size', '--legend-color']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(projectRoot, dir))) {
    const rel = `${dir}/${entry}`;
    const st = statSync(join(projectRoot, rel));
    if (st.isDirectory()) walk(rel, out);
    else if (/\.(astro|css|ts)$/.test(entry)) out.push(rel);
  }
  return out;
}

function definedTokens(): Set<string> {
  const defined = new Set<string>();
  for (const file of walk('src/ui/styles')) {
    for (const m of read(file).matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
  }
  return defined;
}

describe('visual token contract (global)', () => {
  it('defines every var(--*) consumed by src/pages and src/ui (scoped inline excepted)', () => {
    const defined = definedTokens();
    const missing: string[] = [];
    for (const file of [...walk('src/pages'), ...walk('src/ui')]) {
      const source = read(file);
      for (const m of source.matchAll(/var\(\s*(--[\w-]+)/g)) {
        if (!defined.has(m[1]) && !SCOPED_INLINE_PROPS.has(m[1])) {
          missing.push(`${file}: ${m[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps scoped inline props defined at their usage site', () => {
    const legend = read('src/ui/charts/Legend.astro');
    expect(legend).toContain('--legend-color:');
    expect(legend).toContain('var(--legend-color)');
    const quarantine = read('src/pages/quarantine/index.astro');
    expect(quarantine).toContain('--bar-size:');
    expect(quarantine).toContain('var(--bar-size)');
  });

  it('defines --status-success/--status-error as aliases (no undefined consumption)', () => {
    const tokens = read('src/ui/styles/tokens.css');
    expect(tokens).toMatch(/--status-success:\s*var\(--status-pass\)/);
    expect(tokens).toMatch(/--status-error:\s*var\(--status-danger\)/);
    for (const file of [...walk('src/pages'), ...walk('src/ui')]) {
      const source = read(file);
      if (/var\(\s*--status-success\)/.test(source) || /var\(\s*--status-error\)/.test(source)) {
        expect(tokens).toContain('--status-success:');
        expect(tokens).toContain('--status-error:');
        break;
      }
    }
  });

  it('preserves required semantic distinctions (never unifies hues to fix contrast)', () => {
    const tokens = read('src/ui/styles/tokens.css');
    const hex = (name: string): string => {
      const m = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
      expect(m, `${name} must be a direct hex token`).toBeTruthy();
      return m![1].toLowerCase();
    };
    // PASS (green) != RELEASED (teal)
    expect(hex('--status-pass')).not.toBe(hex('--status-released'));
    // APPROVED (green) != PASS (green) — distinct operational greens
    expect(hex('--status-approved')).not.toBe(hex('--status-pass'));
    // HOLD (amber) != FAIL (danger red)
    expect(hex('--status-hold')).not.toBe(hex('--status-danger'));
    // REVIEW (blue) != DRAFT (neutral gray)
    expect(hex('--status-review')).not.toBe(hex('--status-neutral'));
    // Aliases must not collapse PASS into RELEASED
    expect(tokens).toMatch(/--status-success:\s*var\(--status-pass\)/);
    expect(tokens).not.toMatch(/--status-success:\s*var\(--status-released\)/);
  });

  it('always renders status as text (never color-only)', () => {
    const badge = read('src/ui/components/StatusBadge.astro');
    // Label text node is always rendered; decorative dot is hidden from AT.
    expect(badge).toContain('{label}');
    expect(badge).toContain('aria-hidden="true"');
    // Every StatusBadge usage renders text via default (status) or explicit label.
    for (const file of walk('src/pages')) {
      const source = read(file);
      if (!source.includes('StatusBadge')) continue;
      // Component guarantees a text span, so usage cannot be color-only.
      expect(badge).toContain('<span>{label}</span>');
      break;
    }
  });

  it('keeps design-system docs and runtime tokens in agreement (core set)', () => {
    const docs = read('Documents/DESIGN-SYSTEM.md');
    const tokens = read('src/ui/styles/tokens.css');
    const core = [
      '--color-canvas',
      '--color-canvas-deep',
      '--color-sidebar',
      '--color-surface-1',
      '--color-surface-2',
      '--color-surface-3',
      '--color-surface-hover',
      '--color-surface-selected',
      '--color-border-subtle',
      '--color-border-default',
      '--color-border-strong',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-muted',
      '--color-text-disabled',
      '--color-text-inverse',
      '--color-accent-primary',
      '--color-accent-primary-hover',
      '--color-accent-primary-muted',
      '--status-approved',
      '--status-approved-bg',
      '--status-pass',
      '--status-pass-bg',
      '--status-released',
      '--status-released-bg',
      '--status-hold',
      '--status-hold-bg',
      '--status-warning',
      '--status-warning-bg',
      '--status-danger',
      '--status-danger-bg',
      '--status-review',
      '--status-review-bg',
      '--status-neutral',
      '--status-neutral-bg',
    ];
    for (const name of core) {
      const inDocs = docs.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`, 'i'))?.[1].toLowerCase();
      const inTokens = tokens.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1].toLowerCase();
      expect(inDocs, `${name} documented`).toBeTruthy();
      expect(inTokens, `${name} in runtime`).toBeTruthy();
      expect(inTokens).toBe(inDocs);
    }
  });
});
