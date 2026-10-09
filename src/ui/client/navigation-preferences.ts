export interface NavigationPreferences {
  collapsed: boolean;
  sections: string[];
  recent: string[];
}
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
const PREFIX = 'qc-navigation-v2:';
const RECENT_RECORD =
  /^\/(?:tasks|quality\/(?:findings|ncr|rca|capa)|quarantine\/(?:receiving|inspections)|laboratory\/tests|assets\/(?:equipment|calibrations|maintenance)|change-requests)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function recentRecordPath(path: string): string | undefined {
  return RECENT_RECORD.test(path) ? path : undefined;
}

export function navigationMatches(label: string, query: string): boolean {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => label.toLocaleLowerCase().includes(word));
}

/** Preferences are conveniences. Storage refusal never stops navigation. */
export function navigationPreferences(actorId: string, storage?: PreferenceStorage) {
  const key = actorId ? `${PREFIX}${encodeURIComponent(actorId)}` : undefined;
  const defaults = (): NavigationPreferences => ({ collapsed: false, sections: [], recent: [] });
  let state = defaults();
  try {
    storage?.removeItem('qc-sidebar-collapsed');
    storage?.removeItem('qc-navigation-expanded-sections');
    const previous = storage?.getItem(`${PREFIX}account`);
    if (previous && previous !== actorId)
      storage?.removeItem(`${PREFIX}${encodeURIComponent(previous)}`);
    if (key) {
      storage?.setItem(`${PREFIX}account`, actorId);
      const saved: unknown = JSON.parse(storage?.getItem(key) ?? 'null');
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const value = saved as Partial<NavigationPreferences>;
        state = {
          collapsed: value.collapsed === true,
          sections: Array.isArray(value.sections)
            ? value.sections
                .filter((s): s is string => typeof s === 'string' && /^[a-z-]{1,40}$/.test(s))
                .slice(0, 20)
            : [],
          recent: Array.isArray(value.recent)
            ? value.recent
                .filter((s): s is string => typeof s === 'string' && !!recentRecordPath(s))
                .slice(0, 8)
            : [],
        };
      }
    }
  } catch {
    /* Use page-local preferences if storage is unavailable. */
  }
  return {
    read: () => ({ ...state, sections: [...state.sections], recent: [...state.recent] }),
    write: (next: NavigationPreferences) => {
      state = {
        ...next,
        recent: next.recent.filter((path) => !!recentRecordPath(path)).slice(0, 8),
      };
      try {
        if (key) storage?.setItem(key, JSON.stringify(state));
      } catch {
        /* Page state remains usable. */
      }
    },
  };
}
