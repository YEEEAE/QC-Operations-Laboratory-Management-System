import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  classifyActionResult,
  enhanceMutationForm,
  transitionMutation,
  type MutationState,
} from '../../../src/ui/forms/mutation-interaction';

describe('CA-03 mutation UI transitions', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('invokes once while pending, retains request identity and clears only passwords on failure', async () => {
    let submitHandler!: (event: { preventDefault(): void }) => Promise<void>;
    let reject!: (reason: Error) => void;
    const invoke = vi.fn(
      () =>
        new Promise<{ error?: unknown }>((_resolve, rejectPromise) => {
          reject = rejectPromise;
        }),
    );
    const secret = { value: 'reauth-secret' };
    const ordinary = { value: 'Retain this reason' };
    const requestId = { value: 'original-request-id' };
    const button = { disabled: false };
    const output = { textContent: '', focus: vi.fn() };
    const attributes = new Map<string, string>();
    const form = {
      dataset: {},
      checkValidity: () => true,
      addEventListener: (_name: string, handler: typeof submitHandler) => {
        submitHandler = handler;
      },
      querySelector: (selector: string) => (selector === '[data-result]' ? output : button),
      querySelectorAll: (selector: string) =>
        selector === 'input[type="password"]' ? [secret] : [],
      setAttribute: (key: string, value: string) => attributes.set(key, value),
      removeAttribute: (key: string) => attributes.delete(key),
    } as unknown as HTMLFormElement;
    vi.stubGlobal(
      'FormData',
      class {
        constructor(public form: HTMLFormElement) {}
      },
    );
    enhanceMutationForm({
      form,
      invoke,
      progressText: 'Saving',
      copy: {
        VALIDATION_ERROR: 'Invalid',
        CONFLICT_STALE: 'Refresh',
        AUTHORIZATION_CHANGED: 'Denied',
        DEPENDENCY_UNAVAILABLE: 'Unavailable',
        UNKNOWN_SAFE_ERROR: 'Review before retry',
      },
    });
    const pending = submitHandler({ preventDefault() {} });
    await submitHandler({ preventDefault() {} });
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(attributes.get('aria-busy')).toBe('true');
    expect(button.disabled).toBe(true);
    reject(new Error('sensitive endpoint details'));
    await pending;
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(output.textContent).toBe('Review before retry');
    expect(secret.value).toBe('');
    expect(ordinary.value).toBe('Retain this reason');
    expect(requestId.value).toBe('original-request-id');
    expect(attributes.has('aria-busy')).toBe(false);
    expect(button.disabled).toBe(false);
  });
  it('guards invalid input, duplicate submission and premature success', () => {
    expect(transitionMutation('IDLE', { type: 'SUBMIT', valid: false })).toBe('IDLE');
    expect(transitionMutation('IDLE', { type: 'RESOLVE', outcome: { state: 'SUCCESS' } })).toBe(
      'IDLE',
    );
    expect(transitionMutation('IDLE', { type: 'SUBMIT', valid: true })).toBe('SUBMITTING');
    expect(transitionMutation('SUBMITTING', { type: 'SUBMIT', valid: true })).toBe('SUBMITTING');
    expect(transitionMutation('SUCCESS', { type: 'SUBMIT', valid: true })).toBe('SUCCESS');
  });
  const outcomes: MutationState[] = [
    'SUCCESS',
    'VALIDATION_ERROR',
    'CONFLICT_STALE',
    'DUPLICATE_COMMAND',
    'AUTHORIZATION_CHANGED',
    'DEPENDENCY_UNAVAILABLE',
    'PROVIDER_UNAVAILABLE',
    'UNKNOWN_SAFE_ERROR',
  ];
  it.each(outcomes)('accepts server outcome %s only while pending', (state) => {
    expect(transitionMutation('SUBMITTING', { type: 'RESOLVE', outcome: { state } })).toBe(state);
    expect(transitionMutation('IDLE', { type: 'RESOLVE', outcome: { state } })).toBe('IDLE');
  });
  it('keeps transport failure unknown and never retries automatically', () => {
    expect(transitionMutation('SUBMITTING', { type: 'TRANSPORT_FAILED' })).toBe(
      'UNKNOWN_SAFE_ERROR',
    );
    expect(transitionMutation('IDLE', { type: 'TRANSPORT_FAILED' })).toBe('IDLE');
    expect(transitionMutation('SUBMITTING', { type: 'RESOLVE', outcome: { state: 'IDLE' } })).toBe(
      'SUBMITTING',
    );
  });
  it('does not treat contradictory data and error as confirmed success', () => {
    expect(
      classifyActionResult({ data: { id: 'record' }, error: { message: 'CONFLICT_STALE_VERSION' } })
        .state,
    ).toBe('CONFLICT_STALE');
    expect(classifyActionResult(undefined).state).toBe('UNKNOWN_SAFE_ERROR');
  });
});
