import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('CAPA Variant A layer contracts', () => {
  it('imports the layer once and applies it to the authenticated shell', () => {
    const global = read('src/ui/styles/global.css');
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(global.indexOf("@import './capa-a.css';")).toBeGreaterThan(
      global.indexOf("@import './precision-light.css';"),
    );
    expect(layout).toContain('visualDirection="capa-a"');
  });

  it('preserves the existing sidebar appearance and does not copy the 264px exploration rail', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain("html[data-visual-direction='capa-a'] .app-sidebar");
    expect(styles).toContain('background: #111d2d;');
    expect(styles).toContain('--color-text-primary: #f2f6f9;');
    expect(styles).toContain('--color-accent-primary: #5dd0d7;');
    expect(styles).not.toContain('264px');
    expect(styles).not.toContain('w-[264px]');
  });

  it('uses project-local assets only: no Tailwind CDN, Material Symbols or remote fonts', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).not.toContain('cdn.tailwindcss.com');
    expect(styles).not.toContain('material-symbols-outlined');
    expect(styles).not.toContain('fonts.googleapis.com');
    expect(styles).not.toContain('@import url(');
  });

  it('keeps a light-blue action with a dark label and a scoped correction for stale white labels', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain('--color-accent-primary: #92b8f2;');
    expect(styles).toContain('--color-accent-primary-hover: #a6c5f5;');
    expect(styles).toContain('--color-text-inverse: #14181e;');
    expect(styles).toContain('--text-on-accent: var(--color-text-inverse);');
    expect(styles).toContain('color: var(--text-on-accent) !important;');
  });

  it('does not repaint component variants that own a non-accent surface', () => {
    const styles = read('src/ui/styles/capa-a.css');
    for (const variant of [
      '.action--secondary',
      '.action--controlled',
      '.ui-button--secondary',
      '.ui-button--ghost',
      '.ui-button--controlled',
      '.ui-button--danger',
      '.icon-button',
      '.print-button',
    ]) {
      expect(styles).toContain(variant);
    }
    expect(styles).not.toContain('link-button.secondary):hover');
  });

  it('defines the semantic role tokens used by the layer', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain('--surface-canvas: var(--color-canvas);');
    expect(styles).toContain('--surface-inset: var(--color-surface-2);');
    expect(styles).toContain('--accent: var(--color-accent-primary);');
    expect(styles).toContain('--warning: var(--status-warning);');
    expect(styles).toContain('--error: var(--status-error);');
    expect(styles).toContain('--success: var(--status-success);');
    expect(styles).toContain('--focus: var(--focus-ring);');
    expect(styles).toContain('--text-on-accent: var(--color-text-inverse);');
  });

  it('keeps measured readable pairs for badges, placeholders and controls', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain('--status-released: #5fb3a6;');
    expect(styles).toContain('color: var(--text-muted);');
    expect(styles).not.toContain('color: var(--color-text-disabled);');

    const luminance = (hex: string) => {
      const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
      const linear = channels.map((value) =>
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const contrast = (a: string, b: string) => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (high + 0.05) / (low + 0.05);
    };
    expect(contrast('#5fb3a6', '#1f3532')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#9ba3af', '#2b323c')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#707a8c', '#252b34')).toBeGreaterThanOrEqual(3);
    expect(contrast('#92b8f2', '#14181e')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#14181e', '#92b8f2')).toBeGreaterThanOrEqual(4.5);
  });

  it('gives the policy state card the reference anatomy and 44px actions', () => {
    const styles = read('src/ui/styles/capa-a.css');
    const card = read('src/ui/components/feedback/DecisionStateCard.astro');
    expect(styles).toContain('max-inline-size: 720px;');
    expect(styles).toContain('min-block-size: 44px;');
    expect(styles).toContain('.state-card__callout');
    expect(card).toContain('<h2 id="state-card-heading">{heading}</h2>');
    expect(card).toContain('actions.map((action) => <a href={action.href}>{action.label}</a>)');
  });

  it('keeps the dense workspace full width and prints a white readable record', () => {
    const styles = read('src/ui/styles/capa-a.css');
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(styles).not.toContain('margin-inline: 264px');
    expect(styles).not.toContain('padding-inline: 264px');
    expect(layout).toContain('min(100% - 2 * var(--space-6), 1600px)');
    expect(styles).toContain('@media print');
    expect(styles).toContain("background: #fff !important;");
    expect(styles).toContain("color: #111 !important;");
    expect(styles).toContain('.app-sidebar,');
    expect(styles).toContain('.system-background,');
    expect(styles).toContain('grid-template-columns: 1fr !important;');
  });

  it('uses tabular figures for register data and logical properties only', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain('font-variant-numeric: var(--numeric-figures);');
    for (const physical of ['margin-left:', 'margin-right:', 'padding-left:', 'padding-right:', 'border-left:', 'border-right:']) {
      expect(styles).not.toContain(physical);
    }
  });

  it('states invalid fields and field errors with the measured danger pair', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain(":where(input, select, textarea)[aria-invalid='true']");
    expect(styles).toContain('border-color: var(--border-invalid);');
    expect(styles).toContain(':where(.field-error)');
    expect(styles).toContain('color: var(--text-danger);');
  });

  it('keeps dialog labels readable instead of forcing inverse on every button', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain("html[data-visual-direction='capa-a'] dialog :where(.primary, .danger, input[type='submit'])");
    expect(styles).toContain("html[data-visual-direction='capa-a'] dialog :where(button, .button, .link-button) {\n  color: var(--text-primary);");
  });

  it('has no hard-coded white label on an accent fill in page chrome', () => {
    const root = new URL('../../../src/pages/', import.meta.url);
    const offenders: string[] = [];
    for (const file of readdirSync(root, { recursive: true }) as string[]) {
      if (!file.endsWith('.astro')) continue;
      const contents = readFileSync(new URL(file, root), 'utf8');
      if (/color:\s*(#fff\b|white\b)/i.test(contents)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('applies the same direction to the public surfaces without changing the login background', () => {
    expect(read('src/pages/login.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/404.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/500.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/login.astro')).toContain('<QCLogin3DBackground');
    expect(read('src/pages/login.astro')).toContain('transparent');
  });

  it('defines pressed, disabled and busy affordances as derived states', () => {
    const styles = read('src/ui/styles/capa-a.css');
    expect(styles).toContain('--color-accent-primary-active: #7ea6e0;');
    expect(styles).toContain('--color-surface-active: #303845;');
    expect(styles).toContain(':active:not(:disabled)');
    expect(styles).toContain(":where(a, button)[aria-busy='true']");
    expect(styles).toContain(":where(a, button)[aria-disabled='true']");
    expect(styles).toContain('cursor: progress');
    expect(styles).toContain('cursor: not-allowed');

    const luminance = (hex: string) => {
      const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
      const linear = channels.map((value) =>
        value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const contrast = (a: string, b: string) => {
      const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (high + 0.05) / (low + 0.05);
    };
    expect(contrast('#7ea6e0', '#14181e')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#e8edf5', '#303845')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the three creation routes as honest source gates, not enabled fake forms', () => {
    for (const path of [
      'src/pages/quality/ncr/new.astro',
      'src/pages/quality/capa/new.astro',
      'src/pages/laboratory/tests/[labTestId]/retests/new.astro',
    ]) {
      const page = read(path);
      expect(page).toContain('DecisionStateCard');
      expect(page).not.toContain('<form');
    }
    expect(read('src/actions/ncr.ts')).toContain('remains denied');
    expect(read('src/actions/capa.ts')).toContain('requires an approved source/RCA relation');
  });
});
