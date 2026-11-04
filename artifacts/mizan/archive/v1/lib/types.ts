export type Lang = 'en' | 'ar';
export type Bi = { en: string; ar: string };

export type Style = 'traditional' | 'modern' | 'contemporary' | 'custom';
export type Stage = 'just-engaged' | 'early' | 'booking' | 'final';

export interface Profile {
  name: string;
  partnerName: string;
  lang: Lang;
  weddingDate: string; // yyyy-mm-dd
  stage: Stage;
  guests: number;
  budget: number;
  savings: number;
  monthlyCapacity: number;
  style: Style;
  mahrAgreed: number;
  mahrPaid: number;
  mahrNotes: string;
  separateCelebrations: boolean;
}

export type BudgetCatId = 'venue' | 'catering' | 'prep' | 'mahr' | 'invites' | 'other';
export interface BudgetCat { id: BudgetCatId; allocated: number }

export type BlueprintCat = 'engagement' | 'venue' | 'prep' | 'invites' | 'finance' | 'day';
export interface Task {
  id: string;
  cat: BlueprintCat;
  title: string;
  done: boolean;
  deadline: string;
  assignee: string; // 'me' or collaborator id
  notes: string;
  estimate: number;
}

export type PayStatus = 'paid' | 'partial' | 'unpaid';
export interface Expense {
  id: string;
  cat: BudgetCatId;
  description: string;
  amount: number;
  paidAmount: number;
  date: string; // payment / due date
  status: PayStatus;
  vendor: string;
}

export type ContribSource = 'self' | 'fiance' | 'parents' | 'family' | 'other';
export interface Contribution {
  id: string;
  source: ContribSource;
  name: string;
  amount: number;
  received: boolean;
  note: string;
}

export type Rsvp = 'pending' | 'yes' | 'no';
export interface Guest { id: string; name: string; side: 'family-a' | 'family-b' | 'friends'; party: number; rsvp: Rsvp; phone: string }

export interface ScheduleItem { id: string; time: string; title: string; owner: string; contact: string; kind: 'arrival' | 'setup' | 'photo' | 'ceremony' | 'catering' | 'other' }

export type Role = 'fiance' | 'parent' | 'sibling' | 'coordinator' | 'family';
export interface Collaborator {
  id: string;
  name: string;
  contact: string;
  role: Role;
  status: 'invited' | 'accepted';
  sharedCats: BudgetCatId[];
  shareGuests: boolean;
  shareTasks: boolean;
}

export interface Comment { id: string; author: string; text: string; date: string; taskId?: string }

export interface ChatMsg { id: string; role: 'user' | 'assistant'; text: string; offline?: boolean; monthlyTarget?: number; shortfall?: number }

export interface PlanItem { vendorId: string; pkg: number; expenseId: string }

export type VenueType = 'home' | 'hall' | 'hotel';
export type Tier = 'basic' | 'standard' | 'premium';
export interface Assumptions {
  cateringPerGuest: number;
  linkCatering: boolean;
  venue: Record<VenueType, number>;
  catering: Record<Tier, number>; // per guest
  decoration: Record<Tier, number>;
  photo: Record<Tier, number>;
  sim: { guests: number; venue: VenueType; catering: Tier; decoration: Tier; photo: Tier; months: number };
  priorities: string[]; // protected keys
}

export interface SupportInputs { age: '' | '18-24' | '25-30' | '31-40' | '40+'; income: '' | 'under15' | '15-30' | '30-50' | 'over50'; employment: '' | 'employed' | 'self' | 'student' | 'seeking'; national: '' | 'yes' | 'no'; firstMarriage: '' | 'yes' | 'no'; workshop: boolean }

export interface AppState {
  version: number;
  profile: Profile;
  cats: BudgetCat[];
  tasks: Task[];
  expenses: Expense[];
  contributions: Contribution[];
  guests: Guest[];
  schedule: ScheduleItem[];
  collaborators: Collaborator[];
  comments: Comment[];
  chat: ChatMsg[];
  favorites: string[];
  compare: string[];
  plan: PlanItem[];
  assumptions: Assumptions;
  support: SupportInputs;
  readNotifs: string[];
}
