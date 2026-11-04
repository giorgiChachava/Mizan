import { useApp } from './store';
import type { Bi, BlueprintCat, BudgetCatId, ContribSource } from './types';

export function useT() {
  const { state } = useApp();
  const lang = state.profile.lang;
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const b = (x: Bi) => x[lang];
  return { t, b, lang, isAr: lang === 'ar' };
}

export const aed = (n: number, lang: 'en' | 'ar' = 'en') => {
  const v = Math.round(n).toLocaleString('en-US');
  return lang === 'ar' ? `${v} د.إ` : `AED ${v}`;
};

export const fmtDate = (iso: string, lang: 'en' | 'ar') => {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const L = {
  budgetCat: {
    venue: { en: 'Venue and hall', ar: 'القاعة والمكان' },
    catering: { en: 'Catering and hospitality', ar: 'الضيافة والولائم' },
    decoration: { en: 'Decoration', ar: 'الديكور' },
    photo: { en: 'Photography and videography', ar: 'التصوير الفوتوغرافي والمرئي' },
    clothing: { en: 'Clothing and beauty', ar: 'الأزياء والتجميل' },
    jewellery: { en: 'Jewellery', ar: 'المجوهرات' },
    invitations: { en: 'Invitations', ar: 'الدعوات' },
    other: { en: 'Other wedding expenses', ar: 'مصاريف أخرى' },
  } as Record<BudgetCatId, Bi>,
  blueprint: {
    venue: { en: 'Venue and arrangements', ar: 'القاعة والترتيبات' },
    catering: { en: 'Catering and hospitality', ar: 'الضيافة والولائم' },
    clothing: { en: 'Clothing and preparation', ar: 'الأزياء والتجهيزات' },
    photo: { en: 'Photography and videography', ar: 'التصوير الفوتوغرافي والمرئي' },
    invitations: { en: 'Invitations and guests', ar: 'الدعوات والضيوف' },
    decoration: { en: 'Decoration and final preparations', ar: 'الديكور والتحضيرات الأخيرة' },
  } as Record<BlueprintCat, Bi>,
  contrib: {
    self: { en: 'Our savings', ar: 'مدخراتنا' },
    partner: { en: 'Partner', ar: 'الشريك' },
    family: { en: 'Family', ar: 'العائلة' },
    other: { en: 'Other', ar: 'أخرى' },
  } as Record<ContribSource, Bi>,
  guestStatus: {
    pending: { en: 'Awaiting reply', ar: 'بانتظار الرد' },
    attending: { en: 'Attending', ar: 'سيحضر' },
    declined: { en: 'Declined', ar: 'اعتذر' },
  } as Record<'pending' | 'attending' | 'declined', Bi>,
};
