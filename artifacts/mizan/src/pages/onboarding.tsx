import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { syncCatering, useApp } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { IMG } from '@/lib/seed';
import { Btn } from '@/components/kit';
import { ProfileFields, toDraft, validateDraft, type ProfileDraft } from '@/components/profile-form';
import { applyDraft } from './settings';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS: { keys: string[]; img: string; en: string; ar: string; optional?: boolean }[] = [
  { keys: ['name', 'partnerName', 'lang'], img: 'hero-stage', en: 'Let\u2019s begin with you', ar: 'لنبدأ بك' },
  { keys: ['weddingDate', 'stage'], img: 'venue', en: 'When is the big day?', ar: 'متى اليوم الكبير؟' },
  { keys: ['guests', 'style'], img: 'florals', en: 'Your guests and your style', ar: 'ضيوفك وأسلوبك' },
  { keys: ['budget', 'savings', 'monthlyCapacity'], img: 'jewellery', en: 'Your financial picture', ar: 'صورتك المالية', optional: true },
];

export default function Onboarding() {
  const { state, update } = useApp();
  const { t, isAr } = useT();
  const [, nav] = useLocation();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<ProfileDraft>(toDraft(state.profile));
  const [err, setErr] = useState<Record<string, string>>({});
  const s = STEPS[step];

  const next = (skip = false) => {
    const e = validateDraft(skip ? { ...d, budget: '', savings: '0', monthlyCapacity: '0' } : d, t);
    const stepErr = Object.fromEntries(Object.entries(e).filter(([k]) => s.keys.includes(k)));
    setErr(stepErr);
    if (Object.keys(stepErr).length) return;
    if (d.lang !== state.profile.lang) update((st) => ({ ...st, profile: { ...st.profile, lang: d.lang } }));
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    const all = validateDraft(d, t);
    if (Object.keys(all).length) { setErr(all); return; }
    update((st) => {
      const p = applyDraft(d);
      const planned = st.cats.reduce((a, c) => a + c.allocated, 0);
      return syncCatering({ ...st, profile: { ...st.profile, ...p, budget: p.budget || planned } });
    });
    toast({ title: t('Your personalised dashboard is ready', 'لوحتك المخصصة جاهزة') });
    nav('/');
  };

  return (
    <div className="grid min-h-[100dvh] bg-background lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-forest lg:block">
        {STEPS.map((x, i) => <img key={x.img} src={IMG(x.img)} alt="" className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', i === step ? 'opacity-70' : 'opacity-0')} />)}
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/40 to-transparent" />
        <div className="absolute bottom-0 p-12 text-ivory">
          <div className="font-serif text-6xl">Mizan <span className="text-gold" style={{ fontFamily: 'IBM Plex Sans Arabic' }}>ميزان</span></div>
          <p className="mt-3 max-w-sm text-ivory/80">{t('Your wedding. Your traditions. Your budget.', 'زفافك. عاداتك. ميزانيتك.')}</p>
        </div>
      </div>
      <div className="flex flex-col px-6 py-10 md:px-14">
        <div className="mb-2 text-[11px] text-muted-foreground">{t('DEMO MODE — All financial figures, vendors, and support programs are fictional and provided for demonstration purposes only.', 'وضع العرض التجريبي — جميع الأرقام المالية والمزودين وبرامج الدعم خيالية ومقدمة لأغراض العرض فقط.')}</div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">{STEPS.map((_, i) => <span key={i} className={cn('h-1 w-10 rounded-full transition-colors', i <= step ? 'bg-gold' : 'bg-beige')} />)}</div>
          <button data-testid="button-exit-onboarding" onClick={() => nav('/')} className="text-xs text-muted-foreground hover:text-forest">{t('Exit to dashboard', 'العودة للوحة')}</button>
        </div>
        <div key={step} className="rise my-auto py-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{t(`Step ${step + 1} of ${STEPS.length}`, `الخطوة ${step + 1} من ${STEPS.length}`)}{s.optional ? ` · ${t('Optional', 'اختياري')}` : ''}</div>
          <h1 className="mb-2 mt-2 font-serif text-4xl text-forest md:text-5xl">{t(s.en, s.ar)}</h1>
          <p className="mb-8 text-sm text-muted-foreground">{t('Mizan never assumes who pays for what. You define your own arrangements later.', 'ميزان لا يفترض من يدفع ماذا. ستحدد ترتيباتك بنفسك لاحقاً.')}</p>
          <ProfileFields d={d} set={setD} err={err} only={s.keys} />
        </div>
        <div className="flex items-center justify-between">
          <Btn variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)} data-testid="button-onboarding-back">{isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t('Back', 'رجوع')}</Btn>
          <div className="flex gap-2">
            {s.optional && <Btn variant="outline" data-testid="button-onboarding-skip" onClick={() => next(true)}>{t('Skip', 'تخطي')}</Btn>}
            <Btn data-testid="button-onboarding-next" onClick={() => next()}>{step === STEPS.length - 1 ? t('Generate my dashboard', 'أنشئ لوحتي') : t('Continue', 'متابعة')}{isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
