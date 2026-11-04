import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { syncCatering, useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { daysUntil, finance } from '@/lib/calc';
import { CAT_COLORS, uid } from '@/lib/seed';
import { Bar, Btn, Card, Empty, Field, Input, Modal, PageHeader, SampleTag, Select, Stat, Textarea } from '@/components/kit';
import { ConfirmDialog, ExpenseDialog } from '@/components/forms';
import { cn } from '@/lib/utils';
import type { BudgetCatId, Contribution, ContribSource, Expense } from '@/lib/types';

export default function Budget() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const f = finance(state);
  const [expDlg, setExpDlg] = useState<{ open: boolean; e: Expense | null }>({ open: false, e: null });
  const [delExp, setDelExp] = useState<Expense | null>(null);
  const [catFilter, setCatFilter] = useState<BudgetCatId | 'all'>('all');

  const setAlloc = (id: BudgetCatId, v: number) => update((s) => {
    const val = Math.max(0, Math.round(v || 0));
    if (id === 'catering' && s.assumptions.linkCatering) {
      return { ...s, assumptions: { ...s.assumptions, cateringPerGuest: Math.round((val / Math.max(1, s.profile.guests)) * 100) / 100 }, cats: s.cats.map((c) => (c.id === id ? { ...c, allocated: val } : c)) };
    }
    return { ...s, cats: s.cats.map((c) => (c.id === id ? { ...c, allocated: val } : c)) };
  });

  const pie = state.cats.map((c) => ({ id: c.id, name: b(L.budgetCat[c.id]), value: c.allocated }));
  const expenses = state.expenses.filter((e) => catFilter === 'all' || e.cat === catFilter).sort((a, c) => c.date.localeCompare(a.date));
  const timeline = [...state.expenses].sort((a, c) => a.date.localeCompare(c.date));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('My Budget', 'ميزانيتي')} title={t('Your money, your arrangement', 'أموالك، بترتيبك')} sub={t('Allocate, track and plan. Every figure is editable and labelled as a sample.', 'وزّع وتابع وخطّط. كل رقم قابل للتعديل ومُعلَّم كمثال.')}
        actions={<Btn data-testid="button-add-expense" onClick={() => setExpDlg({ open: true, e: null })}><Plus className="h-4 w-4" />{t('Add expense', 'إضافة مصروف')}</Btn>} />

      <Card className="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
        <Stat label={t('Planned total', 'الإجمالي المخطط')} value={aed(f.planned, lang)} sub={<SampleTag />} testid="stat-planned" />
        <Stat label={t('Total expenses recorded', 'المصاريف المسجلة')} value={aed(f.expensesTotal, lang)} testid="stat-expenses" />
        <Stat label={t('Remaining budget', 'الميزانية المتبقية')} value={aed(f.planned - f.expensesTotal, lang)} sub={f.planned - f.expensesTotal < 0 ? <span className="text-clay">{t('Over allocation', 'تجاوز التوزيع')}</span> : t('Planned minus recorded', 'المخطط ناقص المسجل')} testid="stat-remaining" />
        <Stat accent label={t('Unpaid amounts', 'المبالغ غير المدفوعة')} value={aed(f.outstanding, lang)} testid="stat-unpaid" />
      </Card>

      {/* Allocation */}
      <Card className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('Breakdown', 'التوزيع')}</h2><SampleTag /></div>
          <div className="relative h-64" dir="ltr">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={2} stroke="none" isAnimationActive>
                  {pie.map((p) => <Cell key={p.id} fill={CAT_COLORS[p.id]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => aed(v, lang)} contentStyle={{ borderRadius: 12, border: '1px solid #EAE3D6', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t('Total', 'الإجمالي')}</div><div className="num font-serif text-2xl text-forest">{aed(f.planned, lang)}</div></div>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            {t('Target budget', 'الميزانية المستهدفة')}: <span className="num font-medium text-forest">{aed(state.profile.budget, lang)}</span>
            {f.planned > state.profile.budget ? <span className="text-clay"> · {aed(f.planned - state.profile.budget, lang)} {t('above target', 'فوق الهدف')}</span> : <span> · {aed(state.profile.budget - f.planned, lang)} {t('headroom', 'هامش متاح')}</span>}
          </div>
        </div>
        <div className="space-y-3">
          {state.cats.map((c) => {
            const committed = f.committedByCat[c.id] || 0;
            const pct = c.allocated ? (committed / c.allocated) * 100 : 0;
            return (
              <div key={c.id} data-testid={`row-alloc-${c.id}`} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="h-3 w-3 rounded-sm" style={{ background: CAT_COLORS[c.id] }} />
                  <span className="flex-1 text-sm font-medium text-forest">{b(L.budgetCat[c.id])}</span>
                  <Input data-testid={`input-alloc-${c.id}`} type="number" min={0} className="h-8 w-32 text-end" value={c.allocated} onChange={(e) => setAlloc(c.id, Number(e.target.value))} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Bar value={pct} tone={pct > 100 ? 'clay' : 'gold'} />
                  <span className="num w-44 shrink-0 text-end text-[11px] text-muted-foreground">{aed(committed, lang)} {t('recorded', 'مسجل')} · {aed(f.spentByCat[c.id] || 0, lang)} {t('paid', 'مدفوع')}</span>
                </div>
                {c.id === 'catering' && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1.5"><input data-testid="checkbox-link-catering" type="checkbox" className="accent-[#173B35]" checked={state.assumptions.linkCatering} onChange={(e) => update((s) => syncCatering({ ...s, assumptions: { ...s.assumptions, linkCatering: e.target.checked } }))} />{t('Link to guest count', 'ربط بعدد الضيوف')}</label>
                    <span>·</span>
                    <Input data-testid="input-guests-budget" type="number" min={1} className="h-7 w-20 text-xs" value={state.profile.guests} onChange={(e) => update((s) => syncCatering({ ...s, profile: { ...s.profile, guests: Math.max(1, Math.min(10000, Number(e.target.value) || 1)) } }))} />{t('guests ×', 'ضيف ×')}
                    <Input data-testid="input-per-guest" type="number" min={0} className="h-7 w-20 text-xs" value={state.assumptions.cateringPerGuest} onChange={(e) => update((s) => syncCatering({ ...s, assumptions: { ...s.assumptions, cateringPerGuest: Math.max(0, Number(e.target.value) || 0) } }))} />{t('AED per guest (sample)', 'درهم للضيف (مثال)')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Expenses */}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-forest">{t('Expenses', 'المصاريف')}</h2>
          <Select data-testid="select-expense-filter" className="w-56" value={catFilter} onChange={(e) => setCatFilter(e.target.value as BudgetCatId | 'all')}>
            <option value="all">{t('All categories', 'كل الفئات')}</option>
            {state.cats.map((c) => <option key={c.id} value={c.id}>{b(L.budgetCat[c.id])}</option>)}
          </Select>
        </div>
        {expenses.length === 0 ? <Empty title={t('No expenses recorded', 'لا توجد مصاريف')} action={<Btn size="sm" onClick={() => setExpDlg({ open: true, e: null })}>{t('Add expense', 'إضافة مصروف')}</Btn>} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead><tr className="text-xs text-muted-foreground">{[t('Description', 'الوصف'), t('Category', 'الفئة'), t('Vendor', 'المزود'), t('Date', 'التاريخ'), t('Amount', 'المبلغ'), t('Status', 'الحالة'), ''].map((h, i) => <th key={i} className="py-2 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => (
                  <tr key={e.id} data-testid={`row-expense-${e.id}`}>
                    <td className="py-3 font-medium text-forest">{e.description}</td>
                    <td className="text-muted-foreground">{b(L.budgetCat[e.cat])}</td>
                    <td className="text-muted-foreground">{e.vendor || '—'}</td>
                    <td className="num text-muted-foreground">{fmtDate(e.date, lang)}</td>
                    <td className="num text-forest">{aed(e.amount, lang)}{e.status === 'partial' && <div className="text-[11px] text-muted-foreground">{aed(e.paidAmount, lang)} {t('paid', 'مدفوع')}</div>}</td>
                    <td><StatusPill s={e.status} /></td>
                    <td className="whitespace-nowrap text-end">
                      {e.status !== 'paid' && <button data-testid={`button-markpaid-${e.id}`} title={t('Mark paid', 'تحديد كمدفوع')} onClick={() => update((s) => ({ ...s, expenses: s.expenses.map((x) => (x.id === e.id ? { ...x, status: 'paid', paidAmount: x.amount } : x)) }))} className="p-1.5 text-forest"><CheckCircle2 className="h-4 w-4" /></button>}
                      <button data-testid={`button-edit-expense-${e.id}`} onClick={() => setExpDlg({ open: true, e })} className="p-1.5 text-forest"><Pencil className="h-4 w-4" /></button>
                      <button data-testid={`button-delete-expense-${e.id}`} onClick={() => setDelExp(e)} className="p-1.5 text-clay"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SavingsPlanner />
        <Contributions />
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('Payment timeline', 'جدول الدفعات')}</h2><SampleTag /></div>
        {timeline.length === 0 ? <Empty title={t('No payments scheduled', 'لا توجد دفعات')} /> : (
          <ol className="relative space-y-3 border-s border-gold/40 ps-6">
            {timeline.map((e) => {
              const d = daysUntil(e.date);
              return (
                <li key={e.id} data-testid={`row-timeline-${e.id}`} className="relative flex flex-wrap items-center gap-3">
                  <span className={cn('absolute -start-[29px] h-2.5 w-2.5 rotate-45', e.status === 'paid' ? 'bg-forest' : d < 0 ? 'bg-clay' : 'bg-gold')} />
                  <span className="num w-28 text-xs text-muted-foreground">{fmtDate(e.date, lang)}</span>
                  <span className="flex-1 text-sm text-forest">{e.description}{e.vendor ? <span className="text-muted-foreground"> · {e.vendor}</span> : null}</span>
                  <span className="num text-sm font-medium text-forest">{aed(e.status === 'paid' ? e.amount : e.amount - e.paidAmount, lang)}</span>
                  <StatusPill s={e.status} overdue={e.status !== 'paid' && d < 0} />
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <ExpenseDialog open={expDlg.open} initial={expDlg.e} onClose={() => setExpDlg({ open: false, e: null })} />
      <ConfirmDialog open={!!delExp} onClose={() => setDelExp(null)} title={t('Delete expense?', 'حذف المصروف؟')} body={delExp?.description ?? ''} onConfirm={() => { const id = delExp!.id; update((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== id), plan: s.plan.filter((p) => p.expenseId !== id) })); }} />
    </div>
  );
}

function StatusPill({ s, overdue }: { s: Expense['status']; overdue?: boolean }) {
  const { t, b } = useT();
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium', overdue ? 'bg-clay/15 text-clay' : s === 'paid' ? 'bg-forest/10 text-forest' : s === 'partial' ? 'bg-gold/20 text-[#8a6a3a]' : 'bg-beige text-charcoal')}>
      {overdue ? t('Overdue', 'متأخر') : b(L.pay[s])}
    </span>
  );
}

function SavingsPlanner() {
  const { state, update } = useApp();
  const { t, lang } = useT();
  const f = finance(state);
  const p = state.profile;
  const [showAlt, setShowAlt] = useState(false);
  const setP = (k: 'savings' | 'monthlyCapacity', v: number) => update((s) => ({ ...s, profile: { ...s.profile, [k]: Math.max(0, Math.round(v || 0)) } }));
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('Savings planner', 'مخطط الادخار')}</h2><SampleTag label={t('Illustrative', 'توضيحي')} /></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Wedding date', 'تاريخ الزفاف')} error={f.past ? t('This date has passed.', 'هذا التاريخ مضى.') : undefined}><Input data-testid="input-plan-date" type="date" value={p.weddingDate} onChange={(e) => e.target.value && update((s) => ({ ...s, profile: { ...s.profile, weddingDate: e.target.value } }))} /></Field>
        <Field label={t('Current wedding savings', 'المدخرات الحالية للزفاف')}><Input data-testid="input-plan-savings" type="number" min={0} value={p.savings} onChange={(e) => setP('savings', Number(e.target.value))} /></Field>
        <Field label={t('Monthly savings capacity', 'القدرة الادخارية الشهرية')}><Input data-testid="input-plan-capacity" type="number" min={0} value={p.monthlyCapacity} onChange={(e) => setP('monthlyCapacity', Number(e.target.value))} /></Field>
        <Field label={t('Remaining wedding expenses', 'مصاريف الزفاف المتبقية')} hint={t('Estimated total minus amounts paid', 'الإجمالي التقديري ناقص المدفوع')}><Input readOnly value={aed(f.remainingExpenses, lang)} className="bg-muted" /></Field>
      </div>
      <div className="mt-4 rounded-xl bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
        {t('Required savings = remaining expenses − (personal savings + received contributions). Exclude contributions from the personal savings input to avoid counting them twice. Unreceived pledges are not counted.', 'الادخار المطلوب = المصاريف المتبقية − (المدخرات الشخصية + المساهمات المستلمة). لا تُدرج المساهمات في حقل المدخرات الشخصية لتجنب احتسابها مرتين. لا تُحتسب التعهدات غير المستلمة.')}<br />
        <span className="num text-forest">{aed(f.remainingExpenses, lang)} − {aed(f.available, lang)} = <b>{aed(f.requiredSavings, lang)}</b></span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <Stat testid="stat-monthly-target" accent label={t('Monthly target', 'الهدف الشهري')} value={aed(f.monthlyTarget, lang)} sub={f.past ? t('Date passed — due now', 'التاريخ مضى — مستحق الآن') : `${Math.max(0, f.monthsRaw).toFixed(1)} ${t('months left', 'شهر متبقٍ')}`} />
        <Stat testid="stat-gap" label={f.gap >= 0 ? t('Projected surplus', 'الفائض المتوقع') : t('Projected shortfall', 'العجز المتوقع')} value={aed(Math.abs(f.gap), lang)} />
      </div>
      <div data-testid="status-savings" className={cn('mt-4 flex items-start gap-2 rounded-xl p-3 text-sm', f.requiredSavings === 0 ? 'bg-forest/10 text-forest' : f.sufficient ? 'bg-forest/10 text-forest' : 'bg-clay/10 text-clay')}>
        {f.sufficient ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
        <span>
          {f.requiredSavings === 0 ? t('No additional savings needed — your savings and received contributions cover the remaining expenses.', 'لا حاجة لادخار إضافي — مدخراتك والمساهمات المستلمة تغطي المصاريف المتبقية.')
            : f.past ? t('The wedding date has passed. Update the date to plan monthly savings.', 'تاريخ الزفاف مضى. حدّث التاريخ لتخطيط الادخار الشهري.')
            : f.sufficient ? t('Your monthly capacity is sufficient for this plan.', 'قدرتك الشهرية كافية لهذه الخطة.')
            : t(`You would need ${aed(f.monthlyTarget - p.monthlyCapacity)} more per month.`, `تحتاج إلى ${aed(f.monthlyTarget - p.monthlyCapacity, 'ar')} إضافية شهرياً.`)}
        </span>
      </div>
      {f.requiredSavings > 0 && (
        <div className="mt-3">
          <Btn variant="outline" size="sm" data-testid="button-alt-dates" onClick={() => setShowAlt((x) => !x)}>{t('Suggest alternative dates', 'اقترح تواريخ بديلة')}</Btn>
          {showAlt && (
            <div className="mt-3 rounded-xl border border-gold/40 p-3 text-sm text-forest">
              {p.monthlyCapacity <= 0 ? t('Set a monthly capacity above zero to calculate alternative dates.', 'حدد قدرة شهرية أكبر من صفر لحساب تواريخ بديلة.') : (
                <>
                  {t(`At ${aed(p.monthlyCapacity)} a month you need ${f.monthsNeeded} months.`, `بادخار ${aed(p.monthlyCapacity, 'ar')} شهرياً تحتاج ${f.monthsNeeded} شهراً.`)}{' '}
                  {t('Earliest fully-funded date:', 'أقرب تاريخ ممول بالكامل:')} <b>{fmtDate(f.altDate, lang)}</b>
                  <div className="mt-2"><Btn size="sm" data-testid="button-apply-alt-date" onClick={() => update((s) => ({ ...s, profile: { ...s.profile, weddingDate: f.altDate } }))}>{t('Use this date', 'استخدم هذا التاريخ')}</Btn></div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Contributions() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const [dlg, setDlg] = useState<Contribution | 'new' | null>(null);
  const [del, setDel] = useState<Contribution | null>(null);
  const [form, setForm] = useState({ source: 'self' as ContribSource, name: '', amount: '', received: false, note: '' });
  const [err, setErr] = useState('');
  const f = finance(state);
  const open = (c: Contribution | 'new') => { setErr(''); setForm(c === 'new' ? { source: 'parents', name: '', amount: '', received: false, note: '' } : { ...c, amount: String(c.amount) }); setDlg(c); };
  const save = () => {
    const amt = Number(form.amount);
    if (!form.name.trim()) return setErr(t('Add a name.', 'أضف اسماً.'));
    if (!(amt > 0)) return setErr(t('Amount must be greater than zero.', 'يجب أن يكون المبلغ أكبر من صفر.'));
    const rec: Contribution = { id: dlg === 'new' ? uid() : (dlg as Contribution).id, source: form.source, name: form.name.trim(), amount: Math.round(amt), received: form.received, note: form.note };
    update((s) => ({ ...s, contributions: dlg === 'new' ? [...s.contributions, rec] : s.contributions.map((c) => (c.id === rec.id ? rec : c)) }));
    setDlg(null);
  };
  const total = f.contribPledged + f.contribReceived;
  return (
    <Card className="p-6">
      <div className="mb-1 flex items-center justify-between"><h2 className="font-serif text-2xl text-forest">{t('Contributions', 'المساهمات')}</h2><Btn size="sm" data-testid="button-add-contribution" onClick={() => open('new')}><Plus className="h-3.5 w-3.5" />{t('Add', 'إضافة')}</Btn></div>
      <p className="mb-4 text-xs text-muted-foreground">{t('Define your own arrangement — anyone can contribute to any part of the wedding.', 'حدد ترتيبك الخاص — يمكن لأي شخص المساهمة في أي جزء من الزفاف.')}</p>
      <div className="mb-4 grid grid-cols-2 gap-4"><Stat label={t('Received', 'مستلم')} value={aed(f.contribReceived, lang)} /><Stat accent label={t('Pledged', 'متعهد به')} value={aed(f.contribPledged, lang)} /></div>
      {state.contributions.length === 0 ? <Empty title={t('No contributions yet', 'لا توجد مساهمات')} /> : (
        <ul className="space-y-2">
          {state.contributions.map((c) => (
            <li key={c.id} data-testid={`row-contribution-${c.id}`} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-xs text-gold">{c.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-forest">{c.name}</div><div className="truncate text-xs text-muted-foreground">{b(L.contrib[c.source])}{c.note ? ` · ${c.note}` : ''}</div></div>
                <div className="text-end"><div className="num text-sm font-semibold text-forest">{aed(c.amount, lang)}</div>
                  <button data-testid={`button-toggle-received-${c.id}`} onClick={() => update((s) => ({ ...s, contributions: s.contributions.map((x) => (x.id === c.id ? { ...x, received: !x.received } : x)) }))} className={cn('text-[11px]', c.received ? 'text-forest' : 'text-[#8a6a3a]')}>{c.received ? t('Received', 'مستلم') : t('Pledged — mark received', 'متعهد — تحديد كمستلم')}</button>
                </div>
                <button data-testid={`button-edit-contribution-${c.id}`} onClick={() => open(c)} className="p-1 text-forest"><Pencil className="h-4 w-4" /></button>
                <button data-testid={`button-delete-contribution-${c.id}`} onClick={() => setDel(c)} className="p-1 text-clay"><Trash2 className="h-4 w-4" /></button>
              </div>
              <Bar className="mt-2" value={total ? (c.amount / total) * 100 : 0} tone="gold" />
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!dlg} onClose={() => setDlg(null)} title={dlg === 'new' ? t('Add contribution', 'إضافة مساهمة') : t('Edit contribution', 'تعديل المساهمة')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Source', 'المصدر')}><Select data-testid="select-contribution-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as ContribSource })}>{(Object.keys(L.contrib) as ContribSource[]).map((k) => <option key={k} value={k}>{b(L.contrib[k])}</option>)}</Select></Field>
          <Field label={t('Name', 'الاسم')} error={err}><Input data-testid="input-contribution-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t('Amount (AED)', 'المبلغ (درهم)')}><Input data-testid="input-contribution-amount" type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-forest"><input type="checkbox" className="accent-[#173B35]" checked={form.received} onChange={(e) => setForm({ ...form, received: e.target.checked })} />{t('Already received', 'تم الاستلام')}</label>
          <Field label={t('Arrangement note', 'ملاحظة الترتيب')} className="col-span-2"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setDlg(null)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-contribution" onClick={save}>{t('Save', 'حفظ')}</Btn></div>
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Remove contribution?', 'إزالة المساهمة؟')} body={del?.name ?? ''} onConfirm={() => { const id = del!.id; update((s) => ({ ...s, contributions: s.contributions.filter((x) => x.id !== id) })); }} />
    </Card>
  );
}
