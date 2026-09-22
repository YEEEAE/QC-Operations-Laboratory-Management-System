import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classifyActionResult } from '../../../src/ui/forms/mutation-interaction.js';

/**
 * QC-100-FINAL-037-B — unsaved-change / draft behavior and
 * consequence-specific confirmation, focus return, and recovery links.
 *
 * Item 1 (verified here at contract level):
 *  - the unsaved-change guard exists as one shared module, tracks dirtiness
 *    from real field input, warns via beforeunload only when dirty, and is
 *    cleared by the committed-success event or a genuine native POST;
 *  - the guard is wired only into the approved editable create surfaces —
 *    never into signature, approval, reauthentication, or locked-record
 *    surfaces;
 *  - no autosave exists: there is no approved draft contract (authorization,
 *    version handling, retention policy), so no page or shared module
 *    persists form data to browser storage. POLICY-DEPENDENT through 013/026.
 *
 * Item 2 (verified here at contract level):
 *  - session expiry and interrupted requests classify into honest,
 *    entries-preserved states with a recovery path;
 *  - duplicate commands are guarded in-flight and classified distinctly;
 *  - slow networks surface an aria-busy pending state with progress copy;
 *  - destructive confirmations keep focus return, Escape safety while
 *    pending, an inline safe error region, and a stale-record refresh.
 */
const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

const GUARD = 'src/ui/forms/unsaved-changes.ts';
const SHARED = 'src/ui/forms/enhance-with-classification.ts';

/** Approved editable create surfaces — the only permitted guard targets. */
const GUARDED_PAGES: readonly string[] = [
  'src/pages/assets/equipment/new.astro',
  'src/pages/assets/maintenance/new.astro',
  'src/pages/assets/calibrations/new.astro',
  'src/pages/documents/new.astro',
  'src/pages/laboratory/tests/new.astro',
  'src/pages/change-requests/new.astro',
];

/**
 * Signature / approval / controlled-decision surfaces. The guard must never
 * attach here: their submissions are controlled ceremonies, not drafts.
 */
const SIGNATURE_AND_APPROVAL_SURFACES: readonly string[] = [
  'src/pages/approvals/[approvalId].astro',
  'src/pages/change-requests/[changeRequestId]/review.astro',
  'src/pages/governance/releases/[releaseId].astro',
  'src/pages/laboratory/tests/[labTestId]/review.astro',
  'src/pages/quarantine/inspections/[inspectionId]/review.astro',
];

describe('unsaved-change guard module (037-B item 1)', () => {
  it('tracks dirtiness from real field input and warns only when dirty', () => {
    const source = read(GUARD);
    expect(source).toContain("form.addEventListener('input', markDirty)");
    expect(source).toContain("form.addEventListener('change', markDirty)");
    expect(source).toContain("window.addEventListener('beforeunload', onBeforeUnload)");
    expect(source).toMatch(/if \(!dirty\) return;/);
    expect(source).toContain('event.preventDefault();');
  });

  it('clears on committed success and on a genuine native POST only', () => {
    const source = read(GUARD);
    expect(source).toContain('FORM_COMMITTED_EVENT');
    expect(source).toContain('form.addEventListener(FORM_COMMITTED_EVENT, markClean)');
    // An enhanced (intercepted) submission is preventDefaulted, so it must
    // NOT clear the guard; only a real no-JS-path POST does.
    expect(source).toContain('if (!event.defaultPrevented) dirty = false;');
  });

  it('is idempotent per form', () => {
    expect(read(GUARD)).toContain("form.dataset.unsavedGuard === 'true'");
  });

  it('never persists drafts: no browser storage and no autosave timers', () => {
    const source = read(GUARD);
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
    expect(source).not.toMatch(/setTimeout|setInterval/);
  });

  it('the shared enhancement announces a committed success before navigating', () => {
    const source = read(SHARED);
    expect(source).toContain('FORM_COMMITTED_EVENT');
    expect(source).toContain('form.dispatchEvent(new CustomEvent(FORM_COMMITTED_EVENT))');
    // The commit signal sits inside the SUCCESS branch only — a failed or
    // interrupted request must never clear the guard.
    const successIndex = source.indexOf("outcome.state === 'SUCCESS'");
    const dispatchIndex = source.indexOf('FORM_COMMITTED_EVENT)');
    expect(dispatchIndex).toBeGreaterThan(successIndex);
    expect(dispatchIndex).toBeLessThan(source.indexOf('} catch {'));
  });

  it('wires the guard into exactly the approved editable create surfaces', () => {
    for (const page of GUARDED_PAGES) {
      const source = read(page);
      expect(source, page).toContain('guardUnsavedChanges');
      expect(source, page).toContain('enhanceClassifiedForm');
      // Guard registers after the enhancement so defaultPrevented is visible.
      expect(source.indexOf('enhanceClassifiedForm(form'), page).toBeLessThan(
        source.indexOf('guardUnsavedChanges(form)'),
      );
    }
  });

  it('never attaches the guard to signature, approval, or controlled-decision surfaces', () => {
    for (const page of SIGNATURE_AND_APPROVAL_SURFACES) {
      expect(read(page), page).not.toContain('guardUnsavedChanges');
    }
  });

  it('keeps form data out of browser storage on every guarded page', () => {
    for (const page of GUARDED_PAGES) {
      expect(read(page), page).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    }
  });
});

describe('interruption, session expiry, duplicate, and slow-network safety (037-B item 2)', () => {
  it('classifies an expired or revoked session as an authorization change', () => {
    for (const code of ['AUTH_SESSION_EXPIRED', 'AUTH_SESSION_REVOKED', 'AUTH_REQUIRED']) {
      expect(classifyActionResult({ error: { message: code } }).state, code).toBe(
        'AUTHORIZATION_CHANGED',
      );
    }
  });

  it('classifies a duplicate command distinctly from a stale record', () => {
    expect(classifyActionResult({ error: { message: 'CONFLICT_DUPLICATE_COMMAND' } }).state).toBe(
      'DUPLICATE_COMMAND',
    );
    expect(classifyActionResult({ error: { message: 'RESOURCE_ALREADY_EXISTS' } }).state).toBe(
      'DUPLICATE_COMMAND',
    );
    expect(classifyActionResult({ error: { message: 'CONFLICT_STALE_VERSION' } }).state).toBe(
      'CONFLICT_STALE',
    );
  });

  it('keeps the interrupted-request path honest: safe-unknown copy, entries preserved', () => {
    const source = read(SHARED);
    const catchIndex = source.indexOf('} catch {');
    const unknownIndex = source.indexOf('copy.errorClasses.UNKNOWN_SAFE_ERROR', catchIndex);
    expect(unknownIndex).toBeGreaterThan(catchIndex);
    const vocabulary = read('src/shared/copy/ux-vocabulary.ts');
    expect(vocabulary).toMatch(/UNKNOWN_SAFE_ERROR:[\s\S]*?did not compl/);
  });

  it('keeps the in-flight duplicate guard and pending state for slow networks', () => {
    const source = read(SHARED);
    expect(source).toContain("form.getAttribute('aria-busy') === 'true'");
    expect(source).toContain("form.setAttribute('aria-busy', 'true')");
    expect(source).toContain('submit.disabled = true');
    expect(source).toContain('config.progressText');
  });

  it('routes an ended session to login recovery with a validated local returnTo', () => {
    const middleware = read('src/middleware.ts');
    expect(middleware).toContain('SESSION_ENDED');
    expect(middleware).toContain('returnTo');
    const login = read('src/pages/login.astro');
    expect(login).toContain('safeReturnTo');
    expect(login).toContain('sessionRecoveryNotice');
    expect(login).toContain('id="session-recovery"');
  });
});

describe('consequence-specific confirmation, focus return, and recovery links (037-B item 2)', () => {
  it('returns focus to the exact triggering control when a dialog closes', () => {
    const dialog = read('src/ui/client/dialog.ts');
    expect(dialog).toContain('openers.set(dialog, trigger)');
    expect(dialog).toContain('previousOpener?.isConnected');
    expect(dialog).toContain('previousOpener.focus()');
  });

  it('never lets Escape abandon an in-flight controlled mutation', () => {
    const dialog = read('src/ui/client/dialog.ts');
    expect(dialog).toContain("dialog.dataset.dialogPending === 'true'");
    expect(dialog).toContain('event.preventDefault();');
  });

  it('reports a failed confirmation inline and offers a stale-record refresh', () => {
    const dialog = read('src/ui/client/dialog.ts');
    expect(dialog).toContain('[data-dialog-error]');
    expect(dialog).toContain('[data-refresh-record]');
    const component = read('src/ui/components/feedback/ConfirmDialog.astro');
    expect(component).toContain('data-dialog-error');
    expect(component).toContain('data-dialog-stale');
    expect(component).toContain('role="alert"');
  });

  it('binds destructive admin mutations through the shared dialog contract', () => {
    expect(read('src/pages/admin/users/[userId].astro')).toContain('data-dialog-open');
  });

  it('keeps error pages on one clear recovery action each', () => {
    for (const page of ['src/pages/404.astro', 'src/pages/500.astro']) {
      expect(read(page).match(/<a href=/g)?.length ?? 0, page).toBe(1);
    }
  });
});

