import type { InvitationInput } from '@workspace/api-client-react';

export type Lang = 'en' | 'ar';
export type Bi = { en: string; ar: string };

/* ---------- Wedding profile (quiz) ---------- */
export type WeddingStyle = 'traditional' | 'modern' | 'classic' | 'grand' | 'intimate' | 'custom';
export type GuestRange = 'u100' | '100-200' | '200-350' | '350-500' | '500+';
export type Service = 'venue' | 'catering' | 'decoration' | 'photo' | 'video' | 'beauty' | 'clothing' | 'jewellery' | 'planning' | 'invitations';
export type Priority = 'guests' | 'venue' | 'food' | 'photo' | 'decoration' | 'tradition' | 'budget';
export type DateMode = 'date' | 'timeframe' | 'undecided';
export type Timeframe = '3m' | '6m' | '12m' | '18m' | 'later';

export interface Profile {
  name: string;
  partnerName: string;
  lang: Lang;
  style: WeddingStyle;
  customStyle: string;
  guestRange: GuestRange;
  guests: number;
  budget: number;
  dateMode: DateMode;
  weddingDate: string; // yyyy-mm-dd when dateMode === 'date'
  timeframe: Timeframe;
  services: Service[];
  priorities: Priority[];
  isSample: boolean;
}

/* ---------- Budget ---------- */
export type BudgetCatId = 'venue' | 'catering' | 'decoration' | 'photo' | 'clothing' | 'jewellery' | 'invitations' | 'other';
export interface BudgetCat { id: BudgetCatId; allocated: number }

export interface Expense {
  id: string;
  cat: BudgetCatId;
  description: string;
  estimated: number;
  actual: number | null; // null = not yet known
  paid: number;
  dueDate: string;
  notes: string;
  vendor: string;
  sample?: boolean;
}

export type ContribSource = 'self' | 'partner' | 'family' | 'other';
export interface Contribution { id: string; source: ContribSource; name: string; amount: number; received: boolean; note: string; sample?: boolean }

/* ---------- Blueprint ---------- */
export type BlueprintCat = 'venue' | 'catering' | 'clothing' | 'photo' | 'invitations' | 'decoration';
export interface Task {
  id: string;
  cat: BlueprintCat;
  title: string;
  done: boolean;
  deadline: string;
  notes: string;
  source: 'sample' | 'profile' | 'custom';
  suggestKey?: string;
}

/* ---------- Vendors ---------- */
export interface Enquiry { id: string; vendorId: string; name: string; contact: string; date: string; guests: number; message: string; createdAt: string }

/* ---------- Invitations (local draft only; live data lives on the server) ---------- */
export type InvitationDraft = InvitationInput;
export interface LocalGuest { id: string; name: string; status: 'pending' | 'attending' | 'declined'; attendees: number; notes: string }

export interface AppState {
  version: 2;
  onboarded: boolean;
  profile: Profile;
  cats: BudgetCat[];
  tasks: Task[];
  expenses: Expense[];
  contributions: Contribution[];
  showContributions: boolean;
  favorites: string[];
  compare: string[];
  enquiries: Enquiry[];
  invitationDraft: InvitationDraft;
  /** server invitation id the draft was last synced from */
  invitationSyncedId: string | null;
  /** sample guests shown before the first save; moved to the server once */
  sampleGuests: LocalGuest[];
  guestsMigrated: boolean;
  /** untouched legacy v1 fields (assistant, family, support…) kept for future use */
  archive?: Record<string, unknown>;
}
