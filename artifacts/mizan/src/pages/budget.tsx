import { useState } from 'react';
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HandCoins, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { committed, daysUntil, finance, outstandingOf } from '@/lib/calc';
import { CAT_COLORS, uid } from '@/lib/seed';
import { Bar, Btn, Card, Chip, Empty, Field, Input, Modal, PageHeader, SampleTag, Select } from '@/components/kit';
import { BCATS, ConfirmDialog, ExpenseDialog } from '@/components/forms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BudgetCatId, ContribSource, Expense } from '@/lib/types';

export default function Budget() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const f = finance(state);
  const [dlg, setDlg] = useState<{ open: boolean; e: Expense | null }>({ open: false, e: null });
  const [del, setDel] = useState<Expense | null>(null);
  const [cat, setCat] = useState<BudgetCatId | 'all'>('all');
  const [budgetEdit, setBudgetEdit] = useState<string | null>(null);

  const setAlloc = (id: BudgetCatId, v: string) => update((s) => ({ ...s, cats: s.cats.map((c) => (c.id === id ? { ...c, allocated: Math.max(0, Math.round(Number(v) || 0)) } : c)) }));
  const saveBudget = () => {
    const n = Number(budgetEdit);
    if (!(n >= 0) || isNaN(n)) { toast({ title: t('Enter a valid amount', 'أدخلوا مبلغاً صحيحاً') }); return; }
    update((s) => ({ ...s, profile: { ...s.profile, budget: Math.round(n) } }));
    setBudgetEdit(null);
  };
  const rows = state.expenses.filter((e) => cat === 'all' || e.cat === cat).sort((a, c) => (a.dueDate || '9').localeCompare(c.dueDate || '9'));
  const chart = state.cats.map((c) => ({ name: b(L.budgetCat[c.id]).split(' ')[0], planned: c.allocated, actual: f.byCat[c.id].committed }));
  const unallocated = f.budget - f.allocated;

  return (
    <div>
      <PageHeader eyebrow={t('Budget', 'الميزانية')} title={t('Your wedding budget', 'ميزانية زفافكم')} sub={t('All values in AED. Paid amounts are part of each expense, never added on top.', 'جميع المبالغ بالدرهم. المدفوع جزء من كل مصروف ولا يضاف فوقه.')}
        actions={<Btn data-testid="button-add-expense" onClick={() => setDlg({ open: true, e: null })}><Plus className="h-4 w-4" />{t('Add expense', 'إضافة مصروف')}</Btn>} />

      <Card className="rise mb-6 grid grid-cols-2 gap-6 p-6 md:grid-cols-3 xl:grid-cols-6">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t('Planned budget', 'الميزانية المخططة')}</div>
          {budgetEdit === null ? (
            <button data-testid="button-edit-budget" onClick={() => setBudgetEdit(String(f.budget))} className="num mt-1 flex items-center gap-1.5 text-xl font-semibold text-forest md:text-2xl">{aed(f.budget, lang)}<Pencil className="h-3.5 w-3.5 text-gold" /></button>
          ) : (
            <div className="mt-1 flex gap-1"><Input data-testid="input-budget-total" type="number" min={0} value={budgetEdit} onChange={(e) => setBudgetEdit(e.target.value)} className="h-9" /><Btn size="sm" onClick={saveBudget}>{t('Save', 'حفظ')}</Btn></div>
          )}
        </div>
        {[
          [t('Estimated expenses', 'المصاريف التقديرية'), f.estimated, 'estimated'],
          [t('Actual expenses', 'المصاريف الفعلية'), f.actual, 'actual'],
          [t('Remaining budget', 'المتبقي'), f.remaining, 'remaining'],
          [t('Paid so far', 'المدفوع'), f.paid, 'paid'],
          [t('Outstanding', 'المستحق'), f.outstanding, 'outstanding'],
        ].map(([l, v, id]) => (
          <div key={id as string}>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{l as string}</div>
            <div data-testid={`text-budget-${id}`} className={cn('num mt-1 text-xl font-semibold tracking-tight md:text-2xl', id === 'remaining' && (v as number) < 0 ? 'text-clay' : id === 'paid' ? 'text-gold' : 'text-forest')}>{aed(v as number, lang)}</div>
            {id === 'remaining' && <div className="text-[11px] text-muted-foreground">{t('budget minus committed', 'الميزانية ناقص الملتزم به')}</div>}
          </div>
        ))}
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-forest">{t('Planned vs actual', 'المخطط مقابل الفعلي')}</h2>
          <p className="mb-4 text-xs text-muted-foreground">{t('Actual uses the final amount where entered, otherwise the estimate.', 'الفعلي يستخدم المبلغ النهائي إن أدخل وإلا التقديري.')}</p>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -10, right: 6 }}>
                <CartesianGrid vertical={false} stroke="#EAE3D6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#5f665f' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => aed(v, lang)} contentStyle={{ borderRadius: 12, border: '1px solid #EAE3D6', fontSize: 12 }} />
                <RBar dataKey="planned" name={t('Planned', 'المخطط')} fill="#EAE3D6" radius={[6, 6, 0, 0]} />
                <RBar dataKey="actual" name={t('Actual', 'الفعلي')} fill="#173B35" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-beige" />{t('Planned', 'المخطط')}</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-forest" />{t('Actual / committed', 'الفعلي / الملتزم')}</span></div>
        </Card>

        <Card className="p-6">
          <div className="mb-1 flex items-baseline justify-between"><h2 className="font-serif text-2xl text-forest">{t('By category', 'حسب الفئة')}</h2><span className={cn('num text-xs', unallocated < 0 ? 'text-clay' : 'text-muted-foreground')}>{unallocated >= 0 ? t('Unallocated', 'غير موزع') : t('Over-allocated', 'تجاوز التوزيع')}: {aed(Math.abs(unallocated), lang)}</span></div>
          <p className="mb-4 text-xs text-muted-foreground">{t('Allocations are your plan; adjust any amount.', 'المخصصات خطتكم، عدلوا أي مبلغ.')}</p>
          <div className="space-y-3.5">
            {state.cats.map((c) => {
              const r = f.byCat[c.id];
              const over = r.committed > c.allocated;
              return (
                <div key={c.id} data-testid={`row-cat-${c.id}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: CAT_COLORS[c.id] }} />
                    <button onClick={() => setCat(cat === c.id ? 'all' : c.id)} className={cn('flex-1 truncate text-start text-forest hover:text-gold', cat === c.id && 'font-semibold')}>{b(L.budgetCat[c.id])}</button>
                    <span className={cn('num', over ? 'text-clay' : 'text-muted-foreground')}>{aed(r.committed, lang)} /</span>
                    <input data-testid={`input-alloc-${c.id}`} aria-label={t('Allocation', 'المخصص')} type="number" min={0} value={c.allocated} onChange={(e) => setAlloc(c.id, e.target.value)} className="num h-7 w-24 rounded-lg border border-input bg-ivory/60 px-2 text-end text-xs outline-none focus:border-gold" />
                  </div>
                  <Bar value={c.allocated ? (r.committed / c.allocated) * 100 : r.committed ? 100 : 0} tone={over ? 'clay' : 'forest'} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mb-6 p-2 md:p-4">
        <div className="flex flex-wrap items-center gap-1.5 px-2 pb-3 pt-2">
          <h2 className="me-auto font-serif text-2xl text-forest">{t('Expenses', 'المصاريف')}</h2>
          <Chip testid="filter-expense-all" active={cat === 'all'} onClick={() => setCat('all')}>{t('All', 'الكل')}</Chip>
          <Select data-testid="select-expense-filter" value={cat} onChange={(e) => setCat(e.target.value as BudgetCatId | 'all')} className="h-8 w-auto text-xs"><option value="all">{t('Filter by category', 'تصفية حسب الفئة')}</option>{BCATS.map((c) => <option key={c} value={c}>{b(L.budgetCat[c])}</option>)}</Select>
        </div>
        {rows.length === 0 ? (
          <Empty title={t('No expenses here yet', 'لا توجد مصاريف هنا')} sub={t('Add quotes as estimates, then record the actual amount once confirmed.', 'أضيفوا العروض كتقديرات، ثم سجلوا المبلغ الفعلي عند التأكيد.')} action={<Btn size="sm" onClick={() => setDlg({ open: true, e: null })}><Plus className="h-3.5 w-3.5" />{t('Add expense', 'إضافة مصروف')}</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="text-xs text-muted-foreground">{[t('Expense', 'المصروف'), t('Estimated', 'التقديري'), t('Actual', 'الفعلي'), t('Paid', 'المدفوع'), t('Outstanding', 'المستحق'), t('Due', 'الاستحقاق'), ''].map((h, i) => <th key={i} className={cn('px-2 py-2 font-medium', i === 0 ? 'text-start' : i < 5 ? 'text-end' : 'text-start')}>{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map((e) => {
                  const out = outstandingOf(e);
                  const d = e.dueDate ? daysUntil(e.dueDate) : null;
                  return (
                    <tr key={e.id} data-testid={`row-expense-${e.id}`} className="group">
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2 text-forest"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: CAT_COLORS[e.cat] }} />{e.description}{e.sample && <SampleTag />}</div>
                        <div className="ms-4 text-xs text-muted-foreground">{b(L.budgetCat[e.cat])}{e.vendor ? ` · ${e.vendor}` : ''}{e.notes ? ` · ${e.notes}` : ''}</div>
                      </td>
                      <td className="num px-2 text-end text-muted-foreground">{aed(e.estimated, lang)}</td>
                      <td className="num px-2 text-end text-forest">{e.actual == null ? <span className="text-xs text-muted-foreground">{t('pending', 'لم يحدد')}</span> : aed(e.actual, lang)}</td>
                      <td className="num px-2 text-end text-gold">{aed(e.paid, lang)}</td>
                      <td className={cn('num px-2 text-end', out > 0 ? 'text-forest' : 'text-muted-foreground')}>{out > 0 ? aed(out, lang) : t('Settled', 'مسدد')}</td>
                      <td className={cn('px-2 text-xs', out > 0 && d !== null && d < 0 ? 'text-clay' : 'text-muted-foreground')}>{e.dueDate ? fmtDate(e.dueDate, lang) : '—'}</td>
                      <td className="whitespace-nowrap px-2 text-end">
                        <button data-testid={`button-edit-expense-${e.id}`} onClick={() => setDlg({ open: true, e })} className="rounded-lg p-1.5 text-forest hover:bg-muted" aria-label={t('Edit', 'تعديل')}><Pencil className="h-4 w-4" /></button>
                        <button data-testid={`button-delete-expense-${e.id}`} onClick={() => setDel(e)} className="rounded-lg p-1.5 text-clay hover:bg-clay/10" aria-label={t('Delete', 'حذف')}><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr className="border-t border-border text-xs font-semibold text-forest">
                <td className="px-2 py-3">{t('Total', 'المجموع')}</td>
                <td className="num px-2 text-end">{aed(rows.reduce((a, e) => a + e.estimated, 0), lang)}</td>
                <td className="num px-2 text-end">{aed(rows.reduce((a, e) => a + (e.actual ?? 0), 0), lang)}</td>
                <td className="num px-2 text-end">{aed(rows.reduce((a, e) => a + e.paid, 0), lang)}</td>
                <td className="num px-2 text-end">{aed(rows.reduce((a, e) => a + outstandingOf(e), 0), lang)}</td>
                <td colSpan={2} className="px-2 text-muted-foreground">{t('Committed', 'الملتزم')}: <span className="num">{aed(rows.reduce((a, e) => a + committed(e), 0), lang)}</span></td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </Card>

      <Contributions />

      <ExpenseDialog open={dlg.open} initial={dlg.e} defaultCat={cat === 'all' ? undefined : cat} onClose={() => setDlg({ open: false, e: null })} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Delete this expense?', 'حذف هذا المصروف؟')} body={del?.description ?? ''} confirmLabel={t('Delete', 'حذف')}
        onConfirm={() => { if (del) { update((s) => ({ ...s, expenses: s.expenses.filter((x) => x.id !== del.id) })); toast({ title: t('Expense deleted', 'تم حذف المصروف') }); } }} />
    </div>
  );
}

function Contributions() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const f = finance(state);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', source: 'self' as ContribSource, amount: '', received: false });
  const [err, setErr] = useState('');
  const save = () => {
    const n = Number(form.amount);
    if (!form.name.trim()) return setErr(t('Add a name.', 'أضيفوا اسماً.'));
    if (!(n > 0)) return setErr(t('Enter an amount greater than zero.', 'أدخلوا مبلغاً أكبر من صفر.'));
    update((s) => ({ ...s, contributions: [...s.contributions, { id: uid(), name: form.name.trim(), source: form.source, amount: Math.round(n), received: form.received, note: '' }] }));
    setOpen(false); setForm({ name: '', source: 'self', amount: '', received: false }); setErr('');
  };
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-3">
        <HandCoins className="h-5 w-5 text-gold" />
        <div className="flex-1"><h2 className="font-serif text-xl text-forest">{t('Contributions (optional)', 'المساهمات (اختياري)')}</h2><p className="text-xs text-muted-foreground">{t('Mizan never assumes who pays for what. Track contributions only if it helps you.', 'ميزان لا يفترض من يدفع ماذا. تتبعوا المساهمات فقط إن كان ذلك مفيداً.')}</p></div>
        <label className="flex items-center gap-2 text-xs text-forest"><input data-testid="toggle-contributions" type="checkbox" className="accent-[#173B35]" checked={state.showContributions} onChange={(e) => update((s) => ({ ...s, showContributions: e.target.checked }))} />{t('Track contributions', 'تتبع المساهمات')}</label>
      </div>
      {state.showContributions && (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap gap-6 text-sm"><span className="text-muted-foreground">{t('Received', 'المستلم')}: <b className="num text-forest">{aed(f.contribReceived, lang)}</b></span><span className="text-muted-foreground">{t('Pledged', 'الموعود')}: <b className="num text-forest">{aed(f.contribPledged, lang)}</b></span></div>
          <ul className="divide-y divide-border">
            {state.contributions.map((c) => (
              <li key={c.id} data-testid={`row-contribution-${c.id}`} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="flex-1 text-forest">{c.name} <span className="text-xs text-muted-foreground">· {b(L.contrib[c.source])}</span> {c.sample && <SampleTag />}</span>
                <span className="num text-forest">{aed(c.amount, lang)}</span>
                <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" className="accent-[#173B35]" checked={c.received} onChange={() => update((s) => ({ ...s, contributions: s.contributions.map((x) => (x.id === c.id ? { ...x, received: !x.received } : x)) }))} />{t('Received', 'مستلم')}</label>
                <button onClick={() => update((s) => ({ ...s, contributions: s.contributions.filter((x) => x.id !== c.id) }))} className="p-1 text-clay" aria-label={t('Delete', 'حذف')}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <Btn size="sm" variant="outline" className="mt-3" data-testid="button-add-contribution" onClick={() => setOpen(true)}><Plus className="h-3.5 w-3.5" />{t('Add contribution', 'إضافة مساهمة')}</Btn>
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={t('Add contribution', 'إضافة مساهمة')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('From', 'من')} error={err} className="col-span-2"><Input data-testid="input-contribution-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t('Type', 'النوع')}><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as ContribSource })}>{(Object.keys(L.contrib) as ContribSource[]).map((s) => <option key={s} value={s}>{b(L.contrib[s])}</option>)}</Select></Field>
          <Field label={t('Amount (AED)', 'المبلغ (درهم)')}><Input data-testid="input-contribution-amount" type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <label className="col-span-2 flex items-center gap-2 text-sm text-forest"><input type="checkbox" className="accent-[#173B35]" checked={form.received} onChange={(e) => setForm({ ...form, received: e.target.checked })} />{t('Already received', 'تم استلامه')}</label>
        </div>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-contribution" onClick={save}>{t('Save', 'حفظ')}</Btn></div>
      </Modal>
    </Card>
  );
}
