import { addMonths } from './seed';
import type { AppState, Assumptions, BudgetCatId, Lang } from './types';
import { L, aed } from './i18n';

export function monthsBetween(fromISO: string, toISO: string) {
  const a = new Date(fromISO + 'T00:00:00').getTime();
  const b = new Date(toISO + 'T00:00:00').getTime();
  return (b - a) / (1000 * 60 * 60 * 24 * 30.4375);
}
export function daysUntil(iso: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

export function finance(s: AppState) {
  const planned = s.cats.reduce((a, c) => a + c.allocated, 0);
  const expensesTotal = s.expenses.reduce((a, e) => a + e.amount, 0);
  const spent = s.expenses.reduce((a, e) => a + e.paidAmount, 0);
  const outstanding = s.expenses.reduce((a, e) => a + Math.max(0, e.amount - e.paidAmount), 0);
  const spentByCat = {} as Record<BudgetCatId, number>;
  const committedByCat = {} as Record<BudgetCatId, number>;
  s.cats.forEach((c) => { spentByCat[c.id] = 0; committedByCat[c.id] = 0; });
  s.expenses.forEach((e) => { spentByCat[e.cat] = (spentByCat[e.cat] || 0) + e.paidAmount; committedByCat[e.cat] = (committedByCat[e.cat] || 0) + e.amount; });
  const contribPledged = s.contributions.filter((c) => !c.received).reduce((a, c) => a + c.amount, 0);
  const contribReceived = s.contributions.filter((c) => c.received).reduce((a, c) => a + c.amount, 0);
  const estimatedTotal = Math.max(planned, expensesTotal);
  const remainingExpenses = Math.max(0, estimatedTotal - spent);
  // Only received contributions are available; unreceived pledges are not cash.
  const available = s.profile.savings + contribReceived;
  const requiredSavings = Math.max(0, remainingExpenses - available);
  const days = daysUntil(s.profile.weddingDate);
  const past = days <= 0;
  const monthsRaw = monthsBetween(new Date().toISOString().slice(0, 10), s.profile.weddingDate);
  const months = past ? 0 : Math.max(monthsRaw, 0);
  const monthlyTarget = requiredSavings === 0 ? 0 : past ? requiredSavings : requiredSavings / months;
  const projected = available + s.profile.monthlyCapacity * Math.max(0, monthsRaw);
  const gap = projected - remainingExpenses; // + surplus / - shortfall
  const sufficient = requiredSavings === 0 || (!past && s.profile.monthlyCapacity >= monthlyTarget);
  const monthsNeeded = s.profile.monthlyCapacity > 0 ? Math.ceil(requiredSavings / s.profile.monthlyCapacity) : Infinity;
  const altDate = isFinite(monthsNeeded) ? addMonths(monthsNeeded) : '';
  const overBudget = estimatedTotal - s.profile.budget;
  const done = s.tasks.filter((t) => t.done).length;
  const progress = s.tasks.length ? Math.round((done / s.tasks.length) * 100) : 0;
  return { planned, expensesTotal, spent, outstanding, spentByCat, committedByCat, contribPledged, contribReceived, estimatedTotal, remainingExpenses, available, requiredSavings, days, past, months, monthsRaw, monthlyTarget, projected, gap, sufficient, monthsNeeded, altDate, overBudget, done, progress };
}

export function simulate(a: Assumptions, otherFixed: number, savings: number) {
  const sm = a.sim;
  const venue = a.venue[sm.venue];
  const catering = sm.guests * a.catering[sm.catering];
  const decoration = a.decoration[sm.decoration];
  const photo = a.photo[sm.photo];
  const total = venue + catering + decoration + photo + otherFixed;
  const need = Math.max(0, total - savings);
  const monthly = sm.months > 0 ? need / sm.months : need;
  return { venue, catering, decoration, photo, other: otherFixed, total, need, monthly };
}

/** Rule-based optimisation suggestions that respect protected priorities */
export function optimise(s: AppState, lang: Lang) {
  const a = s.assumptions;
  const sm = a.sim;
  const prot = new Set(a.priorities);
  const tips: { key: string; text: string; saving: number }[] = [];
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const tierDown = (x: 'basic' | 'standard' | 'premium') => (x === 'premium' ? 'standard' : x === 'standard' ? 'basic' : null);
  if (!prot.has('venue') && sm.venue !== 'home') {
    const to = sm.venue === 'hotel' ? 'hall' : 'home';
    const sv = a.venue[sm.venue] - a.venue[to];
    tips.push({ key: 'venue', saving: sv, text: t(`Compare a ${L.venue[to].en.toLowerCase()} instead of a ${L.venue[sm.venue].en.toLowerCase()}`, `قارن ${L.venue[to].ar} بدلاً من ${L.venue[sm.venue].ar}`) });
  }
  const dd = tierDown(sm.decoration);
  if (!prot.has('decoration') && dd) tips.push({ key: 'decoration', saving: a.decoration[sm.decoration] - a.decoration[dd], text: t(`Move decoration from ${sm.decoration} to ${dd}`, `خفّض الديكور من ${L.tier[sm.decoration].ar} إلى ${L.tier[dd].ar}`) });
  const pd = tierDown(sm.photo);
  if (!prot.has('photo') && pd) tips.push({ key: 'photo', saving: a.photo[sm.photo] - a.photo[pd], text: t(`Choose the ${pd} photography package`, `اختر باقة التصوير ${L.tier[pd].ar}`) });
  const cd = tierDown(sm.catering);
  if (!prot.has('catering') && cd) tips.push({ key: 'catering', saving: sm.guests * (a.catering[sm.catering] - a.catering[cd]), text: t(`Compare the ${cd} catering menu`, `قارن قائمة الضيافة ${L.tier[cd].ar}`) });
  if (!prot.has('guests') && sm.guests > 100) tips.push({ key: 'guests', saving: 30 * a.catering[sm.catering], text: t('Trim the guest list by 30', 'قلّل قائمة الضيوف بمقدار ٣٠ ضيفاً') });
  return tips.sort((x, y) => y.saving - x.saving).map((x) => ({ ...x, label: `${x.text} — ${t('saves about', 'توفير تقريبي')} ${aed(x.saving, lang)} (${t('sample', 'مثال')})` }));
}
