import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { aed, useT } from '@/lib/i18n';
import { IMG, todayISO } from '@/lib/seed';
import { BUDGET_PRESETS, GUEST_OPTS, PRIORITY_OPTS, SERVICE_OPTS, STYLE_OPTS, TIMEFRAME_OPTS, applyProfile, rangeFor } from '@/lib/profile';
import { Btn, Input } from '@/components/kit';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { DateMode, GuestRange, Priority, Profile, Service, Timeframe, WeddingStyle } from '@/lib/types';

const STEP_IMG = ['hero-stage', 'florals', 'venue', 'jewellery', 'invitation', 'catering', 'attire'];

export function WeddingQuiz() {
  const { state, update, quizOpen, setQuizOpen } = useApp();
  const { t, b, isAr } = useT();
  const firstVisit = !state.onboarded;
  const open = firstVisit || quizOpen;
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(state.profile);
  const [budgetText, setBudgetText] = useState(String(state.profile.budget || ''));
  const [guestsText, setGuestsText] = useState(String(state.profile.guests));
  const [reallocate, setReallocate] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(0); setErr(''); setReallocate(true);
    // A first-time visitor starts from neutral choices instead of the sample couple
    const base = firstVisit ? { ...state.profile, name: '', partnerName: '' } : state.profile;
    setP(base); setBudgetText(String(base.budget || '')); setGuestsText(String(base.guests));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  const TOTAL = 6;
  const close = () => {
    if (firstVisit) {
      update((s) => ({ ...s, onboarded: true }));
      toast({ title: t('Exploring the sample wedding', 'تستكشفون الزفاف التجريبي'), description: t('You can build your own profile any time from the dashboard.', 'يمكنكم إنشاء ملفكم في أي وقت من لوحة التحكم.') });
    }
    setQuizOpen(false);
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const validate = (): string => {
    if (step === 1 && p.style === 'custom' && !p.customStyle.trim()) return t('Describe your style in a few words.', 'صفوا أسلوبكم بكلمات قليلة.');
    if (step === 2) { const n = Number(guestsText); if (!(n >= 1 && n <= 5000)) return t('Enter a guest count between 1 and 5,000.', 'أدخلوا عدد ضيوف بين ١ و٥٠٠٠.'); }
    if (step === 3) { const n = Number(budgetText); if (!(n >= 5000 && n <= 20000000)) return t('Enter a budget between AED 5,000 and 20,000,000.', 'أدخلوا ميزانية بين ٥٠٠٠ و٢٠ مليون درهم.'); }
    if (step === 4 && p.dateMode === 'date' && (!p.weddingDate || p.weddingDate < todayISO())) return t('Choose a future date, or pick a timeframe instead.', 'اختاروا تاريخاً مستقبلياً أو حددوا إطاراً زمنياً.');
    if (step === 5 && p.services.length === 0) return t('Select at least one service.', 'اختاروا خدمة واحدة على الأقل.');
    return '';
  };
  const next = () => {
    const e = validate();
    setErr(e);
    if (e) return;
    if (step === 2) setP((x) => ({ ...x, guests: Math.round(Number(guestsText)) }));
    if (step === 3) setP((x) => ({ ...x, budget: Math.round(Number(budgetText)) }));
    if (step < TOTAL) { setStep(step + 1); return; }
    const final: Profile = { ...p, guests: Math.round(Number(guestsText)), budget: Math.round(Number(budgetText)), isSample: false, name: p.name.trim(), partnerName: p.partnerName.trim() };
    update((s) => applyProfile(s, final, { reallocate }));
    setQuizOpen(false);
    toast({ title: t('Your wedding profile is saved', 'تم حفظ ملف زفافكم'), description: t('Dashboard, checklist, budget and vendors now reflect your answers.', 'أصبحت لوحة التحكم والقائمة والميزانية والمزودون تعكس إجاباتكم.') });
  };

  const Card = ({ active, onClick, children, testid, className }: { active: boolean; onClick: () => void; children: ReactNode; testid: string; className?: string }) => (
    <button type="button" data-testid={testid} onClick={onClick} aria-pressed={active}
      className={cn('relative rounded-2xl border p-4 text-start transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5', active ? 'border-gold bg-forest text-ivory shadow-[var(--shadow-md)]' : 'border-border bg-card text-forest hover:border-gold/70', className)}>
      {active && <span className="absolute end-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gold text-forest"><Check className="h-3 w-3" /></span>}
      {children}
    </button>
  );

  const titles = [
    [t('Let\u2019s shape your wedding', 'لنرسم ملامح زفافكم'), t('Six short questions. Your answers tailor your checklist, budget and vendor suggestions. Skip any time.', 'ستة أسئلة قصيرة تخصص قائمتكم وميزانيتكم واقتراحات المزودين. يمكنكم التخطي في أي وقت.')],
    [t('What is your wedding style?', 'ما أسلوب زفافكم؟'), t('There is no single right way. Choose what feels like you.', 'لا توجد طريقة واحدة صحيحة. اختاروا ما يشبهكم.')],
    [t('Approximately how many guests?', 'كم عدد الضيوف تقريباً؟'), t('A range is fine. You can refine the number below.', 'يكفي نطاق تقريبي، ويمكنكم تحديد العدد أدناه.')],
    [t('Your estimated total budget', 'الميزانية الإجمالية التقديرية'), t('In AED. We use it to suggest a starting allocation, never to judge.', 'بالدرهم. نستخدمها لاقتراح توزيع مبدئي فقط.')],
    [t('When are you planning to marry?', 'متى تخططون للزواج؟'), t('An exact date, a rough timeframe, or not yet decided.', 'تاريخ محدد أو إطار زمني تقريبي أو لم يحدد بعد.')],
    [t('Which services will you need?', 'ما الخدمات التي تحتاجونها؟'), t('Select all that apply.', 'اختاروا كل ما ينطبق.')],
    [t('What matters most to you?', 'ما الأهم بالنسبة لكم؟'), t('Pick a few. We protect these in your plan.', 'اختاروا بعضها، وسنراعيها في خطتكم.')],
  ][step];

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center bg-charcoal/55 backdrop-blur-sm md:items-center md:p-6" dir={isAr ? 'rtl' : 'ltr'} role="dialog" aria-modal="true" aria-label={t('Wedding profile quiz', 'استبيان ملف الزفاف')}>
      <div className="rise grid w-full max-w-5xl overflow-hidden bg-background md:max-h-[92dvh] md:rounded-3xl md:shadow-[var(--shadow-xl)] lg:grid-cols-[0.8fr_1.2fr]">
        <div className="relative hidden overflow-hidden bg-forest lg:block">
          {STEP_IMG.map((x, i) => <img key={i} src={IMG(x)} alt="" className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', i === step ? 'opacity-60' : 'opacity-0')} />)}
          <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-forest/10" />
          <div className="pattern-mashrabiya absolute inset-0 opacity-30" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-ivory">
            <div className="font-serif text-4xl">Mizan <span className="text-gold">|</span> <span style={{ fontFamily: 'IBM Plex Sans Arabic' }}>ميزان</span></div>
            <p className="mt-2 text-sm text-ivory/75">{t('Your wedding. Your traditions. Your budget.', 'زفافكم. عاداتكم. ميزانيتكم.')}</p>
          </div>
        </div>
        <div className="flex max-h-[100dvh] flex-col md:max-h-[92dvh]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex flex-1 gap-1.5" aria-label={t(`Step ${step} of ${TOTAL}`, `الخطوة ${step} من ${TOTAL}`)}>
              {Array.from({ length: TOTAL }).map((_, i) => <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors duration-500', i < step ? 'bg-gold' : 'bg-beige')} />)}
            </div>
            <button data-testid="button-quiz-skip" onClick={close} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-forest">
              {firstVisit ? t('Skip and explore sample', 'تخطي واستكشاف المثال') : t('Close', 'إغلاق')}<X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div key={step} className="rise flex-1 overflow-y-auto px-6 py-6 md:px-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{step === 0 ? t('Wedding profile', 'ملف الزفاف') : t(`Question ${step} of ${TOTAL}`, `السؤال ${step} من ${TOTAL}`)}</div>
            <h2 className="mt-2 font-serif text-3xl text-forest md:text-4xl">{titles[0]}</h2>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">{titles[1]}</p>

            {step === 0 && (
              <div className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{t('Your name (optional)', 'اسمك (اختياري)')}</span><Input data-testid="input-quiz-name" value={p.name} maxLength={60} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
                  <label className="block space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{t('Partner\u2019s name (optional)', 'اسم الشريك (اختياري)')}</span><Input data-testid="input-quiz-partner" value={p.partnerName} maxLength={60} onChange={(e) => setP({ ...p, partnerName: e.target.value })} /></label>
                </div>
                <div className="flex gap-2">
                  {(['en', 'ar'] as const).map((l) => (
                    <button key={l} data-testid={`button-quiz-lang-${l}`} onClick={() => { setP({ ...p, lang: l }); update((s) => ({ ...s, profile: { ...s.profile, lang: l } })); }} className={cn('rounded-full border px-4 py-2 text-sm', p.lang === l ? 'border-forest bg-forest text-ivory' : 'border-border text-forest')} style={l === 'ar' ? { fontFamily: 'IBM Plex Sans Arabic' } : undefined}>{l === 'en' ? 'English' : 'العربية'}</button>
                  ))}
                </div>
                {firstVisit && <p className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs text-muted-foreground">{t('Behind this window is a sample wedding so you can see Mizan in action. Your answers personalise it; your own tasks and expenses are never deleted.', 'خلف هذه النافذة زفاف تجريبي لتروا ميزان أثناء العمل. إجاباتكم تخصصه، ولن تحذف مهامكم أو مصاريفكم أبداً.')}</p>}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(Object.keys(STYLE_OPTS) as WeddingStyle[]).map((s) => (
                    <Card key={s} testid={`button-quiz-style-${s}`} active={p.style === s} onClick={() => setP({ ...p, style: s })} className="overflow-hidden p-0">
                      <img src={IMG(STYLE_OPTS[s].img)} alt="" className={cn('h-20 w-full object-cover transition-opacity', p.style === s ? 'opacity-50' : 'opacity-90')} />
                      <div className="p-3"><div className="text-sm font-semibold">{b(STYLE_OPTS[s])}</div><div className={cn('mt-0.5 text-[11px]', p.style === s ? 'text-ivory/70' : 'text-muted-foreground')}>{b(STYLE_OPTS[s].sub)}</div></div>
                    </Card>
                  ))}
                </div>
                {p.style === 'custom' && <Input data-testid="input-quiz-custom-style" placeholder={t('e.g. Beach evening with heritage touches', 'مثال: أمسية على الشاطئ بلمسات تراثية')} value={p.customStyle} maxLength={120} onChange={(e) => setP({ ...p, customStyle: e.target.value })} />}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(Object.keys(GUEST_OPTS) as GuestRange[]).map((g) => (
                    <Card key={g} testid={`button-quiz-guests-${g}`} active={p.guestRange === g} onClick={() => { setP({ ...p, guestRange: g }); setGuestsText(String(GUEST_OPTS[g].mid)); }}>
                      <div className="font-serif text-2xl">{b(GUEST_OPTS[g])}</div><div className="text-[11px] opacity-70">{t('guests', 'ضيف')}</div>
                    </Card>
                  ))}
                </div>
                <label className="block max-w-xs space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{t('Working number', 'العدد التقريبي')}</span>
                  <Input data-testid="input-quiz-guests" type="number" min={1} value={guestsText} onChange={(e) => { setGuestsText(e.target.value); const n = Number(e.target.value); if (n > 0) setP({ ...p, guestRange: rangeFor(n) }); }} /></label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {BUDGET_PRESETS.map((v) => (
                    <Card key={v} testid={`button-quiz-budget-${v}`} active={Number(budgetText) === v} onClick={() => setBudgetText(String(v))}>
                      <div className="num font-serif text-2xl">{aed(v, p.lang)}</div>
                    </Card>
                  ))}
                </div>
                <label className="block max-w-xs space-y-1.5"><span className="text-xs font-medium text-muted-foreground">{t('Or enter your own amount (AED)', 'أو أدخلوا مبلغكم (درهم)')}</span>
                  <Input data-testid="input-quiz-budget" type="number" min={0} value={budgetText} onChange={(e) => setBudgetText(e.target.value)} /></label>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {([['date', t('Exact date', 'تاريخ محدد')], ['timeframe', t('Approximate timeframe', 'إطار زمني تقريبي')], ['undecided', t('Not decided yet', 'لم نحدد بعد')]] as [DateMode, string][]).map(([m, l]) => (
                    <button key={m} data-testid={`button-quiz-datemode-${m}`} onClick={() => setP({ ...p, dateMode: m })} className={cn('rounded-full border px-4 py-2 text-sm', p.dateMode === m ? 'border-forest bg-forest text-ivory' : 'border-border text-forest hover:border-gold')}>{l}</button>
                  ))}
                </div>
                {p.dateMode === 'date' && <Input data-testid="input-quiz-date" type="date" min={todayISO()} className="max-w-xs" value={p.weddingDate} onChange={(e) => setP({ ...p, weddingDate: e.target.value })} />}
                {p.dateMode === 'timeframe' && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {(Object.keys(TIMEFRAME_OPTS) as Timeframe[]).map((tf) => <Card key={tf} testid={`button-quiz-timeframe-${tf}`} active={p.timeframe === tf} onClick={() => setP({ ...p, timeframe: tf })}><div className="text-sm font-semibold">{b(TIMEFRAME_OPTS[tf])}</div></Card>)}
                  </div>
                )}
                {p.dateMode === 'undecided' && <p className="text-sm text-muted-foreground">{t('No problem. We will space your checklist across roughly a year.', 'لا بأس، سنوزع قائمتكم على نحو سنة تقريباً.')}</p>}
              </div>
            )}

            {step === 5 && (
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                {(Object.keys(SERVICE_OPTS) as Service[]).map((s) => (
                  <Card key={s} testid={`button-quiz-service-${s}`} active={p.services.includes(s)} onClick={() => setP({ ...p, services: toggle(p.services, s) })} className="py-3"><div className="pe-5 text-sm font-medium">{b(SERVICE_OPTS[s])}</div></Card>
                ))}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
                  {(Object.keys(PRIORITY_OPTS) as Priority[]).map((s) => (
                    <Card key={s} testid={`button-quiz-priority-${s}`} active={p.priorities.includes(s)} onClick={() => setP({ ...p, priorities: toggle(p.priorities, s) })} className="py-3"><div className="pe-5 text-sm font-medium">{b(PRIORITY_OPTS[s])}</div></Card>
                  ))}
                </div>
                <label className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm text-forest">
                  <input data-testid="checkbox-quiz-reallocate" type="checkbox" className="mt-1 accent-[#173B35]" checked={reallocate} onChange={(e) => setReallocate(e.target.checked)} />
                  <span>{t('Rebalance my category allocations from these answers', 'أعيدوا توزيع مخصصات الفئات بناءً على هذه الإجابات')}<span className="block text-xs text-muted-foreground">{t('Your recorded expenses, payments, completed and custom tasks are always kept.', 'مصاريفكم ودفعاتكم ومهامكم المكتملة والخاصة تبقى دائماً.')}</span></span>
                </label>
              </div>
            )}
            {err && <p data-testid="text-quiz-error" className="mt-4 text-sm text-clay">{err}</p>}
          </div>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <Btn variant="ghost" disabled={step === 0} onClick={() => { setErr(''); setStep(step - 1); }} data-testid="button-quiz-back">{isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{t('Back', 'رجوع')}</Btn>
            <Btn data-testid="button-quiz-next" onClick={next}>{step === 0 ? t('Begin', 'ابدأ') : step === TOTAL ? t('Save my profile', 'احفظ ملفي') : t('Continue', 'متابعة')}{step < TOTAL && (isAr ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />)}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
