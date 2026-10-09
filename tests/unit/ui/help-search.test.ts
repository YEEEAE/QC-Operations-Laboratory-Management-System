import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HELP_SECTIONS,
  helpSectionSearchText,
  type HelpSectionId,
} from '../../../src/shared/copy/help-sections';
import { navigationMatches } from '../../../src/ui/client/navigation-preferences';

describe('operating guide displayed-copy search', () => {
  it('finds the actual second-channel interruption instruction', () => {
    expect(HELP_SECTIONS.interruption.entries[0]).toContain('second channel');
    expect(navigationMatches(helpSectionSearchText('interruption'), 'second')).toBe(true);
    expect(navigationMatches(helpSectionSearchText('interruption'), 'second channel')).toBe(true);
  });
  it('indexes the displayed heading and all displayed body words', () => {
    const strings = (value: unknown): string[] =>
      typeof value === 'string'
        ? [value]
        : value && typeof value === 'object'
          ? Object.values(value).flatMap(strings)
          : [];
    for (const id of Object.keys(HELP_SECTIONS) as HelpSectionId[]) {
      const index = helpSectionSearchText(id);
      for (const displayed of strings(HELP_SECTIONS[id])) {
        expect(navigationMatches(index, displayed), `${id}: ${displayed}`).toBe(true);
      }
    }
  });
  it('uses only the supplied authorized rendered dynamic content', () => {
    const index = helpSectionSearchText('quick-links', [['Visible route', 'Visible purpose']]);
    expect(navigationMatches(index, 'Visible purpose')).toBe(true);
    expect(navigationMatches(index, 'RT-SYSTEM-001')).toBe(false);
  });
  it('uses the identical server-generated index in the client with native GET fallback', () => {
    const page = readFileSync(
      new URL('../../../src/pages/help/index.astro', import.meta.url),
      'utf8',
    );
    expect(page).toContain('method="get" action="/help"');
    expect(page).toContain("navigationMatches(sectionText[id] ?? '', query)");
    expect(page).toContain(
      "navigationMatches(section.dataset.helpSearchText ?? '', query?.value ?? '')",
    );
    expect(page.match(/data-help-search-text=/g)).toHaveLength(6);
    expect(page).not.toContain('JSON.stringify(roleGuides)');
  });
});
