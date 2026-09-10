import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const componentPath = new URL('../../../src/ui/components/SystemBackground.astro', import.meta.url);
const assetPath = new URL('../../../public/assets/background.lottie', import.meta.url);
const wasmPath = new URL('../../../public/assets/dotlottie-player.wasm', import.meta.url);
const faviconPath = new URL('../../../public/favicon.svg', import.meta.url);
const baseLayoutPath = new URL('../../../src/ui/layouts/BaseLayout.astro', import.meta.url);

describe('system background contracts', () => {
  it('serves the approved dotLottie asset from the local public asset boundary', () => {
    expect(existsSync(assetPath)).toBe(true);
    expect(existsSync(wasmPath)).toBe(true);
  });

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

  it('uses only the pinned local renderer and local asset URL', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain("from '@lottiefiles/dotlottie-web'");
    expect(component).toContain("src: '/assets/background.lottie'");
    expect(component).toContain("DotLottie.setWasmUrl('/assets/dotlottie-player.wasm')");
    expect(component).not.toMatch(/https?:\/\//);
  });

  it('does not initialize playback under reduced motion and releases work while hidden', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(component).toContain('if (reducedMotion.matches)');
    expect(component).toContain("document.addEventListener('visibilitychange'");
    expect(component).toContain('dotLottie?.pause()');
    expect(component).toContain('dotLottie?.destroy()');
  });

  it('fails closed to a static background when the renderer cannot load', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain("dotLottie.addEventListener('loadError', fallback)");
    expect(component).toContain("dotLottie.addEventListener('renderError', fallback)");
    expect(component).toContain("root.dataset.motion = 'fallback'");
    expect(component).toContain('WebAssembly.compile');
    expect(component).toContain('rendererDisabled');
  });

  it('excludes the renderer from print output', () => {
    const component = readFileSync(componentPath, 'utf8');
    expect(component).toContain('@media print');
    expect(component).toContain('display: none');
  });
});
