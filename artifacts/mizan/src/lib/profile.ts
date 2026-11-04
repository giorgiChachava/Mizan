import { addDays, addMonths, uid, VENDOR_CATS, VENDORS, type Vendor } from './seed';
import type { AppState, Bi, BlueprintCat, BudgetCat, BudgetCatId, GuestRange, Priority, Profile, Service, Task, Timeframe, WeddingStyle } from './types';

const P = (en: string, ar: string): Bi => ({ en, ar });

export const STYLE_OPTS: Record<WeddingStyle, Bi & { sub: Bi; img: string }> = {
  traditional: { ...P('Traditional Emirati', 'إماراتي تقليدي'), sub: P('Majlis, zaffa, heritage hospitality', 'مجلس وزفة وضيافة تراثية'), img: 'florals' },
  modern: { ...P('Modern Emirati', 'إماراتي عصري'), sub: P('Heritage roots, contemporary finish', 'جذور تراثية بلمسة معاصرة'), img: 'hero-stage' },
  classic: { ...P('Classic and elegant', 'كلاسيكي وأنيق'), sub: P('Timeless, refined, understated', 'خالد وراقٍ وهادئ'), img: 'attire' },
  grand: { ...P('Grand celebration', 'احتفال كبير'), sub: P('Ballroom scale, full production', 'قاعة كبرى وإنتاج كامل'), img: 'venue' },
  intimate: { ...P('Intimate celebration', 'احتفال عائلي صغير'), sub: P('Close family, warm and personal', 'العائلة المقربة بأجواء دافئة'), img: 'invitation' },
  custom: { ...P('Other / custom', 'أخرى / خاص'), sub: P('Your own combination', 'مزيجكم الخاص'), img: 'jewellery' },
};

export const GUEST_OPTS: Record<GuestRange, Bi & { mid: number }> = {
  u100: { ...P('Under 100', 'أقل من ١٠٠'), mid: 80 },
  '100-200': { ...P('100 – 200', '١٠٠ – ٢٠٠'), mid: 150 },
  '200-350': { ...P('200 – 350', '٢٠٠ – ٣٥٠'), mid: 280 },
  '350-500': { ...P('350 – 500', '٣٥٠ – ٥٠٠'), mid: 420 },
  '500+': { ...P('More than 500', 'أكثر من ٥٠٠'), mid: 600 },
};
export const rangeFor = (n: number): GuestRange => (n < 100 ? 'u100' : n <= 200 ? '100-200' : n <= 350 ? '200-350' : n <= 500 ? '350-500' : '500+');

export const BUDGET_PRESETS = [75000, 150000, 250000, 400000, 650000];

export const TIMEFRAME_OPTS: Record<Timeframe, Bi & { months: number }> = {
  '3m': { ...P('Within 3 months', 'خلال ٣ أشهر'), months: 3 },
  '6m': { ...P('In about 6 months', 'خلال ٦ أشهر تقريباً'), months: 6 },
  '12m': { ...P('In about a year', 'خلال سنة تقريباً'), months: 12 },
  '18m': { ...P('In 18 months', 'خلال ١٨ شهراً'), months: 18 },
  later: { ...P('Later / not sure yet', 'لاحقاً / لم نحدد'), months: 24 },
};

export const SERVICE_OPTS: Record<Service, Bi> = {
  venue: P('Venue', 'القاعة'), catering: P('Catering', 'الضيافة'), decoration: P('Decoration', 'الديكور'), photo: P('Photography', 'التصوير الفوتوغرافي'),
  video: P('Videography', 'التصوير المرئي'), beauty: P('Makeup and beauty', 'المكياج والتجميل'), clothing: P('Wedding dress and clothing', 'الفستان والأزياء'),
  jewellery: P('Jewellery', 'المجوهرات'), planning: P('Wedding planning', 'تنظيم الزفاف'), invitations: P('Invitations', 'الدعوات'),
};

export const PRIORITY_OPTS: Record<Priority, Bi> = {
  guests: P('Guest experience', 'تجربة الضيوف'), venue: P('Venue and atmosphere', 'المكان والأجواء'), food: P('Food and hospitality', 'الطعام والضيافة'),
  photo: P('Photography', 'التصوير'), decoration: P('Decoration', 'الديكور'), tradition: P('Traditional elements', 'العناصر التراثية'), budget: P('Staying within budget', 'الالتزام بالميزانية'),
};

/** Planning horizon in days from today, used for task deadlines */
export function horizonDays(p: Profile) {
  if (p.dateMode === 'date' && p.weddingDate) {
    const d = Math.round((new Date(p.weddingDate + 'T00:00:00').getTime() - Date.now()) / 86400000);
    return Math.max(30, d);
  }
  return (p.dateMode === 'timeframe' ? TIMEFRAME_OPTS[p.timeframe].months : 12) * 30;
}
export function effectiveDate(p: Profile): string {
  if (p.dateMode === 'date' && p.weddingDate) return p.weddingDate;
  return '';
}
export function approxDate(p: Profile): string {
  if (p.dateMode === 'date' && p.weddingDate) return p.weddingDate;
  if (p.dateMode === 'timeframe') return addMonths(TIMEFRAME_OPTS[p.timeframe].months);
  return '';
}

/* ---------------- Budget allocation ---------------- */
const BASE: Record<BudgetCatId, number> = { venue: 26, catering: 24, decoration: 9, photo: 8, clothing: 12, jewellery: 10, invitations: 3, other: 8 };
const SERVICE_CAT: Partial<Record<Service, BudgetCatId>> = { venue: 'venue', catering: 'catering', decoration: 'decoration', photo: 'photo', clothing: 'clothing', jewellery: 'jewellery', invitations: 'invitations' };

export function allocate(p: Profile): BudgetCat[] {
  const w = { ...BASE };
  // Services the couple does not need get a reduced (not zero) share
  (Object.entries(SERVICE_CAT) as [Service, BudgetCatId][]).forEach(([s, c]) => { if (!p.services.includes(s)) w[c] *= 0.3; });
  if (!p.services.includes('photo') && p.services.includes('video')) w.photo = BASE.photo * 0.8;
  if (p.services.includes('beauty') && !p.services.includes('clothing')) w.clothing = BASE.clothing * 0.5;
  if (p.services.includes('planning')) w.other += 5;
  // Priorities
  const boost: Record<Priority, Partial<Record<BudgetCatId, number>>> = {
    guests: { catering: 1.15, invitations: 1.3, other: 1.1 }, venue: { venue: 1.25, decoration: 1.1 }, food: { catering: 1.25 },
    photo: { photo: 1.4 }, decoration: { decoration: 1.4 }, tradition: { clothing: 1.15, jewellery: 1.2 }, budget: { other: 1.4 },
  };
  p.priorities.forEach((pr) => Object.entries(boost[pr]).forEach(([c, m]) => { w[c as BudgetCatId] *= m as number; }));
  // Style
  const style: Record<WeddingStyle, Partial<Record<BudgetCatId, number>>> = {
    traditional: { jewellery: 1.15, catering: 1.05 }, modern: { decoration: 1.1, photo: 1.1 }, classic: { clothing: 1.1 },
    grand: { venue: 1.2, decoration: 1.25 }, intimate: { venue: 0.7, decoration: 0.8, photo: 1.1 }, custom: {},
  };
  Object.entries(style[p.style]).forEach(([c, m]) => { w[c as BudgetCatId] *= m as number; });
  // Larger guest counts lean on catering
  const g = Math.max(1, p.guests);
  w.catering *= g > 450 ? 1.2 : g < 120 ? 0.8 : 1;
  const total = Object.values(w).reduce((a, x) => a + x, 0);
  const ids = Object.keys(BASE) as BudgetCatId[];
  const out = ids.map((id) => ({ id, allocated: Math.round(((p.budget * w[id]) / total) / 100) * 100 }));
  const diff = p.budget - out.reduce((a, c) => a + c.allocated, 0);
  out[out.length - 1].allocated = Math.max(0, out[out.length - 1].allocated + diff);
  return out;
}

/* ---------------- Suggested checklist ---------------- */
interface Suggest { key: string; cat: BlueprintCat; title: string; at: number /* fraction of horizon */; when: (p: Profile) => boolean }
const has = (s: Service) => (p: Profile) => p.services.includes(s);
const SUGGESTIONS: Suggest[] = [
  { key: 'venue-book', cat: 'venue', title: 'Visit and book the venue', at: 0.15, when: has('venue') },
  { key: 'venue-capacity', cat: 'venue', title: 'Confirm capacity for your guest count', at: 0.2, when: (p) => p.services.includes('venue') && p.guests > 350 },
  { key: 'venue-separate', cat: 'venue', title: 'Decide on the celebration format that suits both families', at: 0.1, when: (p) => p.style === 'traditional' || p.priorities.includes('tradition') },
  { key: 'venue-home', cat: 'venue', title: 'Plan the family home or majlis set-up', at: 0.3, when: (p) => p.style === 'intimate' },
  { key: 'planner', cat: 'venue', title: 'Interview two wedding planners', at: 0.08, when: has('planning') },
  { key: 'catering-tasting', cat: 'catering', title: 'Arrange a catering tasting', at: 0.3, when: has('catering') },
  { key: 'catering-coffee', cat: 'catering', title: 'Plan Arabic coffee, dates and welcome hospitality', at: 0.6, when: (p) => p.style === 'traditional' || p.priorities.includes('tradition') || p.priorities.includes('food') },
  { key: 'catering-count', cat: 'catering', title: 'Send the final headcount to the caterer', at: 0.93, when: has('catering') },
  { key: 'clothing-dress', cat: 'clothing', title: 'Begin dress and abaya consultations', at: 0.25, when: has('clothing') },
  { key: 'clothing-groom', cat: 'clothing', title: 'Order groom kandura and bisht', at: 0.6, when: has('clothing') },
  { key: 'beauty-trial', cat: 'clothing', title: 'Book makeup and hair trial', at: 0.75, when: has('beauty') },
  { key: 'jewellery-set', cat: 'clothing', title: 'Choose bridal jewellery set', at: 0.45, when: has('jewellery') },
  { key: 'photo-book', cat: 'photo', title: 'Shortlist and book a photographer', at: 0.25, when: has('photo') },
  { key: 'video-book', cat: 'photo', title: 'Book a videographer', at: 0.3, when: has('video') },
  { key: 'photo-shotlist', cat: 'photo', title: 'Share a shot list and privacy preferences', at: 0.85, when: (p) => p.services.includes('photo') || p.services.includes('video') },
  { key: 'inv-list', cat: 'invitations', title: 'Draft the guest list', at: 0.12, when: () => true },
  { key: 'inv-send', cat: 'invitations', title: 'Create and send the digital invitation', at: 0.7, when: has('invitations') },
  { key: 'inv-rsvp', cat: 'invitations', title: 'Follow up on pending RSVPs', at: 0.88, when: (p) => p.priorities.includes('guests') || p.guests > 200 },
  { key: 'decor-concept', cat: 'decoration', title: 'Agree the decoration concept and stage', at: 0.4, when: has('decoration') },
  { key: 'decor-final', cat: 'decoration', title: 'Final walkthrough with all vendors', at: 0.96, when: () => true },
  { key: 'budget-review', cat: 'decoration', title: 'Review budget against quotes', at: 0.5, when: (p) => p.priorities.includes('budget') },
];

export function suggestedTasks(p: Profile): Task[] {
  const h = horizonDays(p);
  return SUGGESTIONS.filter((s) => s.when(p)).map((s) => ({ id: uid(), cat: s.cat, title: s.title, done: false, deadline: addDays(Math.round(h * s.at)), notes: '', source: 'profile' as const, suggestKey: s.key }));
}

/**
 * Apply a saved quiz profile. Never touches expenses, completed tasks, custom tasks or sample tasks.
 * Only refreshes open, untouched profile-suggested tasks, and re-scales category allocations.
 */
export function applyProfile(s: AppState, p: Profile, opts: { reallocate: boolean }): AppState {
  const next = suggestedTasks(p);
  const nextKeys = new Set(next.map((x) => x.suggestKey));
  const kept = s.tasks.filter((x) => x.source !== 'profile' || x.done || (x.suggestKey && nextKeys.has(x.suggestKey)));
  const existingKeys = new Set(kept.map((x) => x.suggestKey).filter(Boolean));
  const titles = new Set(kept.map((x) => x.title.toLowerCase()));
  const added = next.filter((x) => !existingKeys.has(x.suggestKey) && !titles.has(x.title.toLowerCase()));
  return { ...s, onboarded: true, profile: p, tasks: [...kept, ...added], cats: opts.reallocate && p.budget > 0 ? allocate(p) : s.cats };
}

/* ---------------- Vendor recommendations ---------------- */
export interface Rec { vendor: Vendor; score: number; reasons: Bi[] }
export function recommend(s: AppState, limit = 3): Rec[] {
  const p = s.profile;
  const alloc = Object.fromEntries(s.cats.map((c) => [c.id, c.allocated])) as Record<BudgetCatId, number>;
  const recs = VENDORS.map((v) => {
    const meta = VENDOR_CATS[v.cat];
    const reasons: Bi[] = [];
    let score = v.rating;
    if (p.services.includes(meta.service)) { score += 3; reasons.push(P(`You need ${SERVICE_OPTS[meta.service].en.toLowerCase()}`, `تحتاجون ${SERVICE_OPTS[meta.service].ar}`)); }
    else score -= 4;
    if (meta.priority && p.priorities.includes(meta.priority)) { score += 2; reasons.push(P(`Priority: ${PRIORITY_OPTS[meta.priority].en}`, `أولوية: ${PRIORITY_OPTS[meta.priority].ar}`)); }
    if (v.styles.includes(p.style)) { score += 2; reasons.push(P(`Suits ${STYLE_OPTS[p.style].en}`, `يناسب ${STYLE_OPTS[p.style].ar}`)); }
    const a = alloc[meta.budget] ?? 0;
    if (a > 0 && v.packages[0].price <= a) { score += 1.5; reasons.push(P('Fits your allocation', 'ضمن مخصصاتكم')); }
    else if (a > 0) score -= 2;
    if (p.priorities.includes('budget') && v.band === 'value') score += 1;
    if (v.capacity) {
      if (v.capacity >= p.guests) { score += 1; reasons.push(P(`Hosts ${p.guests}+ guests`, `يستوعب ${p.guests}+ ضيف`)); }
      else score -= 5;
    }
    return { vendor: v, score, reasons: reasons.slice(0, 3) };
  });
  // Diversity: best per category first
  const sorted = recs.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const first = sorted.filter((r) => (seen.has(r.vendor.cat) ? false : (seen.add(r.vendor.cat), true)));
  return [...first, ...sorted.filter((r) => !first.includes(r))].slice(0, limit);
}
export function scoreMap(s: AppState): Record<string, Rec> {
  return Object.fromEntries(recommend(s, VENDORS.length).map((r) => [r.vendor.id, r]));
}
