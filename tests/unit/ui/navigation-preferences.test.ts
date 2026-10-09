import { describe, expect, it } from 'vitest';
import {
  navigationMatches,
  navigationPreferences,
  recentRecordPath,
  type PreferenceStorage,
} from '../../../src/ui/client/navigation-preferences';

const record = '/tasks/018fcbce-24e8-7da2-8e85-132bd4151930';
const memoryStorage = (): PreferenceStorage & { values: Map<string, string> } => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
};
describe('account-bound navigation preferences', () => {
  it('restores expanded groups and collapsed state across page loads for the same actor', () => {
    const storage = memoryStorage();
    navigationPreferences('actor-a', storage).write({
      collapsed: true,
      sections: ['quality'],
      recent: [record],
    });
    expect(navigationPreferences('actor-a', storage).read()).toEqual({
      collapsed: true,
      sections: ['quality'],
      recent: [record],
    });
  });
  it('clears the previous actor on account switch and never reads their preferences', () => {
    const storage = memoryStorage();
    navigationPreferences('actor-a', storage).write({
      collapsed: true,
      sections: ['quality'],
      recent: [record],
    });
    expect(navigationPreferences('actor-b', storage).read()).toEqual({
      collapsed: false,
      sections: [],
      recent: [],
    });
    expect(storage.values.has('qc-navigation-v2:actor-a')).toBe(false);
    expect(navigationPreferences('actor-a', storage).read().recent).toEqual([]);
  });
  it('never creates an anonymous shared preference key', () => {
    const storage = memoryStorage();
    navigationPreferences('', storage).write({ collapsed: true, sections: [], recent: [record] });
    expect(storage.values.size).toBe(0);
  });
  it('keeps page state usable when all storage operations throw', () => {
    const unavailable = () => {
      throw new Error('Storage denied');
    };
    const preferences = navigationPreferences('actor-a', {
      getItem: unavailable,
      setItem: unavailable,
      removeItem: unavailable,
    });
    preferences.write({ collapsed: true, sections: ['work'], recent: [record] });
    expect(preferences.read().collapsed).toBe(true);
    expect(preferences.read().sections).toEqual(['work']);
  });
  it('disregards malformed values and removes legacy shared preferences', () => {
    const storage = memoryStorage();
    storage.values.set('qc-sidebar-collapsed', 'true');
    storage.values.set('qc-navigation-v2:actor-a', '{broken');
    expect(navigationPreferences('actor-a', storage).read().collapsed).toBe(false);
    expect(storage.values.has('qc-sidebar-collapsed')).toBe(false);
  });
  it('persists only bounded known record references without titles or query content', () => {
    const storage = memoryStorage();
    const preferences = navigationPreferences('actor-a', storage);
    preferences.write({
      collapsed: false,
      sections: [],
      recent: [
        record,
        '/admin/users/018fcbce-24e8-7da2-8e85-132bd4151930',
        `${record}?secret=value`,
        'Record title',
      ],
    });
    expect(preferences.read().recent).toEqual([record]);
    expect(storage.values.get('qc-navigation-v2:actor-a')).not.toContain('secret');
  });
});
describe('navigation and guide filtering', () => {
  it('matches every search word regardless of case and trims whitespace', () => {
    expect(navigationMatches('Calibration records', ' records CAL ')).toBe(true);
    expect(navigationMatches('Calibration records', 'cal overdue')).toBe(false);
    expect(navigationMatches('Equipment', ' ')).toBe(true);
  });
  it('rejects unsafe and unknown record routes', () => {
    for (const path of [
      '/tasks/new',
      '/system/backups/018fcbce-24e8-7da2-8e85-132bd4151930',
      '//evil.example',
      `${record}/review`,
      `${record}#content`,
    ])
      expect(recentRecordPath(path)).toBeUndefined();
    expect(recentRecordPath(record)).toBe(record);
  });
});
