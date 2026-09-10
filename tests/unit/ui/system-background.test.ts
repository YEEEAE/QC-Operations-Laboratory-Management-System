import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentPath = new URL('../../../src/ui/components/SystemBackground.astro', import.meta.url);
const faviconPath = new URL('../../../public/favicon.svg', import.meta.url);
const baseLayoutPath = new URL('../../../src/ui/layouts/BaseLayout.astro', import.meta.url);
const login3dPath = new URL('../../../src/ui/components/QCLogin3DBackground.astro', import.meta.url);

describe('system background contracts', () => {
  it('serves an explicit local favicon from the shared document head', () => {
    expect(existsSync(faviconPath)).toBe(true);
    expect(readFileSync(baseLayoutPath, 'utf8')).toContain('href="/favicon.svg"');
  });

  it('keeps the decorative renderer non-interactive and below application content', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('aria-hidden="true"');
    expect(component).toContain('pointer-events: none');
    expect(component).toContain('position: fixed');
    expect(component).toContain('z-index: 0');
  });

  it('uses a static local treatment with no runtime animation dependency', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('data-motion="static"');
    expect(component).toContain('radial-gradient');
    expect(component).not.toContain('@lottiefiles/dotlottie-web');
    expect(component).not.toContain('requestAnimationFrame');
    expect(component).not.toMatch(/https?:\/\//);
  });

  it('has no motion work to initialize, pause, or release', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).not.toContain('<script>');
    expect(component).not.toContain('matchMedia');
    expect(component).not.toContain('document.addEventListener');
  });

  it('excludes the renderer from print output', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('@media print');
    expect(component).toContain('display: none');
  });

  it('defers the login 3D payload until idle and skips it for reduced motion', () => {
    const component = readFileSync(login3dPath, 'utf8');
    expect(component).toContain("await import('three')");
    expect(component).toContain("await import('three/examples/jsm/loaders/GLTFLoader.js')");
    expect(component).toContain('requestIdleCallback');
    expect(component).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(component).not.toMatch(/import \* as THREE from 'three'/);
    expect(component).not.toMatch(/import \{ GLTFLoader \}/);
  });
});
