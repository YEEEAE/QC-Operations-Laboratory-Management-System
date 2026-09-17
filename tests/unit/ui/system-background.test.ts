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
const wasmPath = new URL('../../../public/assets/dotlottie-player.wasm', import.meta.url);
const lottiePath = new URL('../../../public/assets/background.lottie', import.meta.url);

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
    expect(component).toContain('data-system-background-canvas');
    expect(component).toContain("z-index: 2");
  });

  it('uses the pinned official local dotLottie runtime with a static fallback', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('data-motion="static"');
    expect(component).toContain('radial-gradient');
    expect(component).toContain("@lottiefiles/dotlottie-web");
    expect(component).toContain("'/assets/background.lottie'");
    expect(component).toContain("'/assets/dotlottie-player.wasm'");
    expect(component).toContain('setWasmUrl');
    expect(component).not.toMatch(/https?:\/\//);
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { dependencies: Record<string, string> };
    expect(packageJson.dependencies['@lottiefiles/dotlottie-web']).toBe('0.80.0');
    expect(existsSync(lottiePath)).toBe(true);
    expect(existsSync(wasmPath)).toBe(true);
  });

  it('lazy-initializes once, respects reduced motion, and cleans up on page hide', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('requestIdleCallback');
    expect(component).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(component).toContain('current.destroy()');
    expect(component).toContain("window.addEventListener('pagehide'");
    expect(component).toContain("current.addEventListener('loadError'");
    expect(component).toContain("current.addEventListener('renderError'");
    expect(component).toContain('setStaticFallback');
  });

  it('keeps the operational content layer above the background through the shared layout', () => {
    const baseLayout = readFileSync(baseLayoutPath, 'utf8');
    expect(baseLayout).toContain('<SystemBackground />');
    expect(baseLayout).toContain('<div class="system-content">');
    expect(readFileSync(new URL('../../../src/ui/styles/global.css', import.meta.url), 'utf8')).toMatch(
      /\.system-content\s*\{[\s\S]*?z-index:\s*1;/,
    );
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
