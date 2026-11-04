import { Link } from 'wouter';
import { ArrowUpRight, CalendarClock, CheckCircle2, Circle, Mail, Pencil, Sparkles, Store, Users, Wallet } from 'lucide-react';
import { useGetMyInvitation, useListWeddingGuests, getGetMyInvitationQueryKey, getListWeddingGuestsQueryKey } from '@workspace/api-client-react';
import { useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { daysUntil, finance, outstandingOf } from '@/lib/calc';
import { CAT_COLORS, IMG } from '@/lib/seed';
import { GUEST_OPTS, PRIORITY_OPTS, SERVICE_OPTS, STYLE_OPTS, TIMEFRAME_OPTS, effectiveDate, recommend } from '@/lib/profile';
import { Bar, Btn, Card, SampleTag } from '@/components/kit';
import { VendorCard } from '@/components/vendor-card';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { state, update, setQuizOpen } = useApp();
  const { t, b, lang } = useT();
  const p = state.profile;
  const f = finance(state);
  const date = effectiveDate(p);
  const days = date ? daysUntil(date) : null;
  const recs = recommend(state, 3);
  const inv = useGetMyInvitation({ query: { queryKey: getGetMyInvitationQueryKey(), refetchOnWindowFocus: true } });
  const hasInvite = !!inv.data?.invitation;
  const guestsQ = useListWeddingGuests({ query: { queryKey: getListWeddingGuestsQueryKey(), enabled: hasInvite } });
  const live = hasInvite && guestsQ.data;
  const attending = live ? guestsQ.data!.filter((g) => g.status === 'attending').reduce((a, g) => a + g.attendees, 0) : state.sampleGuests.filter((g) => g.status === 'attending').reduce((a, g) => a + g.attendees, 0);
  const responses = live ? guestsQ.data!.length : state.sampleGuests.length;

  const upcomingTasks = state.tasks.filter((x) => !x.done).sort((a, c) => (a.deadline || '9').localeCompare(c.deadline || '9')).slice(0, 5);
  const payments = state.expenses.filter((e) => outstandingOf(e) > 0).sort((a, c) => (a.dueDate || '9').localeCompare(c.dueDate || '9')).slice(0, 4);
  const couple = [p.name, p.partnerName].filter(Boolean).join(t(' & ', ' و '));
  const spentPct = f.budget ? (f.committedTotal / f.budget) * 100 : 0;
  const paidPct = f.budget ? (f.paid / f.budget) * 100 : 0;
  const toggle = (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rise relative overflow-hidden rounded-3xl bg-forest text-ivory">
        <img src={IMG(STYLE_OPTS[p.style].img)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/30 rtl:bg-gradient-to-l" />
        <div className="pattern-mashrabiya absolute inset-0 opacity-25" />
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              {t('Your wedding', 'زفافكم')}{p.isSample && <SampleTag className="border-gold/60 bg-gold/20 text-gold" label={t('Sample profile', 'ملف تجريبي')} />}
            </div>
            <h1 data-testid="text-welcome" className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
              {couple ? t(`Welcome back, ${couple}`, `أهلاً بكم، ${couple}`) : t('Welcome to your wedding plan', 'أهلاً بكم في خطة زفافكم')}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-ivory/75">
              {t(`A ${STYLE_OPTS[p.style].en.toLowerCase()} celebration for about ${p.guests} guests, planned around what matters to you.`, `احتفال ${STYLE_OPTS[p.style].ar} لنحو ${p.guests} ضيف، مخطط حول ما يهمكم.`)}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              <span className="rounded-full border border-ivory/20 px-3 py-1 text-xs">{p.style === 'custom' && p.customStyle ? p.customStyle : b(STYLE_OPTS[p.style])}</span>
              <span className="rounded-full border border-ivory/20 px-3 py-1 text-xs">{b(GUEST_OPTS[p.guestRange])} {t('guests', 'ضيف')}</span>
              <span className="rounded-full border border-ivory/20 px-3 py-1 text-xs">{aed(p.budget, lang)}</span>
              {p.priorities.map((x) => <span key={x} className="rounded-full bg-gold/20 px-3 py-1 text-xs text-gold">{b(PRIORITY_OPTS[x])}</span>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Btn variant="gold" data-testid="button-edit-profile" onClick={() => setQuizOpen(true)}><Sparkles className="h-4 w-4" />{p.isSample ? t('Build my wedding profile', 'أنشئ ملف زفافي') : t('Edit wedding profile', 'تعديل ملف الزفاف')}</Btn>
              <Link href="/invitations" data-testid="link-create-invitation" className="inline-flex h-10 items-center gap-2 rounded-full border border-ivory/30 px-5 text-sm text-ivory transition hover:bg-ivory/10"><Mail className="h-4 w-4" />{hasInvite ? t('Manage invitation', 'إدارة الدعوة') : t('Create invitation', 'إنشاء الدعوة')}</Link>
            </div>
          </div>
          <div className="flex flex-col justify-end rounded-2xl border border-gold/30 bg-forest/50 p-6 backdrop-blur-sm">
            {date && days !== null ? (
              <>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{days >= 0 ? t('Days to go', 'يوماً متبقياً') : t('Celebrated', 'تم الاحتفال')}</div>
                <div data-testid="text-countdown" className="num font-serif text-7xl leading-none">{Math.abs(days)}</div>
                <div className="mt-2 text-sm text-ivory/75">{fmtDate(date, lang)}</div>
              </>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{t('Wedding date', 'موعد الزفاف')}</div>
                <div className="mt-1 font-serif text-3xl">{p.dateMode === 'timeframe' ? b(TIMEFRAME_OPTS[p.timeframe]) : t('Not decided yet', 'لم يحدد بعد')}</div>
                <button onClick={() => setQuizOpen(true)} className="mt-2 w-fit text-xs text-gold underline-offset-4 hover:underline">{t('Add a date when ready', 'أضيفوا التاريخ عند الجاهزية')}</button>
              </>
            )}
            <div className="mt-6">
              <div className="mb-1.5 flex justify-between text-xs text-ivory/70"><span>{t('Planning progress', 'تقدم التخطيط')}</span><span className="num">{f.progress}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-ivory/15"><div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${f.progress}%` }} /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Key numbers */}
      <section className="rise rise-1 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { l: t('Total budget', 'الميزانية الإجمالية'), v: aed(f.budget, lang), id: 'budget' },
          { l: t('Total expenses', 'إجمالي المصاريف'), v: aed(f.committedTotal, lang), s: t('actual where known, else estimate', 'الفعلي إن وجد وإلا التقديري'), id: 'expenses' },
          { l: t('Remaining budget', 'المتبقي من الميزانية'), v: aed(f.remaining, lang), id: 'remaining', warn: f.remaining < 0 },
          { l: t('Guests attending', 'الضيوف الحاضرون'), v: `${attending}`, s: t(`of ~${p.guests} planned · ${responses} on list`, `من ~${p.guests} مخطط · ${responses} في القائمة`), id: 'guests' },
          { l: t('Tasks complete', 'المهام المكتملة'), v: `${f.done}/${state.tasks.length}`, id: 'tasks' },
        ].map((x) => (
          <Card key={x.id} className="p-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{x.l}</div>
            <div data-testid={`text-stat-${x.id}`} className={cn('num mt-1.5 text-2xl font-semibold tracking-tight', x.warn ? 'text-clay' : 'text-forest')}>{x.v}</div>
            {x.s && <div className="mt-0.5 text-[11px] text-muted-foreground">{x.s}</div>}
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Budget summary */}
        <Card className="rise rise-2 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">{t('Budget at a glance', 'الميزانية بنظرة')}</h2>
            <Link href="/budget" data-testid="link-manage-budget" className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-gold"><Wallet className="h-3.5 w-3.5" />{t('Manage budget', 'إدارة الميزانية')}<ArrowUpRight className="h-3 w-3 rtl:-scale-x-100" /></Link>
          </div>
          <div className="relative mb-2 h-3 overflow-hidden rounded-full bg-beige">
            <div className="absolute inset-y-0 start-0 rounded-full bg-gold/60 transition-[width] duration-700" style={{ width: `${Math.min(100, spentPct)}%` }} />
            <div className="absolute inset-y-0 start-0 rounded-full bg-forest transition-[width] duration-700" style={{ width: `${Math.min(100, paidPct)}%` }} />
          </div>
          <div className="mb-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-forest" />{t('Paid', 'مدفوع')} <b className="num text-forest">{aed(f.paid, lang)}</b></span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold/60" />{t('Committed', 'ملتزم به')} <b className="num text-forest">{aed(f.committedTotal, lang)}</b></span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-beige" />{t('Outstanding', 'مستحق')} <b className="num text-forest">{aed(f.outstanding, lang)}</b></span>
          </div>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {state.cats.map((c) => {
              const r = f.byCat[c.id];
              return (
                <div key={c.id}>
                  <div className="mb-1 flex justify-between text-xs"><span className="flex items-center gap-1.5 text-forest"><span className="h-2 w-2 rounded-sm" style={{ background: CAT_COLORS[c.id] }} />{b(L.budgetCat[c.id])}</span><span className="num text-muted-foreground">{aed(r.committed, lang)} / {aed(c.allocated, lang)}</span></div>
                  <Bar value={c.allocated ? (r.committed / c.allocated) * 100 : r.committed ? 100 : 0} tone={r.committed > c.allocated ? 'clay' : 'forest'} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Upcoming payments */}
        <Card className="rise rise-2 p-6">
          <h2 className="mb-4 font-serif text-2xl text-forest">{t('Upcoming payments', 'الدفعات القادمة')}</h2>
          {payments.length === 0 ? <p className="text-sm text-muted-foreground">{t('Nothing outstanding. Well done.', 'لا توجد مبالغ مستحقة.')}</p> : (
            <ul className="divide-y divide-border">
              {payments.map((e) => {
                const d = e.dueDate ? daysUntil(e.dueDate) : null;
                return (
                  <li key={e.id} data-testid={`row-payment-${e.id}`} className="flex items-center gap-3 py-3">
                    <CalendarClock className={cn('h-4 w-4 shrink-0', d !== null && d < 0 ? 'text-clay' : 'text-gold')} />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm text-forest">{e.description} {e.sample && <SampleTag className="ms-1" />}</div><div className="text-xs text-muted-foreground">{e.dueDate ? `${fmtDate(e.dueDate, lang)}${d !== null && d < 0 ? ` · ${t('overdue', 'متأخر')}` : ''}` : t('No due date', 'بدون تاريخ')}</div></div>
                    <div className="num text-sm font-semibold text-forest">{aed(outstandingOf(e), lang)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Upcoming tasks */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">{t('Next on your list', 'التالي في قائمتكم')}</h2>
            <Link href="/wedding" className="text-xs font-medium text-forest hover:text-gold">{t('View all', 'عرض الكل')}</Link>
          </div>
          {upcomingTasks.length === 0 ? <p className="text-sm text-muted-foreground">{t('All tasks complete.', 'اكتملت جميع المهام.')}</p> : (
            <ul className="space-y-1">
              {upcomingTasks.map((x) => {
                const d = x.deadline ? daysUntil(x.deadline) : null;
                return (
                  <li key={x.id}>
                    <button data-testid={`button-dash-task-${x.id}`} onClick={() => toggle(x.id)} className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-start transition hover:bg-muted">
                      {x.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" /> : <Circle className="mt-0.5 h-4 w-4 text-forest/40" />}
                      <span className="min-w-0 flex-1"><span className="block text-sm text-forest">{x.title}</span><span className="block text-xs text-muted-foreground">{b(L.blueprint[x.cat])}{x.deadline ? ` · ${fmtDate(x.deadline, lang)}` : ''}</span></span>
                      {d !== null && d < 0 && <span className="rounded-full bg-clay/10 px-2 py-0.5 text-[10px] text-clay">{t('Overdue', 'متأخرة')}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recommendations */}
        <Card className="p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-forest">{t('Recommended for you', 'مقترحة لكم')}</h2>
            <Link href="/vendors" data-testid="link-discover-vendors" className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-gold"><Store className="h-3.5 w-3.5" />{t('Discover vendors', 'اكتشفوا المزودين')}</Link>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">{t('Based on your style, guest count, services and priorities: ', 'بناءً على أسلوبكم وعدد الضيوف والخدمات والأولويات: ')}{p.services.slice(0, 3).map((s) => b(SERVICE_OPTS[s])).join(t(', ', '، '))}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {recs.map((r) => <VendorCard key={r.vendor.id} v={r.vendor} reasons={r.reasons} compact />)}
          </div>
        </Card>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Pencil, l: t('Edit wedding profile', 'تعديل ملف الزفاف'), on: () => setQuizOpen(true), id: 'profile' },
          { icon: Wallet, l: t('Manage budget', 'إدارة الميزانية'), href: '/budget', id: 'budget' },
          { icon: Store, l: t('Discover vendors', 'اكتشاف المزودين'), href: '/vendors', id: 'vendors' },
          { icon: Users, l: t('Create invitation', 'إنشاء دعوة'), href: '/invitations', id: 'invite' },
        ].map((x) => {
          const inner = <><x.icon className="h-5 w-5 text-gold" /><span className="text-sm font-medium text-forest">{x.l}</span><ArrowUpRight className="ms-auto h-4 w-4 text-forest/40 transition group-hover:text-gold rtl:-scale-x-100" /></>;
          const cls = 'group flex items-center gap-3 rounded-2xl border border-card-border bg-card p-4 text-start shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-gold/60';
          return x.href ? <Link key={x.id} href={x.href} data-testid={`link-shortcut-${x.id}`} className={cls}>{inner}</Link> : <button key={x.id} data-testid={`button-shortcut-${x.id}`} onClick={x.on} className={cls}>{inner}</button>;
        })}
      </section>
    </div>
  );
}
