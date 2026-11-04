import { L, aed, fmtDate } from './i18n';
import { daysUntil, finance, optimise } from './calc';
import { VENDORS } from './seed';
import type { AppState, Lang } from './types';

export function buildContext(s: AppState) {
  const f = finance(s);
  const ids = s.compare.length ? s.compare : s.favorites.length ? s.favorites : s.plan.map(p => p.vendorId);
  const context = {
    weddingDate: s.profile.weddingDate, style: L.style[s.profile.style].en,
    estimatedTotal: f.estimatedTotal, spent: f.spent,
    categories: s.cats,
    vendors: ids.slice(0, 3).map(id => {
      const v = VENDORS.find(x => x.id === id);
      return v ? { name: v.name, rating: v.rating, packages: v.packages.map(p => ({name: p.name, price: p.price})) } : null;
    }).filter(Boolean),
    expenses: s.expenses.filter(e => e.status !== 'paid').sort((a,b) => a.date.localeCompare(b.date)).slice(0, 12).map(e => ({description:e.description.slice(0,120),amount:e.amount,paidAmount:e.paidAmount,date:e.date})),
    tasks: s.tasks.filter(t => !t.done).sort((a,b) => (a.deadline || '9').localeCompare(b.deadline || '9')).slice(0,8).map(t => ({title:t.title.slice(0,120),deadline:t.deadline,done:t.done})),
    recommendations: optimise(s, s.profile.lang).slice(0, 5),
  };
  return JSON.stringify(context);
}

/** Transparent local rule-based answer, used if the server is unreachable */
export function localAnswer(msg: string, s: AppState, lang: Lang) {
  const f = finance(s);
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const m = msg.toLowerCase();
  const lines: string[] = [];
  const guestsMatch = m.match(/(\d{2,3})\s*(more|extra|additional)?\s*guest|ضيف|ضيوف/);
  if (/save|month|ادخ|شهري/.test(m)) {
    lines.push(t(`Remaining expenses are ${aed(f.remainingExpenses)}; savings plus received contributions cover ${aed(f.available)}.`, `المصاريف المتبقية ${aed(f.remainingExpenses, 'ar')}؛ والمدخرات مع المساهمات المستلمة تغطي ${aed(f.available, 'ar')}.`));
    lines.push(f.requiredSavings === 0 ? t('No further savings are needed under these sample figures.', 'لا حاجة لادخار إضافي وفق هذه الأرقام التجريبية.') : t(`Save about ${aed(f.monthlyTarget)} per month (your capacity: ${aed(s.profile.monthlyCapacity)}).`, `ادخر نحو ${aed(f.monthlyTarget, 'ar')} شهرياً (قدرتك: ${aed(s.profile.monthlyCapacity, 'ar')}).`));
  }
  if (/exceed|over|budget|تجاوز|ميزاني/.test(m)) {
    lines.push(f.overBudget > 0 ? t(`Your planned total is ${aed(f.estimatedTotal)}, which is ${aed(f.overBudget)} above your ${aed(s.profile.budget)} target.`, `إجمالي خطتك ${aed(f.estimatedTotal, 'ar')} أي أعلى بـ ${aed(f.overBudget, 'ar')} من هدفك.`) : t(`You are within your target with ${aed(-f.overBudget)} of headroom.`, `أنت ضمن الهدف مع هامش ${aed(-f.overBudget, 'ar')}.`));
  }
  if (guestsMatch || /guest/.test(m)) {
    const n = Number((m.match(/(\d{2,3})/) || [])[1] || 50);
    const extra = n * s.assumptions.cateringPerGuest;
    lines.push(t(`Each additional guest adds about ${aed(s.assumptions.cateringPerGuest)} in catering (sample). ${n} more guests ≈ ${aed(extra)}.`, `كل ضيف إضافي يضيف نحو ${aed(s.assumptions.cateringPerGuest, 'ar')} للضيافة (مثال). ${n} ضيفاً إضافياً ≈ ${aed(extra, 'ar')}.`));
  }
  if (/pay first|which expense|priorit|أدفع|أولاً/.test(m)) {
    const due = s.expenses.filter((e) => e.status !== 'paid').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    lines.push(t('Pay in order of deadline, deposits that secure dates first:', 'ادفع حسب الموعد، مبتدئاً بالعربون الذي يثبّت المواعيد:'));
    due.forEach((e, i) => lines.push(`${i + 1}. ${e.description} — ${aed(e.amount - e.paidAmount, lang)} · ${fmtDate(e.date, lang)}`));
  }
  if (/task|organi|مهام|نظم/.test(m)) {
    const open = s.tasks.filter((x) => !x.done && x.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4);
    lines.push(t('Your next tasks by deadline:', 'مهامك القادمة حسب الموعد:'));
    open.forEach((x) => lines.push(`- ${x.title} (${daysUntil(x.deadline) < 0 ? t('overdue', 'متأخرة') : fmtDate(x.deadline, lang)})`));
  }
  if (/compare|venue|قارن|قاعة/.test(m)) {
    const ids = s.compare.length ? s.compare : s.favorites;
    const vs = ids.map((id) => VENDORS.find((v) => v.id === id)).filter(Boolean).slice(0, 3);
    if (vs.length) vs.forEach((v) => lines.push(`- ${v!.name}: ${aed(v!.packages[0].price, lang)}–${aed(v!.packages[2].price, lang)}, ${t('sample rating', 'تقييم تجريبي')} ${v!.rating}`));
    else lines.push(t('Add vendors to compare or favourites first.', 'أضف مزودين للمقارنة أو المفضلة أولاً.'));
  }
  if (/reduce|cut|cost|optimi|وفر|خفض|تقليل/.test(m) || lines.length === 0) {
    const tips = optimise(s, lang).slice(0, 4);
    lines.push(t(`Protected priorities kept untouched: ${s.assumptions.priorities.join(', ') || 'none'}.`, `الأولويات المحمية لن تُمس: ${s.assumptions.priorities.join('، ') || 'لا يوجد'}.`));
    tips.forEach((x) => lines.push(`- ${x.label}`));
  }
  lines.push(t('These are illustrative sample calculations, not market prices.', 'هذه حسابات توضيحية تجريبية وليست أسعار سوق.'));
  return { answer: lines.join('\n'), monthlyTarget: f.monthlyTarget, shortfall: Math.max(0, -f.gap) };
}
