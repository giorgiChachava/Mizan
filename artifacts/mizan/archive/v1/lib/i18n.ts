import { useApp } from './store';
import type { Bi, BlueprintCat, BudgetCatId, ContribSource, PayStatus, Role, Rsvp, Stage, Style, Tier, VenueType } from './types';

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
    venue: { en: 'Venue & decoration', ar: 'القاعة والديكور' },
    catering: { en: 'Catering & hospitality', ar: 'الضيافة والولائم' },
    prep: { en: 'Bridal & groom preparation', ar: 'تجهيزات العروسين' },
    mahr: { en: 'Mahr & jewellery', ar: 'المهر والمجوهرات' },
    invites: { en: 'Invitations & gifts', ar: 'الدعوات والهدايا' },
    other: { en: 'Other expenses', ar: 'مصاريف أخرى' },
  } as Record<BudgetCatId, Bi>,
  blueprint: {
    engagement: { en: 'Engagement & Mahr', ar: 'الخطوبة والمهر' },
    venue: { en: 'Venue & Ceremony', ar: 'القاعة والحفل' },
    prep: { en: 'Bridal & Groom Preparation', ar: 'تجهيزات العروسين' },
    invites: { en: 'Invitations & Traditions', ar: 'الدعوات والعادات' },
    finance: { en: 'Expenses & Budget', ar: 'المصاريف والميزانية' },
    day: { en: 'Wedding Day Planner', ar: 'مخطط يوم العرس' },
  } as Record<BlueprintCat, Bi>,
  pay: {
    paid: { en: 'Paid', ar: 'مدفوع' },
    partial: { en: 'Partially paid', ar: 'مدفوع جزئياً' },
    unpaid: { en: 'Unpaid', ar: 'غير مدفوع' },
  } as Record<PayStatus, Bi>,
  contrib: {
    self: { en: 'Myself', ar: 'أنا' },
    fiance: { en: 'Fiancé(e)', ar: 'الخطيب/ة' },
    parents: { en: 'Parents', ar: 'الوالدان' },
    family: { en: 'Other family', ar: 'أفراد العائلة' },
    other: { en: 'Other source', ar: 'مصدر آخر' },
  } as Record<ContribSource, Bi>,
  role: {
    fiance: { en: 'Fiancé(e)', ar: 'الخطيب/ة' },
    parent: { en: 'Parent', ar: 'أحد الوالدين' },
    sibling: { en: 'Sibling', ar: 'أخ / أخت' },
    coordinator: { en: 'Wedding coordinator', ar: 'منسق/ة الأعراس' },
    family: { en: 'Other family member', ar: 'فرد من العائلة' },
  } as Record<Role, Bi>,
  rsvp: {
    pending: { en: 'Awaiting', ar: 'بانتظار الرد' },
    yes: { en: 'Attending', ar: 'سيحضر' },
    no: { en: 'Declined', ar: 'اعتذر' },
  } as Record<Rsvp, Bi>,
  style: {
    traditional: { en: 'Traditional Emirati', ar: 'إماراتي تقليدي' },
    modern: { en: 'Modern Emirati', ar: 'إماراتي عصري' },
    contemporary: { en: 'Contemporary', ar: 'معاصر' },
    custom: { en: 'Custom combination', ar: 'مزيج خاص' },
  } as Record<Style, Bi>,
  stage: {
    'just-engaged': { en: 'Just engaged', ar: 'خطوبة حديثة' },
    early: { en: 'Early planning', ar: 'بداية التخطيط' },
    booking: { en: 'Booking vendors', ar: 'حجز المزودين' },
    final: { en: 'Final preparations', ar: 'التحضيرات الأخيرة' },
  } as Record<Stage, Bi>,
  venue: {
    home: { en: 'Family home / majlis', ar: 'بيت العائلة / المجلس' },
    hall: { en: 'Wedding hall', ar: 'قاعة أفراح' },
    hotel: { en: 'Hotel ballroom', ar: 'قاعة فندق' },
  } as Record<VenueType, Bi>,
  tier: {
    basic: { en: 'Basic', ar: 'أساسي' },
    standard: { en: 'Standard', ar: 'قياسي' },
    premium: { en: 'Premium', ar: 'فاخر' },
  } as Record<Tier, Bi>,
};
