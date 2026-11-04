import { useEffect, useRef, useState } from 'react';
import { useAskMizan } from '@workspace/api-client-react';
import { Bot, RotateCcw, Send, ShieldCheck, WifiOff } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, useT } from '@/lib/i18n';
import { finance, optimise, simulate } from '@/lib/calc';
import { buildContext, localAnswer } from '@/lib/advisor';
import { uid } from '@/lib/seed';
import { Btn, Card, Chip, Input, PageHeader, SampleTag } from '@/components/kit';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Tier, VenueType } from '@/lib/types';

export default function Assistant() {
  return (
    <div>
      <AssistantHeader />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Chat />
        <Simulator />
      </div>
    </div>
  );
}

function AssistantHeader() {
  const { t } = useT();
  return <PageHeader eyebrow={t('Mizan AI', 'ميزان الذكي')} title={t('Budget optimiser', 'محسّن الميزانية')} sub={t('A rule-based demo assistant that reads your actual plan. It never treats sample prices as market prices.', 'مساعد تجريبي قائم على القواعد يقرأ خطتك الفعلية. لا يعتبر الأسعار التجريبية أسعار سوق.')} />;
}

function Chat() {
  const { state, update } = useApp();
  const { t, lang } = useT();
  const ask = useAskMizan();
  const [msg, setMsg] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [state.chat.length, ask.isPending]);

  const suggestions = [
    t('How much should I save every month?', 'كم يجب أن أدخر كل شهر؟'),
    t('Am I exceeding my wedding budget?', 'هل أتجاوز ميزانية زفافي؟'),
    t('What happens if I invite 50 more guests?', 'ماذا لو دعوت ٥٠ ضيفاً إضافياً؟'),
    t('Compare these two wedding venues.', 'قارن بين هاتين القاعتين.'),
    t('Help me organise the remaining tasks.', 'ساعدني في تنظيم المهام المتبقية.'),
    t('Which expenses should I pay first?', 'ما المصاريف التي يجب دفعها أولاً؟'),
    t('Find ways to reduce costs without compromising catering.', 'اقترح طرقاً لتقليل التكاليف دون المساس بالضيافة.'),
  ];

  const send = (text: string) => {
    const m = text.trim();
    if (!m || ask.isPending) return;
    const f = finance(state);
    update((s) => ({ ...s, chat: [...s.chat, { id: uid(), role: 'user', text: m }] }));
    setMsg('');
    const priorities = state.assumptions.priorities.join(', ');
    ask.mutate(
      { data: { message: m.slice(0, 4000), language: lang, budget: Math.max(0, state.profile.budget), savings: Math.max(0, f.available), monthlyCapacity: Math.max(0, state.profile.monthlyCapacity), remainingExpenses: Math.max(0, f.remainingExpenses), monthsRemaining: Math.max(0, f.months), guestCount: Math.max(1, Math.min(10000, state.profile.guests)), cateringPerGuest: state.assumptions.cateringPerGuest, priorities: priorities || undefined, context: buildContext(state) } },
      {
        onSuccess: (r) => update((s) => ({ ...s, chat: [...s.chat, { id: uid(), role: 'assistant', text: r.answer, monthlyTarget: r.monthlyTarget, shortfall: r.shortfall }] })),
        onError: () => {
          const r = localAnswer(m, state, lang);
          update((s) => ({ ...s, chat: [...s.chat, { id: uid(), role: 'assistant', text: r.answer, monthlyTarget: r.monthlyTarget, shortfall: r.shortfall, offline: true }] }));
        },
      },
    );
  };

  return (
    <Card className="flex h-[720px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-forest px-5 py-4 text-ivory">
        <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-gold/50"><Bot className="h-5 w-5 text-gold" /></span><div><div className="font-medium">Mizan AI</div><div className="text-[11px] text-ivory/70">{t('Rule-based demo assistant · not a language model', 'مساعد تجريبي قائم على القواعد · ليس نموذجاً لغوياً')}</div></div></div>
        {state.chat.length > 0 && <button data-testid="button-clear-chat" onClick={() => update((s) => ({ ...s, chat: [] }))} className="flex items-center gap-1 text-xs text-ivory/70 hover:text-gold"><RotateCcw className="h-3.5 w-3.5" />{t('Clear', 'مسح')}</button>}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {state.chat.length === 0 && (
          <div className="pattern-mashrabiya rounded-2xl border border-dashed border-gold/40 p-5 text-sm text-forest">
            <div className="font-serif text-xl">{t(`Marhaba ${state.profile.name || ''}.`, `مرحباً ${state.profile.name || ''}.`)}</div>
            <p className="mt-1 text-muted-foreground">{t('I can see your budget, guest count, selected vendors, outstanding payments and deadlines. Try one of these:', 'أستطيع رؤية ميزانيتك وعدد ضيوفك والمزودين المختارين والدفعات المستحقة والمواعيد. جرّب أحد هذه الأسئلة:')}</p>
          </div>
        )}
        {state.chat.map((c) => (
          <div key={c.id} className={cn('flex', c.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div data-testid={`msg-${c.role}-${c.id}`} className={cn('max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm', c.role === 'user' ? 'rounded-ee-sm bg-forest text-ivory' : 'rounded-es-sm border border-border bg-ivory text-forest')}>
              {c.text}
              {c.role === 'assistant' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  {c.offline ? <span className="inline-flex items-center gap-1 text-clay"><WifiOff className="h-3 w-3" />{t('Offline fallback — calculated in your browser', 'وضع بديل — محسوب في متصفحك')}</span> : <SampleTag label={t('Deterministic demo', 'عرض حتمي تجريبي')} />}
                  {typeof c.monthlyTarget === 'number' && <span className="num">{t('Monthly target', 'الهدف الشهري')}: {aed(c.monthlyTarget, lang)}</span>}
                  {typeof c.shortfall === 'number' && c.shortfall > 0 && <span className="num text-clay">{t('Shortfall', 'العجز')}: {aed(c.shortfall, lang)}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="flex gap-1.5 px-2">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">{suggestions.map((s, i) => <button key={i} data-testid={`button-suggestion-${i}`} onClick={() => send(s)} className="shrink-0 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-xs text-forest hover:bg-gold/15">{s}</button>)}</div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(msg); }}>
          <Input data-testid="input-chat" maxLength={4000} placeholder={t('Ask about your budget, guests, vendors…', 'اسأل عن ميزانيتك أو ضيوفك أو المزودين…')} value={msg} onChange={(e) => setMsg(e.target.value)} />
          <Btn data-testid="button-send-chat" type="submit" disabled={!msg.trim() || ask.isPending} className="px-4"><Send className="h-4 w-4 rtl:-scale-x-100" /></Btn>
        </form>
      </div>
    </Card>
  );
}

const PRIORITY_KEYS = ['venue', 'catering', 'decoration', 'photo', 'guests'] as const;

function Simulator() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const a = state.assumptions;
  const sm = a.sim;
  const fixed = ['prep', 'mahr', 'invites', 'other'].reduce((x, id) => x + (state.cats.find((c) => c.id === id)?.allocated ?? 0), 0);
  const r = simulate(a, fixed, state.profile.savings);
  const tips = optimise(state, lang);
  const setSim = (k: keyof typeof sm, v: string | number) => update((s) => ({ ...s, assumptions: { ...s.assumptions, sim: { ...s.assumptions.sim, [k]: v } } }));
  const setPrice = (group: 'venue' | 'catering' | 'decoration' | 'photo', k: string, v: number) => update((s) => ({ ...s, assumptions: { ...s.assumptions, [group]: { ...s.assumptions[group], [k]: Math.max(0, v || 0) } } }));
  const pLabel = { venue: t('Venue', 'القاعة'), catering: t('Catering', 'الضيافة'), decoration: t('Decoration', 'الديكور'), photo: t('Photography', 'التصوير'), guests: t('Guest count', 'عدد الضيوف') };
  const tiers: Tier[] = ['basic', 'standard', 'premium'];
  const over = r.total - state.profile.budget;

  const applyToPlan = () => update((s) => {
    const venueAlloc = s.assumptions.venue[sm.venue] + s.assumptions.decoration[sm.decoration];
    return { ...s, profile: { ...s.profile, guests: sm.guests }, assumptions: { ...s.assumptions, cateringPerGuest: s.assumptions.catering[sm.catering] }, cats: s.cats.map((c) => c.id === 'venue' ? { ...c, allocated: venueAlloc } : c.id === 'catering' ? { ...c, allocated: sm.guests * s.assumptions.catering[sm.catering] } : c) };
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('What-if simulator', 'محاكي "ماذا لو"')}</h2><SampleTag label={t('Sample pricing', 'أسعار تجريبية')} /></div>
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-forest p-5 text-ivory">
          <div><div className="text-[11px] uppercase tracking-[0.16em] text-gold">{t('Estimated total', 'الإجمالي التقديري')}</div><div data-testid="text-sim-total" className="num font-serif text-4xl">{aed(r.total, lang)}</div><div className={cn('text-xs', over > 0 ? 'text-gold' : 'text-ivory/70')}>{over > 0 ? `${aed(over, lang)} ${t('over target', 'فوق الهدف')}` : `${aed(-over, lang)} ${t('under target', 'تحت الهدف')}`}</div></div>
          <div><div className="text-[11px] uppercase tracking-[0.16em] text-gold">{t('Monthly savings target', 'هدف الادخار الشهري')}</div><div data-testid="text-sim-monthly" className="num font-serif text-4xl">{aed(r.monthly, lang)}</div><div className="text-xs text-ivory/70">{r.monthly <= state.profile.monthlyCapacity ? t('Within your capacity', 'ضمن قدرتك') : t(`Capacity ${aed(state.profile.monthlyCapacity)}`, `القدرة ${aed(state.profile.monthlyCapacity, 'ar')}`)}</div></div>
        </div>
        <div className="mt-5 space-y-5">
          <SliderRow label={t('Guest count', 'عدد الضيوف')} value={sm.guests} min={50} max={500} step={10} onChange={(v) => setSim('guests', v)} testid="slider-guests" />
          <SliderRow label={t('Months until the wedding', 'الأشهر حتى الزفاف')} value={sm.months} min={1} max={36} step={1} onChange={(v) => setSim('months', v)} testid="slider-months" />
          <div><div className="mb-2 text-xs font-medium text-muted-foreground">{t('Venue', 'القاعة')}</div><div className="flex flex-wrap gap-1.5">{(['home', 'hall', 'hotel'] as VenueType[]).map((v) => <Chip key={v} testid={`sim-venue-${v}`} active={sm.venue === v} onClick={() => setSim('venue', v)}>{b(L.venue[v])}</Chip>)}</div></div>
          {(['catering', 'decoration', 'photo'] as const).map((g) => (
            <div key={g}><div className="mb-2 text-xs font-medium text-muted-foreground">{pLabel[g]}</div><div className="flex flex-wrap gap-1.5">{tiers.map((x) => <Chip key={x} testid={`sim-${g}-${x}`} active={sm[g] === x} onClick={() => setSim(g, x)}>{b(L.tier[x])}</Chip>)}</div></div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1 border-t border-border pt-4 text-xs md:grid-cols-3">
          {[[t('Venue', 'القاعة'), r.venue], [t('Catering', 'الضيافة'), r.catering], [t('Decoration', 'الديكور'), r.decoration], [t('Photography', 'التصوير'), r.photo], [t('Other categories', 'فئات أخرى'), r.other]].map(([l, v]) => <div key={l as string} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="num text-forest">{aed(v as number, lang)}</span></div>)}
        </div>
        <Btn className="mt-4" variant="outline" size="sm" data-testid="button-apply-sim" onClick={() => { applyToPlan(); toast({ title: t('Scenario applied to your budget', 'تم تطبيق السيناريو على ميزانيتك') }); }}>{t('Apply guests, venue & catering to my budget', 'طبّق الضيوف والقاعة والضيافة على ميزانيتي')}</Btn>
      </Card>

      <Card className="p-6">
        <div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gold" /><h2 className="font-serif text-2xl text-forest">{t('What matters most', 'ما يهمك أكثر')}</h2></div>
        <p className="mb-3 text-xs text-muted-foreground">{t('Protected priorities are never reduced in recommendations.', 'الأولويات المحمية لا تُخفّض أبداً في التوصيات.')}</p>
        <div className="mb-4 flex flex-wrap gap-1.5">{PRIORITY_KEYS.map((k) => { const on = a.priorities.includes(k); return <Chip key={k} testid={`priority-${k}`} active={on} onClick={() => update((s) => ({ ...s, assumptions: { ...s.assumptions, priorities: on ? s.assumptions.priorities.filter((x) => x !== k) : [...s.assumptions.priorities, k] } }))}>{on ? t('Protected: ', 'محمي: ') : ''}{pLabel[k]}</Chip>; })}</div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{t('Recommendations', 'التوصيات')} <SampleTag className="ms-1" /></div>
        <ul className="mt-2 space-y-2">
          {tips.length === 0 ? <li className="text-sm text-muted-foreground">{t('Everything is protected or already at the leanest option.', 'كل شيء محمي أو في أبسط خيار بالفعل.')}</li> : tips.map((x) => <li key={x.key} data-testid={`tip-${x.key}`} className="rounded-xl border border-border p-3 text-sm text-forest">{x.label}</li>)}
        </ul>
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('Pricing assumptions', 'افتراضات التسعير')}</h2><SampleTag label={t('Editable sample', 'مثال قابل للتعديل')} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-muted-foreground"><th className="py-1 text-start font-medium" />{tiers.map((x) => <th key={x} className="text-start font-medium">{b(L.tier[x])}</th>)}</tr></thead>
            <tbody>
              {(['catering', 'decoration', 'photo'] as const).map((g) => (
                <tr key={g}><td className="py-1 pe-2 text-forest">{pLabel[g]}{g === 'catering' ? ` (${t('per guest', 'للضيف')})` : ''}</td>{tiers.map((x) => <td key={x} className="pe-2 py-1"><Input data-testid={`input-assume-${g}-${x}`} type="number" min={0} className="h-8 text-xs" value={a[g][x]} onChange={(e) => setPrice(g, x, Number(e.target.value))} /></td>)}</tr>
              ))}
              <tr><td className="py-1 pe-2 text-forest">{pLabel.venue}</td>{(['home', 'hall', 'hotel'] as VenueType[]).map((x) => <td key={x} className="pe-2 py-1"><div className="mb-0.5 text-[10px] text-muted-foreground">{b(L.venue[x])}</div><Input data-testid={`input-assume-venue-${x}`} type="number" min={0} className="h-8 text-xs" value={a.venue[x]} onChange={(e) => setPrice('venue', x, Number(e.target.value))} /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, testid }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; testid: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-muted-foreground">{label}</span><span className="num font-semibold text-forest">{value}</span></div>
      <input data-testid={testid} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#B99A62]" />
    </div>
  );
}
