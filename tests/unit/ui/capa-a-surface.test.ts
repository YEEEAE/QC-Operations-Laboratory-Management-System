import { readFileSync } from 'node:fs';
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
    expect(styles).toContain("color: var(--color-text-inverse) !important;");
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

  it('applies the same direction to the public surfaces without changing the login background', () => {
    expect(read('src/pages/login.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/404.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/500.astro')).toContain('visualDirection="capa-a"');
    expect(read('src/pages/login.astro')).toContain('<QCLogin3DBackground');
    expect(read('src/pages/login.astro')).toContain('transparent');
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
