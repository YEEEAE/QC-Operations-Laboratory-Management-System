import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentPath = new URL('../../../src/ui/components/SystemBackground.astro', import.meta.url);
const faviconPath = new URL('../../../public/favicon.svg', import.meta.url);
const baseLayoutPath = new URL('../../../src/ui/layouts/BaseLayout.astro', import.meta.url);
const login3dPath = new URL(
  '../../../src/ui/components/QCLogin3DBackground.astro',
  import.meta.url,
);
const packagePath = new URL('../../../package.json', import.meta.url);

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
    expect(component).toContain('z-index: 2');
  });

  // QC-100-FINAL-016 P2-14: the dotLottie layer never rendered under the
  // production CSP (no `unsafe-eval`) and cost ~2.4 MB per page. The owner
  // decided to drop the layer and keep the gradient treatment.
  it('renders the static gradient treatment without any Lottie runtime or asset request', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('data-motion="static"');
    expect(component).toContain('radial-gradient');
    expect(component).not.toContain('@lottiefiles/dotlottie-web');
    expect(component).not.toContain('background.lottie');
    expect(component).not.toContain('dotlottie-player.wasm');
    expect(component).not.toContain('setWasmUrl');
    expect(component).not.toContain('<script');
    expect(component).not.toContain('data-system-background-canvas');
    expect(component).not.toMatch(/https?:\/\//);
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(packageJson.dependencies['@lottiefiles/dotlottie-web']).toBe('0.80.0');
  });

  it('keeps the operational content layer above the background through the shared layout', () => {
    const baseLayout = readFileSync(baseLayoutPath, 'utf8');
    expect(baseLayout).toContain('<SystemBackground />');
    expect(baseLayout).toContain('<div class="system-content">');
    expect(
      readFileSync(new URL('../../../src/ui/styles/global.css', import.meta.url), 'utf8'),
    ).toMatch(/\.system-content\s*\{[\s\S]*?z-index:\s*1;/);
  });

  it('keeps the login renderer separate from the authenticated system background', () => {
    const login = readFileSync(new URL('../../../src/pages/login.astro', import.meta.url), 'utf8');
    expect(login).toContain('systemBackground={false}');
    expect(login).toContain('QCLogin3DBackground');
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
