import { useEffect, useState } from 'react';
import { Btn, Field, Input, Modal, Select, Textarea } from './kit';
import { useApp } from '@/lib/store';
import { L, useT } from '@/lib/i18n';
import { todayISO, uid } from '@/lib/seed';
import { toast } from '@/hooks/use-toast';
import type { BlueprintCat, BudgetCatId, Expense, PayStatus, Task } from '@/lib/types';

const BCATS = Object.keys(L.budgetCat) as BudgetCatId[];
const PCATS = Object.keys(L.blueprint) as BlueprintCat[];

export function ExpenseDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: Expense | null }) {
  const { update } = useApp();
  const { t, b } = useT();
  const blank = { cat: 'venue' as BudgetCatId, description: '', amount: '', paidAmount: '', date: todayISO(), status: 'unpaid' as PayStatus, vendor: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (open) {
      setErr({});
      setF(initial ? { ...initial, amount: String(initial.amount), paidAmount: String(initial.paidAmount) } : blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const submit = () => {
    const e: Record<string, string> = {};
    const amount = Number(f.amount);
    let paid = f.status === 'paid' ? amount : f.status === 'unpaid' ? 0 : Number(f.paidAmount);
    if (!f.description.trim()) e.description = t('Please add a description.', 'يرجى إضافة وصف.');
    if (!(amount > 0)) e.amount = t('Enter an amount greater than zero.', 'أدخل مبلغاً أكبر من صفر.');
    if (f.status === 'partial' && !(paid > 0 && paid < amount)) e.paidAmount = t('Partial payment must be between 0 and the total.', 'يجب أن يكون الدفع الجزئي بين صفر والمبلغ الكلي.');
    if (!f.date) e.date = t('Choose a date.', 'اختر تاريخاً.');
    setErr(e);
    if (Object.keys(e).length) return;
    paid = Math.round(paid);
    const rec: Expense = { id: initial?.id ?? uid(), cat: f.cat, description: f.description.trim(), amount: Math.round(amount), paidAmount: paid, date: f.date, status: f.status, vendor: f.vendor.trim() };
    update((s) => ({ ...s, expenses: initial ? s.expenses.map((x) => (x.id === rec.id ? rec : x)) : [...s.expenses, rec] }));
    toast({ title: initial ? t('Expense updated', 'تم تحديث المصروف') : t('Expense added', 'تمت إضافة المصروف') });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Edit expense', 'تعديل المصروف') : t('Add expense', 'إضافة مصروف')} desc={t('Amounts you enter are your own planning figures.', 'المبالغ المدخلة هي أرقامك التخطيطية.')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Description', 'الوصف')} error={err.description} className="col-span-2"><Input data-testid="input-expense-description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label={t('Category', 'الفئة')}><Select data-testid="select-expense-category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as BudgetCatId })}>{BCATS.map((c) => <option key={c} value={c}>{b(L.budgetCat[c])}</option>)}</Select></Field>
        <Field label={t('Amount (AED)', 'المبلغ (درهم)')} error={err.amount}><Input data-testid="input-expense-amount" type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field label={t('Status', 'الحالة')}><Select data-testid="select-expense-status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PayStatus })}>{(['paid', 'partial', 'unpaid'] as PayStatus[]).map((s) => <option key={s} value={s}>{b(L.pay[s])}</option>)}</Select></Field>
        {f.status === 'partial' ? (
          <Field label={t('Amount paid', 'المبلغ المدفوع')} error={err.paidAmount}><Input data-testid="input-expense-paid" type="number" min={0} value={f.paidAmount} onChange={(e) => setF({ ...f, paidAmount: e.target.value })} /></Field>
        ) : <div />}
        <Field label={t('Payment / due date', 'تاريخ الدفع / الاستحقاق')} error={err.date}><Input data-testid="input-expense-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label={t('Vendor (optional)', 'المزود (اختياري)')}><Input data-testid="input-expense-vendor" value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></Field>
      </div>
      <div className="mt-2 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-expense" onClick={submit}>{t('Save expense', 'حفظ المصروف')}</Btn></div>
    </Modal>
  );
}

export function TaskDialog({ open, onClose, initial, defaultCat }: { open: boolean; onClose: () => void; initial?: Task | null; defaultCat?: BlueprintCat }) {
  const { state, update } = useApp();
  const { t, b } = useT();
  const blank = { cat: defaultCat ?? ('venue' as BlueprintCat), title: '', deadline: '', assignee: 'me', notes: '', estimate: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (open) { setErr(''); setF(initial ? { ...initial, estimate: initial.estimate ? String(initial.estimate) : '' } : blank); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, defaultCat]);
  const submit = () => {
    if (!f.title.trim()) return setErr(t('Give the task a title.', 'أضف عنواناً للمهمة.'));
    const est = Number(f.estimate || 0);
    if (est < 0 || isNaN(est)) return setErr(t('Estimate must be zero or more.', 'يجب أن يكون التقدير صفراً أو أكثر.'));
    const rec: Task = { id: initial?.id ?? uid(), done: initial?.done ?? false, cat: f.cat, title: f.title.trim(), deadline: f.deadline, assignee: f.assignee, notes: f.notes, estimate: Math.round(est) };
    update((s) => ({ ...s, tasks: initial ? s.tasks.map((x) => (x.id === rec.id ? rec : x)) : [...s.tasks, rec] }));
    toast({ title: initial ? t('Task updated', 'تم تحديث المهمة') : t('Task added', 'تمت إضافة المهمة') });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Edit task', 'تعديل المهمة') : t('New task', 'مهمة جديدة')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Task', 'المهمة')} error={err} className="col-span-2"><Input data-testid="input-task-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={t('Blueprint category', 'فئة المخطط')}><Select data-testid="select-task-category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as BlueprintCat })}>{PCATS.map((c) => <option key={c} value={c}>{b(L.blueprint[c])}</option>)}</Select></Field>
        <Field label={t('Deadline', 'الموعد النهائي')}><Input data-testid="input-task-deadline" type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        <Field label={t('Assigned to', 'مسندة إلى')}><Select data-testid="select-task-assignee" value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}><option value="me">{t('Me', 'أنا')}</option>{state.collaborators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label={t('Budget estimate (AED)', 'التكلفة التقديرية (درهم)')}><Input data-testid="input-task-estimate" type="number" min={0} value={f.estimate} onChange={(e) => setF({ ...f, estimate: e.target.value })} /></Field>
        <Field label={t('Notes', 'ملاحظات')} className="col-span-2"><Textarea data-testid="input-task-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      <div className="mt-2 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-task" onClick={submit}>{t('Save task', 'حفظ المهمة')}</Btn></div>
    </Modal>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={title} desc={body}>
      <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-confirm" className="bg-clay hover:bg-clay/90" onClick={() => { onConfirm(); onClose(); }}>{t('Confirm', 'تأكيد')}</Btn></div>
    </Modal>
  );
}
