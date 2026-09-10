import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const tokensCss = readFileSync(join(projectRoot, 'src/ui/styles/tokens.css'), 'utf8');

function rawToken(name: string): string {
  const m = tokensCss.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  if (!m) throw new Error(`token not found: ${name}`);
  return m[1].trim();
}

/** Resolve var(--x) chains to a final #hex (supports one level of aliasing used here). */
function resolveHex(name: string, depth = 0): string {
  if (depth > 5) throw new Error(`alias cycle at ${name}`);
  const raw = rawToken(name);
  const varMatch = raw.match(/var\(\s*(--[\w-]+)\s*\)/);
  if (varMatch) return resolveHex(varMatch[1], depth + 1);
  const hex = raw.match(/#[0-9a-fA-F]{6}/)?.[0].toLowerCase();
  if (!hex) throw new Error(`token ${name} does not resolve to hex (got: ${raw})`);
  return hex;
}

function channel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(fgToken: string, bgToken: string): number {
  const l1 = luminance(resolveHex(fgToken));
  const l2 = luminance(resolveHex(bgToken));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function hexContrast(fgHex: string, bgHex: string): number {
  const l1 = luminance(fgHex.toLowerCase());
  const l2 = luminance(bgHex.toLowerCase());
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('visual contrast contract (WCAG 2.2 AA, live token values)', () => {
  // Verified PASS pairs guard against future palette regressions.
  // Thresholds: normal text >= 4.5:1; focus/non-text boundaries >= 3:1.
  it.each([
    ['body primary on page', '--text-primary', '--surface-page', 4.5],
    ['body primary on panel', '--text-primary', '--surface-panel', 4.5],
    ['body primary on raised', '--text-primary', '--surface-raised', 4.5],
    ['secondary on page', '--text-secondary', '--surface-page', 4.5],
    ['secondary on panel', '--text-secondary', '--surface-panel', 4.5],
    ['secondary on raised', '--text-secondary', '--surface-raised', 4.5],
    ['muted eyebrow/hint on page', '--text-muted', '--surface-page', 4.5],
    ['muted hint on panel', '--text-muted', '--surface-panel', 4.5],
    ['link on page', '--color-accent-primary-hover', '--surface-page', 4.5],
    ['link on panel', '--color-accent-primary-hover', '--surface-panel', 4.5],
    ['link on raised', '--color-accent-primary-hover', '--surface-raised', 4.5],
    ['badge pass', '--status-pass', '--status-pass-bg', 4.5],
    ['badge approved', '--status-approved', '--status-approved-bg', 4.5],
    ['badge hold', '--status-hold', '--status-hold-bg', 4.5],
    ['badge warning', '--status-warning', '--status-warning-bg', 4.5],
    ['pill ok (success) on panel', '--status-success', '--surface-panel', 4.5],
    ['pill warn on panel', '--status-warning', '--surface-panel', 4.5],
    ['pill unknown (muted) on panel', '--text-muted', '--surface-panel', 4.5],
    ['primary Button inverse on accent', '--color-text-inverse', '--color-accent-primary', 4.5],
    ['secondary button primary on raised', '--text-primary', '--surface-raised', 4.5],
    ['ghost link on panel', '--color-accent-primary-hover', '--surface-panel', 4.5],
    ['controlled button primary on review-bg', '--text-primary', '--status-review-bg', 4.5],
    ['error summary primary on danger-bg', '--text-primary', '--status-danger-bg', 4.5],
    ['input text primary on raised', '--text-primary', '--surface-raised', 4.5],
  ])('%s meets %s:1', (_label, fg, bg, threshold) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(threshold);
  });

  it.each([
    ['focus ring on page', '--focus-ring', '--surface-page'],
    ['focus ring on panel', '--focus-ring', '--surface-panel'],
    ['focus ring on raised', '--focus-ring', '--surface-raised'],
  ])('%s meets non-text 3:1', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3.0);
  });

  // Known gaps pinned at current live values: each documents a real rendered
  // combination that needs an explicit owner palette decision. Do NOT fix by
  // unifying hues (PASS != RELEASED etc. must stay distinct) and do NOT claim
  // PASS. When the owner approves a palette fix, update the pinned expectation.
  it('documents known normal-text gaps requiring owner palette decision (do not unify hues)', () => {
    const gaps: Array<[string, string, string]> = [
      ['muted hint/preview dt on raised', '--text-muted', '--surface-raised'],
      ['field error danger on panel', '--status-danger', '--surface-panel'],
      ['field error danger on raised', '--status-danger', '--surface-raised'],
      ['badge released (teal)', '--status-released', '--status-released-bg'],
      ['badge danger', '--status-danger', '--status-danger-bg'],
      ['badge review (blue)', '--status-review', '--status-review-bg'],
      ['badge neutral (gray)', '--status-neutral', '--status-neutral-bg'],
      ['pill bad (error) on panel', '--status-error', '--surface-panel'],
      ['danger button danger on danger-bg', '--status-danger', '--status-danger-bg'],
    ];
    for (const [label, fg, bg] of gaps) {
      const ratio = contrast(fg, bg);
      // Pinned as below 4.5:1 at current approved palette — visible FAIL, not PASS.
      expect(ratio, `${label}: ${resolveHex(fg)} on ${resolveHex(bg)}`).toBeLessThan(4.5);
    }
  });

  it('documents hardcoded white-on-accent buttons (use approved inverse token)', () => {
    // Canonical Button.astro/search use --color-text-inverse on accent (5.74:1 PASS).
    expect(contrast('--color-text-inverse', '--color-accent-primary')).toBeGreaterThanOrEqual(4.5);
    // Inline pages using hardcoded #fff on the same accent fail — pinned gap.
    expect(hexContrast('#ffffff', resolveHex('--color-accent-primary'))).toBeLessThan(4.5);
  });

  it('documents disabled/border non-text gaps (inactive exempt; input boundaries need owner)', () => {
    // Disabled text is WCAG-inactive (exempt from 4.5:1) — pinned for visibility.
    expect(contrast('--color-text-disabled', '--color-surface-2')).toBeLessThan(4.5);
    // Input/panel boundaries currently below non-text 3:1 — owner palette decision.
    expect(contrast('--color-border-subtle', '--surface-panel')).toBeLessThan(3.0);
    expect(contrast('--border-default', '--surface-raised')).toBeLessThan(3.0);
  });
});
