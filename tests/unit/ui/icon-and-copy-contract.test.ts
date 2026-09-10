import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { navigationGroups } from '../../../src/ui/navigation/navigation';
import { iconNames } from '../../../src/ui/components/icon';

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const presentationRoots = ['src/pages', 'src/ui'];
const sourceExtensions = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx']);
const bannedTerms = [/authorized read models?/i, /\bread model\b/i];
const placeholderGlyphs = /[⌂✓↳▣⚙◌▦⌁◉⇄▥✦◍◈☰◎⌘♥⛁▤●⌕→←↑↓↕‹⌄]/u;

function collectPresentationFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? collectPresentationFiles(path)
      : sourceExtensions.has(path.slice(path.lastIndexOf('.')))
        ? [path]
        : [];
  });
}

describe('presentation icon and copy contracts', () => {
  it('keeps backend read-model terminology and placeholder glyphs out of presentation sources', () => {
    for (const relativeRoot of presentationRoots) {
      for (const file of collectPresentationFiles(join(projectRoot, relativeRoot))) {
        const source = readFileSync(file, 'utf8');
        expect(
          bannedTerms.some((term) => term.test(source)),
          file,
        ).toBe(false);
        expect(placeholderGlyphs.test(source), file).toBe(false);
      }
    }
  });

  it('uses only semantic icon names in navigation data', () => {
    const allowed = new Set(iconNames);
    const items = navigationGroups.flatMap((group) => group.items);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(allowed.has(item.icon), `${item.id} uses an unregistered icon`).toBe(true);
      expect(item.icon).toMatch(/^[a-z][a-z-]*$/);
    }
  });

  it('keeps the shared SVG renderer consistent and local', () => {
    const icon = readFileSync(join(projectRoot, 'src/ui/components/Icon.astro'), 'utf8');
    expect(icon).toContain('viewBox="0 0 24 24"');
    expect(icon).toContain('stroke="currentColor"');
    expect(icon).toContain('stroke-width={strokeWidth}');
    expect(icon).toContain('aria-hidden="true"');
    expect(icon).toContain('{paths.map((d) => <path d={d} />)}');
    expect(icon).not.toContain('innerHTML');
    expect(icon).not.toContain('http');
  });
});
