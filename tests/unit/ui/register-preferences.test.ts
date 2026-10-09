import { describe, expect, it } from 'vitest';
import { presetQuery, readFilterPresets, registerPreferenceKey } from '../../../src/ui/client/register-preferences';

describe('account-local register preferences', () => {
  it('separates accounts and routes and never persists anonymous preferences', () => {
    expect(registerPreferenceKey('account-a', '/tasks')).not.toBe(registerPreferenceKey('account-b', '/tasks'));
    expect(registerPreferenceKey('account-a', '/tasks')).not.toBe(registerPreferenceKey('account-a', '/documents'));
    expect(registerPreferenceKey('', '/tasks')).toBeNull();
  });
  it('discards malformed, unknown and sensitive stored parameters', () => {
    expect(readFilterPresets('{bad', ['q'])).toEqual([]);
    expect(readFilterPresets(JSON.stringify([{ name: 'Unsafe', query: 'password=secret' }, { name: 'Unknown', query: 'redirect=https%3A%2F%2Fother.test' }]), ['q', 'password'])).toEqual([]);
    expect(readFilterPresets(JSON.stringify([{ name: ' Drafts ', query: 'state=DRAFT' }]), ['state'])).toEqual([{ name: 'Drafts', query: 'state=DRAFT' }]);
  });
  it('retains repeated allowed filter values, omits paging and never saves credentials', () => {
    const form = new FormData();
    form.append('state', 'DRAFT');form.append('state', 'OPEN');form.append('page', '5');form.append('password', 'never-store');form.append('q', 'lot & code');
    const query = new URLSearchParams(presetQuery(form, ['state', 'page', 'password', 'q']));
    expect(query.getAll('state')).toEqual(['DRAFT', 'OPEN']);
    expect(query.get('q')).toBe('lot & code');
    expect(query.has('page')).toBe(false);expect(query.has('password')).toBe(false);
  });
  it('bounds the number and size of saved preferences', () => {
    expect(readFilterPresets(JSON.stringify(Array.from({length:15}, (_, i) => ({name:`Preset ${i}`,query:'state=DRAFT'}))), ['state'])).toHaveLength(10);
    expect(readFilterPresets(JSON.stringify([{name:'x'.repeat(61),query:''}]), [])).toEqual([]);
  });
});
