import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  auditActionLabel,
  auditActorLabel,
  auditSubjectLabel,
} from '../../../src/shared/copy/audit-vocabulary.js';
import { removeFilter } from '../../../src/shared/pagination/remove-filter.js';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('audit human labels and filter access', () => {
  it('uses readable labels for action, subject, and actor while keeping unknown actions legible', () => {
    expect(auditActionLabel('FINAL_APPROVE')).toBe('Final approval');
    expect(auditActionLabel('REOPEN')).toBe('Reopen');
    expect(auditSubjectLabel('LAB_TEST')).toBe('Laboratory test');
    expect(auditSubjectLabel('UNMAPPED_RECORD')).toBe('Unmapped record');
    expect(auditActorLabel({ actorType: 'USER', displayName: 'Samira' })).toBe('Samira');
    expect(auditActorLabel({ actorType: 'USER' })).toBe('User account no longer available');
    expect(auditActorLabel({ actorType: 'SYSTEM' })).toBe('System');
    expect(auditActorLabel({ actorType: 'SERVICE' })).toBe('Service');
  });

  it('removing a task filter from a later page resets the page and preserves other filters', () => {
    const params = new URLSearchParams('page=4&pageSize=25&state=OPEN&due=today');
    expect(removeFilter(params, 'state').toString()).toBe('pageSize=25&due=today');
  });

  it('shows the AI system-health link only when the canonical private-page decision allows it', () => {
    const page = read('src/pages/ai-advisory.astro');
    expect(page).toContain("pageAccessDecision(actor, '/system/health')");
    expect(page).toMatch(/healthPageAccess === 'ALLOWED'[\s\S]*?href="\/system\/health"/);
    expect(page).toContain('available to the named service owner');
  });

  it('provides a named filter landmark and human audit columns without printing actor IDs', () => {
    const page = read('src/pages/audit.astro');
    expect(page).toContain('aria-label="Audit history filters"');
    expect(page).toContain('Changed by account reference');
    expect(page).toContain('Record reference');
    expect(page).toContain('Request reference');
    expect(page).toContain(
      'auditActorLabel({ actorType: event.actorType, displayName: event.actorDisplayName })',
    );
    expect(page).not.toContain('{event.actorId}');
  });
});
