import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { priorityLabel } from '../../../src/shared/copy/ux-vocabulary.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('QC-ADP-13 operator-facing copy', () => {
  it('humanizes UNSPECIFIED without changing the stored task value', () => {
    expect(priorityLabel('UNSPECIFIED')).toBe('Not specified');
    expect(priorityLabel('HIGH_PRIORITY')).toBe('High priority');

    const create = read('src/pages/tasks/new.astro');
    const register = read('src/pages/tasks/index.astro');
    const detail = read('src/pages/tasks/[taskId].astro');
    expect(create).toContain("priority: field(formData, 'priority') || 'UNSPECIFIED'");
    expect(create).toContain("priority:String(data.get('priority')||'UNSPECIFIED')");
    expect(create).toContain('placeholder="Not specified"');
    expect(register).toContain('priorityLabel(task.priority)');
    expect(detail).toContain('priorityLabel(task.priority)');
  });

  it('names the actual recovery destination on the not-found page', () => {
    const page = read('src/pages/404.astro');
    expect(page).toContain("const recoveryHref = Astro.locals.user ? '/dashboard' : '/login'");
    expect(page).toContain(
      "const recoveryLabel = Astro.locals.user ? 'Go to dashboard' : 'Go to sign in'",
    );
  });

  it('keeps the reject-report outage human and recoverable', () => {
    const page = read('src/pages/reject-reports/index.astro');
    expect(page).toContain("title: 'Reject Reports are temporarily unavailable'");
    expect(page).toContain('retryHref="/reject-reports"');
    expect(page).not.toContain('incomplete database schema');
    expect(page).not.toContain('Review migration readiness');
    expect(page).not.toContain('schema or its integrity constraints');
  });

  it('shows create links only when the matching permission is active', () => {
    for (const [path, permission] of [
      ['src/pages/tasks/index.astro', 'PERM-TASK-CREATE'],
      ['src/pages/assets/equipment/index.astro', 'PERM-EQP-CREATE'],
      ['src/pages/assets/calibrations/index.astro', 'PERM-CAL-CREATE'],
      ['src/pages/assets/maintenance/index.astro', 'PERM-MNT-CREATE'],
    ]) {
      const source = read(path);
      expect(source, path).toContain(`code === '${permission}'`);
      expect(source, path).toContain('.active !== false');
      expect(source, path).toMatch(/canCreate\s*(?:\?|&&)/);
    }
  });

  it('uses a human backup label and keeps UUIDs in secondary metadata only', () => {
    const register = read('src/pages/system/backups/index.astro');
    const detail = read('src/pages/system/backups/[backupId]/index.astro');
    const restore = read('src/pages/system/backups/[backupId]/restore.astro');
    expect(register).toContain('Backup set · {riyadh(item.requestedAt)}');
    expect(register).not.toContain('>{item.id}</a>');
    expect(detail).toContain('<dt>Internal reference</dt>');
    expect(detail).not.toContain('{backup.errorCode}');
    expect(detail).not.toContain('{run.id}');
    expect(restore).toContain('<dt>Internal backup reference</dt>');
  });

  it('explains VOID without changing the controlled label', () => {
    expect(read('src/shared/copy/ux-vocabulary.ts')).toContain("VOID: 'VOID'");
    const badge = read('src/ui/components/StatusBadge.astro');
    expect(badge).toContain('The record remains in history; it has not been deleted.');
    expect(badge).toContain("aria-label={status === 'VOID'");
  });
});
