import { L, useT } from '@/lib/i18n';
import { Field, Input, Select } from './kit';
import type { Lang, Profile, Stage, Style } from '@/lib/types';

export type ProfileDraft = Omit<Profile, 'guests' | 'budget' | 'savings' | 'monthlyCapacity' | 'mahrAgreed' | 'mahrPaid'> & { guests: string; budget: string; savings: string; monthlyCapacity: string };

export const toDraft = (p: Profile): ProfileDraft => ({ ...p, guests: String(p.guests), budget: p.budget ? String(p.budget) : '', savings: String(p.savings), monthlyCapacity: String(p.monthlyCapacity) });

export function validateDraft(d: ProfileDraft, t: (en: string, ar: string) => string) {
  const e: Record<string, string> = {};
  const num = (v: string) => (v.trim() === '' ? 0 : Number(v));
  if (!d.name.trim()) e.name = t('Please enter your first name.', 'يرجى إدخال اسمك الأول.');
  if (!d.weddingDate || isNaN(new Date(d.weddingDate).getTime())) e.weddingDate = t('Choose a valid date.', 'اختر تاريخاً صحيحاً.');
  const g = num(d.guests);
  if (!(g >= 1 && g <= 10000) || !Number.isInteger(g)) e.guests = t('Guests must be a whole number from 1 to 10,000.', 'عدد الضيوف رقم صحيح من ١ إلى ١٠٬٠٠٠.');
  (['budget', 'savings', 'monthlyCapacity'] as const).forEach((k) => { const v = num(d[k]); if (isNaN(v) || v < 0) e[k] = t('Must be zero or more.', 'يجب أن يكون صفراً أو أكثر.'); });
  return e;
}

export function ProfileFields({ d, set, err, only }: { d: ProfileDraft; set: (d: ProfileDraft) => void; err: Record<string, string>; only?: string[] }) {
  const { t, b } = useT();
  const show = (k: string) => !only || only.includes(k);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {show('name') && <Field label={t('First name', 'الاسم الأول')} error={err.name}><Input data-testid="input-profile-name" value={d.name} onChange={(e) => set({ ...d, name: e.target.value })} /></Field>}
      {show('partnerName') && <Field label={t('Partner\u2019s name (optional)', 'اسم الشريك (اختياري)')}><Input data-testid="input-profile-partner" value={d.partnerName} onChange={(e) => set({ ...d, partnerName: e.target.value })} /></Field>}
      {show('lang') && <Field label={t('Preferred language', 'اللغة المفضلة')}><Select data-testid="select-profile-lang" value={d.lang} onChange={(e) => set({ ...d, lang: e.target.value as Lang })}><option value="en">English</option><option value="ar">العربية</option></Select></Field>}
      {show('weddingDate') && <Field label={t('Wedding date', 'تاريخ الزفاف')} error={err.weddingDate}><Input data-testid="input-profile-date" type="date" value={d.weddingDate} onChange={(e) => set({ ...d, weddingDate: e.target.value })} /></Field>}
      {show('stage') && <Field label={t('Planning stage', 'مرحلة التخطيط')}><Select data-testid="select-profile-stage" value={d.stage} onChange={(e) => set({ ...d, stage: e.target.value as Stage })}>{(Object.keys(L.stage) as Stage[]).map((s) => <option key={s} value={s}>{b(L.stage[s])}</option>)}</Select></Field>}
      {show('guests') && <Field label={t('Estimated guest count', 'عدد الضيوف التقديري')} error={err.guests}><Input data-testid="input-profile-guests" type="number" min={1} value={d.guests} onChange={(e) => set({ ...d, guests: e.target.value })} /></Field>}
      {show('budget') && <Field label={t('Wedding budget, if known (AED)', 'ميزانية الزفاف إن وجدت (درهم)')} error={err.budget} hint={t('Leave blank to use the sum of your categories.', 'اتركه فارغاً لاستخدام مجموع الفئات.')}><Input data-testid="input-profile-budget" type="number" min={0} value={d.budget} onChange={(e) => set({ ...d, budget: e.target.value })} /></Field>}
      {show('savings') && <Field label={t('Current wedding savings (AED)', 'المدخرات الحالية (درهم)')} error={err.savings}><Input data-testid="input-profile-savings" type="number" min={0} value={d.savings} onChange={(e) => set({ ...d, savings: e.target.value })} /></Field>}
      {show('monthlyCapacity') && <Field label={t('Monthly savings capacity (AED)', 'القدرة الادخارية الشهرية (درهم)')} error={err.monthlyCapacity}><Input data-testid="input-profile-capacity" type="number" min={0} value={d.monthlyCapacity} onChange={(e) => set({ ...d, monthlyCapacity: e.target.value })} /></Field>}
      {show('style') && (
        <Field label={t('Preferred wedding style', 'نمط الزفاف المفضل')} className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(Object.keys(L.style) as Style[]).map((s) => (
              <button type="button" key={s} data-testid={`button-style-${s}`} onClick={() => set({ ...d, style: s })} className={`rounded-xl border px-3 py-3 text-sm transition ${d.style === s ? 'border-gold bg-forest text-ivory' : 'border-border bg-card text-forest hover:border-gold'}`}>{b(L.style[s])}</button>
            ))}
          </div>
        </Field>
      )}
    </div>
  );
}
