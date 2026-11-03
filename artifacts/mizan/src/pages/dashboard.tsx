import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowUpRight, Bot, CalendarClock, CheckCircle2, Plus, Search, Sparkles, UserPlus } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { daysUntil, finance } from '@/lib/calc';
import { IMG } from '@/lib/seed';
import { Bar, Btn, Card, SampleTag, Stat } from '@/components/kit';
import { ExpenseDialog } from '@/components/forms';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { state } = useApp();
  const { t, b, lang } = useT();
  const [, nav] = useLocation();
  const [addExp, setAddExp] = useState(false);
  const f = finance(state);
  const p = state.profile;
  const h = new Date().getHours();
  const greet = h < 12 ? t('Good morning', 'صباح الخير') : h < 18 ? t('Good afternoon', 'مساء الخير') : t('Good evening', 'مساء الخير');

  const deadlines = [
    ...state.expenses.filter((e) => e.status !== 'paid').map((e) => ({ id: e.id, kind: 'pay' as const, title: e.description, sub: e.vendor, date: e.date, amount: e.amount - e.paidAmount })),
    ...state.tasks.filter((x) => !x.done && x.deadline).map((x) => ({ id: x.id, kind: 'task' as const, title: x.title, sub: b(L.blueprint[x.cat]), date: x.deadline, amount: x.estimate })),
  ].sort((a, c) => a.date.localeCompare(c.date)).slice(0, 6);

  const quick = [
    { icon: Sparkles, label: t('Generate wedding blueprint', 'إنشاء مخطط الزفاف'), go: () => nav('/wedding'), id: 'blueprint' },
    { icon: Plus, label: t('Add expense', 'إضافة مصروف'), go: () => setAddExp(true), id: 'expense' },
    { icon: Search, label: t('Find a vendor', 'ابحث عن مزود'), go: () => nav('/vendors'), id: 'vendor' },
    { icon: Bot, label: t('Ask AI assistant', 'اسأل المساعد الذكي'), go: () => nav('/assistant'), id: 'assistant' },
    { icon: UserPlus, label: t('Invite family member', 'دعوة فرد من العائلة'), go: () => nav('/family?invite=1'), id: 'invite' },
  ];

  const catProgress = (Object.keys(L.blueprint) as (keyof typeof L.blueprint)[]).map((c) => {
    const ts = state.tasks.filter((x) => x.cat === c);
    return { c, pct: ts.length ? Math.round((ts.filter((x) => x.done).length / ts.length) * 100) : 0, n: ts.length };
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rise relative overflow-hidden rounded-[28px] bg-forest text-ivory">
        <img src={IMG('hero-stage')} alt={t('Emirati wedding stage', 'كوشة عرس إماراتي')} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/20 rtl:bg-gradient-to-l" />
        <div className="relative grid gap-8 p-7 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">{b(L.style[p.style])} · {t('Wedding journey', 'رحلة الزفاف')}</div>
            <h1 data-testid="text-greeting" className="mt-3 font-serif text-4xl leading-[1.05] md:text-6xl">{greet}, {p.name || t('there', 'بك')}.</h1>
            <p className="mt-3 max-w-md text-sm text-ivory/75">{t('Your wedding journey is taking shape. Let\u2019s get everything ready.', 'رحلة زفافك تتشكل. لنجهّز كل شيء معاً.')}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button key={q.id} data-testid={`button-quick-${q.id}`} onClick={q.go} className="inline-flex items-center gap-2 rounded-full border border-ivory/20 bg-ivory/10 px-3.5 py-2 text-xs backdrop-blur transition hover:border-gold hover:bg-ivory/15">
                  <q.icon className="h-3.5 w-3.5 text-gold" />{q.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-2xl border border-gold/30 bg-forest/60 p-6 backdrop-blur">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{t('Countdown', 'العد التنازلي')}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span data-testid="text-countdown" className="num font-serif text-7xl leading-none">{f.past ? 0 : f.days}</span>
                <span className="text-sm text-ivory/70">{t('days to go', 'يوماً متبقياً')}</span>
              </div>
              <div className="mt-2 text-sm text-ivory/80">{fmtDate(p.weddingDate, lang)}</div>
              {f.past && <div className="mt-2 text-xs text-gold">{t('This date has passed — update it in Settings.', 'هذا التاريخ مضى — حدّثه من الإعدادات.')}</div>}
              <div className="mt-5 flex items-center justify-between text-xs"><span>{t('Planning progress', 'تقدم التخطيط')}</span><span data-testid="text-progress" className="num text-gold">{f.progress}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory/15"><div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${f.progress}%` }} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Finance strip */}
      <Card className="rise rise-1 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-forest">{t('Financial overview', 'النظرة المالية')}</h2>
          <SampleTag label={t('Illustrative figures', 'أرقام توضيحية')} />
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
          <Stat testid="stat-budget" label={t('Estimated budget', 'الميزانية التقديرية')} value={aed(f.estimatedTotal, lang)} sub={f.overBudget > 0 ? <span className="text-clay">{aed(f.overBudget, lang)} {t('over target', 'فوق الهدف')}</span> : `${t('Target', 'الهدف')} ${aed(p.budget, lang)}`} />
          <Stat testid="stat-savings" label={t('Current savings', 'المدخرات الحالية')} value={aed(p.savings, lang)} />
          <Stat testid="stat-spent" label={t('Already spent', 'المصروف فعلياً')} value={aed(f.spent, lang)} />
          <Stat testid="stat-outstanding" label={t('Outstanding', 'مستحقات')} value={aed(f.outstanding, lang)} />
          <Stat testid="stat-to-save" accent label={t('Remaining to save', 'المتبقي للادخار')} value={aed(f.requiredSavings, lang)} sub={f.requiredSavings === 0 ? t('Fully covered', 'مغطى بالكامل') : `${aed(f.monthlyTarget, lang)} / ${t('month', 'شهر')}`} />
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>{t('Paid of estimated total', 'المدفوع من الإجمالي')}</span><span className="num">{Math.round((f.spent / Math.max(1, f.estimatedTotal)) * 100)}%</span></div>
          <Bar value={(f.spent / Math.max(1, f.estimatedTotal)) * 100} tone="gold" />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Deadlines */}
        <Card className="rise rise-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">{t('Upcoming deadlines', 'المواعيد القادمة')}</h2>
            <Btn variant="ghost" size="sm" onClick={() => nav('/budget')} data-testid="button-view-timeline">{t('Payment timeline', 'جدول الدفعات')}<ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" /></Btn>
          </div>
          {deadlines.length === 0 ? <p className="text-sm text-muted-foreground">{t('Nothing pending. Enjoy the calm.', 'لا شيء معلّق.')}</p> : (
            <ul className="divide-y divide-border">
              {deadlines.map((d) => {
                const dd = daysUntil(d.date);
                return (
                  <li key={d.kind + d.id} data-testid={`row-deadline-${d.id}`} className="flex items-center gap-4 py-3">
                    <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', d.kind === 'pay' ? 'bg-gold/15 text-[#8a6a3a]' : 'bg-forest/8 text-forest')}>
                      {d.kind === 'pay' ? <CalendarClock className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-forest">{d.title}</div>
                      <div className="truncate text-xs text-muted-foreground">{d.kind === 'pay' ? t('Payment', 'دفعة') : t('Task', 'مهمة')}{d.sub ? ` · ${d.sub}` : ''}</div>
                    </div>
                    <div className="text-end">
                      <div className={cn('text-xs font-medium', dd < 0 ? 'text-clay' : dd < 14 ? 'text-[#8a6a3a]' : 'text-forest')}>{dd < 0 ? t(`${-dd}d overdue`, `متأخر ${-dd} يوم`) : t(`in ${dd}d`, `بعد ${dd} يوم`)}</div>
                      {d.amount > 0 && <div className="num text-xs text-muted-foreground">{aed(d.amount, lang)}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Blueprint progress */}
        <Card className="rise rise-3 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">{t('Wedding progress', 'تقدم الزفاف')}</h2>
            <span className="num text-sm text-muted-foreground">{f.done}/{state.tasks.length} {t('tasks', 'مهام')}</span>
          </div>
          <div className="space-y-4">
            {catProgress.map((c) => (
              <button key={c.c} data-testid={`button-progress-${c.c}`} onClick={() => nav(`/wedding?cat=${c.c}`)} className="block w-full text-start">
                <div className="mb-1.5 flex justify-between text-sm"><span className="text-forest">{b(L.blueprint[c.c])}</span><span className="num text-xs text-muted-foreground">{c.pct}%</span></div>
                <Bar value={c.pct} />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { img: 'catering', label: t('Catering estimate', 'تقدير الضيافة'), val: aed(state.cats.find((c) => c.id === 'catering')?.allocated ?? 0, lang), sub: `${p.guests} ${t('guests', 'ضيف')} × ${aed(state.assumptions.cateringPerGuest, lang)}`, to: '/budget' },
          { img: 'invitation', label: t('Guest list', 'قائمة الضيوف'), val: `${state.guests.filter((g) => g.rsvp === 'yes').reduce((a, g) => a + g.party, 0)} ${t('confirmed', 'مؤكد')}`, sub: `${state.guests.length} ${t('households tracked', 'أسرة مسجلة')}`, to: '/wedding?tab=guests' },
          { img: 'jewellery', label: t('Saved vendors', 'المزودون المحفوظون'), val: `${state.favorites.length}`, sub: `${state.plan.length} ${t('packages in plan', 'باقات في الخطة')}`, to: '/vendors' },
        ].map((c) => (
          <button key={c.label} data-testid={`card-feature-${c.img}`} onClick={() => nav(c.to)} className="group relative h-44 overflow-hidden rounded-2xl text-start">
            <img src={IMG(c.img)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
              <div className="text-[11px] uppercase tracking-[0.18em] text-gold">{c.label}</div>
              <div className="num font-serif text-3xl">{c.val}</div>
              <div className="text-xs text-ivory/75">{c.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <ExpenseDialog open={addExp} onClose={() => setAddExp(false)} />
    </div>
  );
}
