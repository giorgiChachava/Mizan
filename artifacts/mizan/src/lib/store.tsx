import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { seedState, sampleInvitation } from './seed';
import { rangeFor } from './profile';
import type { AppState, BlueprintCat, BudgetCatId, Expense, LocalGuest, Priority, Task, WeddingStyle } from './types';

const KEY = 'mizan-state-v2';
const LEGACY_KEY = 'mizan-demo-state-v1';

/* ---------------- v1 → v2 migration (non-destructive: v1 key is left untouched) ---------------- */
type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export const LEGACY_BUDGET_MAP: Record<string, BudgetCatId> = { venue: 'venue', catering: 'catering', prep: 'clothing', mahr: 'jewellery', invites: 'invitations', other: 'other' };
export const LEGACY_TASK_MAP: Record<string, BlueprintCat> = { engagement: 'clothing', venue: 'venue', prep: 'clothing', invites: 'invitations', finance: 'venue', day: 'decoration' };

const kw = (text: string) => {
  const s = text.toLowerCase();
  if (/photo|video|film/.test(s)) return 'photo';
  if (/cater|tasting|food|dinner|coffee/.test(s)) return 'catering';
  if (/decor|kosha|flor|stage/.test(s)) return 'decoration';
  return null;
};

export function migrateV1(v1: Any): AppState {
  const base = seedState();
  const p = v1.profile ?? {};
  const styleMap: Record<string, WeddingStyle> = { traditional: 'traditional', modern: 'modern', contemporary: 'classic', custom: 'custom' };
  const prioMap: Record<string, Priority> = { venue: 'venue', catering: 'food', decoration: 'decoration', photo: 'photo', guests: 'guests' };
  const guests = Number(p.guests) || base.profile.guests;
  const legacyCats: Any[] = Array.isArray(v1.cats) ? v1.cats : [];
  const cats = base.cats.map((c) => ({ id: c.id, allocated: legacyCats.filter((l) => LEGACY_BUDGET_MAP[l.id] === c.id).reduce((a, l) => a + (Number(l.allocated) || 0), 0) }));
  const tasks: Task[] = (Array.isArray(v1.tasks) ? v1.tasks : []).map((x: Any) => {
    const guess = kw(String(x.title ?? ''));
    const cat: BlueprintCat = (guess === 'photo' || guess === 'catering' || guess === 'decoration') && x.cat !== 'invites' ? guess : LEGACY_TASK_MAP[x.cat] ?? 'venue';
    return { id: String(x.id), cat, title: String(x.title ?? ''), done: !!x.done, deadline: String(x.deadline ?? ''), notes: String(x.notes ?? ''), source: 'custom' as const };
  });
  const expenses: Expense[] = (Array.isArray(v1.expenses) ? v1.expenses : []).map((e: Any) => {
    let cat = LEGACY_BUDGET_MAP[e.cat] ?? 'other';
    if (cat === 'clothing' && kw(String(e.description ?? '')) === 'photo') cat = 'photo';
    const amount = Number(e.amount) || 0;
    const paid = Number(e.paidAmount) || 0;
    return { id: String(e.id), cat, description: String(e.description ?? ''), estimated: amount, actual: paid > 0 ? amount : null, paid, dueDate: String(e.date ?? ''), notes: '', vendor: String(e.vendor ?? '') };
  });
  const sampleGuests: LocalGuest[] = (Array.isArray(v1.guests) ? v1.guests : []).map((g: Any) => ({
    id: String(g.id), name: String(g.name ?? ''), status: g.rsvp === 'yes' ? 'attending' : g.rsvp === 'no' ? 'declined' : 'pending', attendees: g.rsvp === 'no' ? 0 : Number(g.party) || 1, notes: '',
  }));
  const { profile: _p, cats: _c, tasks: _t, expenses: _e, guests: _g, contributions, favorites, compare, ...rest } = v1;
  return {
    ...base,
    onboarded: true,
    profile: {
      ...base.profile,
      name: String(p.name ?? ''), partnerName: String(p.partnerName ?? ''), lang: p.lang === 'ar' ? 'ar' : 'en',
      style: styleMap[p.style] ?? 'custom', guests, guestRange: rangeFor(guests), budget: Number(p.budget) || cats.reduce((a, c) => a + c.allocated, 0),
      dateMode: p.weddingDate ? 'date' : 'undecided', weddingDate: String(p.weddingDate ?? ''),
      priorities: (Array.isArray(v1.assumptions?.priorities) ? v1.assumptions.priorities : []).map((x: string) => prioMap[x]).filter(Boolean),
      isSample: false,
    },
    cats, tasks, expenses,
    contributions: (Array.isArray(contributions) ? contributions : []).map((k: Any) => ({ id: String(k.id), source: k.source === 'self' ? 'self' : k.source === 'fiance' ? 'partner' : k.source === 'other' ? 'other' : 'family', name: String(k.name ?? ''), amount: Number(k.amount) || 0, received: !!k.received, note: String(k.note ?? '') })),
    showContributions: Array.isArray(contributions) && contributions.length > 0,
    favorites: Array.isArray(favorites) ? favorites : [],
    compare: Array.isArray(compare) ? compare.slice(0, 3) : [],
    sampleGuests,
    archive: { fromVersion: 1, ...rest },
  };
}

function normalise(parsed: Any): AppState {
  const base = seedState();
  return { ...base, ...parsed, profile: { ...base.profile, ...parsed.profile }, invitationDraft: { ...sampleInvitation(), ...parsed.invitationDraft } } as AppState;
}

function load(): { state: AppState; error: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2 && parsed.profile) return { state: normalise(parsed), error: false };
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const v1 = JSON.parse(legacy);
      if (v1 && v1.version === 1 && v1.profile) return { state: migrateV1(v1), error: false };
    }
    return { state: seedState(), error: false };
  } catch {
    return { state: seedState(), error: true };
  }
}

interface Ctx {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
  storageError: boolean;
  quizOpen: boolean;
  setQuizOpen: (o: boolean) => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const initial = useRef(load());
  const [state, setState] = useState<AppState>(initial.current.state);
  const [storageError, setStorageError] = useState(initial.current.error);
  const [quizOpen, setQuizOpen] = useState(false);

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
  /** Resets local planner data only. Live invitation + RSVP data on the server is never touched. */
  const reset = useCallback(() => setState((s) => {
    const fresh = seedState();
    return { ...fresh, onboarded: true, profile: { ...fresh.profile, lang: s.profile.lang }, invitationSyncedId: null, guestsMigrated: s.guestsMigrated, sampleGuests: s.guestsMigrated ? [] : fresh.sampleGuests, archive: s.archive };
  }), []);

  return <AppCtx.Provider value={{ state, update, reset, storageError, quizOpen, setQuizOpen }}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
