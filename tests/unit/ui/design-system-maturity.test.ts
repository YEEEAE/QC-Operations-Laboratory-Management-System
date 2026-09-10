import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('QC design-system maturity contracts', () => {
  it('exposes semantic, component, typography, focus, and motion layers', () => {
    const tokens = read('src/ui/styles/tokens.css');
    for (const token of [
      '--surface-readonly', '--surface-disabled', '--border-invalid', '--border-selected',
      '--button-radius', '--input-background', '--card-padding', '--table-header-background',
      '--nav-item-radius', '--font-size-display', '--line-height-normal', '--focus-width',
      '--motion-ease-standard', '--disabled-opacity',
    ]) expect(tokens, token).toContain(`${token}:`);
  });

  it('keeps all controlled status distinctions explicit', () => {
    const badge = read('src/ui/components/StatusBadge.astro');
    expect(badge).toContain("'PASS'");
    expect(badge).toContain("'RELEASED'");
    expect(badge).toContain("'APPROVED'");
    expect(badge).toContain("'HOLD'");
    expect(badge).toContain("'STALE'");
    expect(badge).toContain('status-badge--stale');
  });

  it('covers interaction states in shared button and form contracts', () => {
    const button = read('src/ui/components/Button.astro');
    const input = read('src/ui/components/forms/form-control.css');
    for (const state of [':hover', ':active', ':focus-visible', ':disabled']) expect(button).toContain(state);
    for (const state of [':hover', ':focus-visible', "[aria-invalid='true']", '[readonly]', ':disabled']) expect(input).toContain(state);
  });

  it('does not leave shared table striping as an inline color', () => {
    const table = read('src/ui/components/data/DataTable.astro');
    expect(table).toContain('var(--table-stripe-background)');
    expect(table).not.toContain('rgb(255 255 255 / 1.5%)');
  });

  it('keeps compact density dense without dropping usable controls below the web floor', () => {
    const density = read('src/ui/styles/density.css');
    expect(density).toMatch(/\[data-density='compact'\][\s\S]*--control-height:\s*40px/);
    const global = read('src/ui/styles/global.css');
    expect(global).toContain('.table-wrap table');
    expect(global).toContain('overflow-wrap: anywhere');
  });
});
