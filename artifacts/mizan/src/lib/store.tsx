import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { seedState } from './seed';
import type { AppState } from './types';

const KEY = 'mizan-demo-state-v1';

function load(): { state: AppState; error: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { state: seedState(), error: false };
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== 1 || !parsed.profile) return { state: seedState(), error: false };
    const base = seedState();
    return { state: { ...base, ...parsed, assumptions: { ...base.assumptions, ...parsed.assumptions } }, error: false };
  } catch {
    return { state: seedState(), error: true };
  }
}

interface Ctx {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
  storageError: boolean;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useRef(load());
  const [state, setState] = useState<AppState>(initial.current.state);
  const [storageError, setStorageError] = useState(initial.current.error);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.dir = state.profile.lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = state.profile.lang;
  }, [state.profile.lang]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);
  const reset = useCallback(() => setState((s) => ({ ...seedState(), profile: { ...seedState().profile, lang: s.profile.lang } })), []);

  return <AppCtx.Provider value={{ state, update, reset, storageError }}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}

/** Apply guest-count/catering linkage after profile or assumption change */
export function syncCatering(s: AppState): AppState {
  if (!s.assumptions.linkCatering) return s;
  const val = Math.round(s.profile.guests * s.assumptions.cateringPerGuest);
  return { ...s, cats: s.cats.map((c) => (c.id === 'catering' ? { ...c, allocated: val } : c)) };
}
