import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * F-12 English-only vocabulary guards: sentence-case action labels without
 * changing controlled action semantics, and a fixed English interface
 * (lang="en" dir="ltr"). No Arabic copy, RTL switching, or translation
 * branches are allowed in product pages.
 */

const ROOT = new URL('../../../', import.meta.url);

const readRepo = (path: string): string =>
  readFileSync(new URL(path, ROOT), 'utf8');

function astroPages(dir = 'src/pages'): string[] {
  const base = new URL(dir, ROOT);
  const out: string[] = [];
  const walk = (absolute: string, relative: string): void => {
    for (const entry of readdirSync(absolute, { withFileTypes: true })) {
      const abs = join(absolute, entry.name);
      const rel = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(abs, rel);
      else if (entry.name.endsWith('.astro')) out.push(`${dir}/${rel}`);
    }
  };
  walk(base.pathname, '');
  return out;
}

describe('F-12 English-only action vocabulary', () => {
  it('keeps the sign-in page fixed to English with no locale branch', () => {
    const login = readRepo('src/pages/login.astro');
    expect(login).toContain('locale="en"');
    expect(login).toContain('direction="ltr"');
    expect(login).not.toContain("locale') === 'ar'");
    expect(login).not.toContain('isArabic');
    expect(login).not.toContain('تسجيل الدخول');
    expect(login).toContain('Sign in');
    expect(login).toContain('Login identity');
  });

  it('does not render Arabic copy or RTL literals in product pages', () => {
    for (const page of astroPages()) {
      const source = readRepo(page);
      expect(source, `${page} must stay English-only`).not.toMatch(
        /[\u0600-\u06FF]/,
      );
      expect(source, `${page} must not hardcode Arabic`).not.toContain(
        'locale="ar"',
      );
      expect(source, `${page} must not hardcode RTL`).not.toContain(
        'direction="rtl"',
      );
    }
  });

  it('uses sentence-case action labels instead of Title Case variants', () => {
    const banned = [
      'Create Task',
      'Create Finding',
      'New document',
      'Save Draft',
      'Save controlled draft',
      'Create catalog entry',
      'Create Draft version',
      'Edit Draft',
      'Back to Tasks',
      'Back to Users',
      'Back to Administration',
      'Back to Roles',
      'New Equipment ·',
      'New Calibration ·',
      'New Maintenance ·',
      'New Controlled Document',
      'New Change Request ·',
      'New Receiving Item ·',
      'New Revision ·',
    ];
    const pages = astroPages();
    const shared = [
      'src/ui/components/forms/FormActions.astro',
      ...pages,
    ];
    for (const file of shared) {
      const source = readRepo(file);
      for (const label of banned) {
        expect(source, `${file} must not contain "${label}"`).not.toContain(
          label,
        );
      }
    }
  });

  it('keeps the standardized sentence-case vocabulary present', () => {
    const tasksIndex = readRepo('src/pages/tasks/index.astro');
    expect(tasksIndex).toContain('Create task');
    const findingsIndex = readRepo('src/pages/quality/findings/index.astro');
    expect(findingsIndex).toContain('Create finding');
    const documentsIndex = readRepo('src/pages/documents/index.astro');
    expect(documentsIndex).toContain('Create document');
    const tasksNew = readRepo('src/pages/tasks/new.astro');
    expect(tasksNew).toContain('Create task');
    expect(tasksNew).toContain('Save draft');
    const findingsNew = readRepo('src/pages/quality/findings/new.astro');
    expect(findingsNew).toContain('Create finding');
    expect(findingsNew).toContain('Save draft');
    const receivingNew = readRepo('src/pages/quarantine/receiving/new.astro');
    expect(receivingNew).toContain('Create receiving item');
    const labNew = readRepo('src/pages/laboratory/tests/new.astro');
    expect(labNew).toContain('Save draft');
    expect(labNew).toContain('locale="en"');
    const formActions = readRepo('src/ui/components/forms/FormActions.astro');
    expect(formActions).toContain("draftLabel = 'Save draft'");
  });

  it('reserves controlled transitions without renaming their semantics', () => {
    const versionDetail = readRepo(
      'src/pages/documents/[documentId]/versions/[versionId]/index.astro',
    );
    expect(versionDetail).toContain('Submit for review');
    const versionReview = readRepo(
      'src/pages/documents/[documentId]/versions/[versionId]/review.astro',
    );
    expect(versionReview).toContain('Approve revision');
    const receivingDetail = readRepo(
      'src/pages/quarantine/receiving/[receivingId].astro',
    );
    expect(receivingDetail).toContain('Release item');
    expect(receivingDetail).toContain('PASS is recorded, but this item is not released');
  });
});
