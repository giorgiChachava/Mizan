import { useEffect, useState } from 'react';
import { Btn, Field, Input, Modal, Select, Textarea } from './kit';
import { useApp } from '@/lib/store';
import { L, useT } from '@/lib/i18n';
import { uid } from '@/lib/seed';
import { toast } from '@/hooks/use-toast';
import type { BlueprintCat, BudgetCatId, Expense, Task } from '@/lib/types';

export const BCATS = Object.keys(L.budgetCat) as BudgetCatId[];
export const PCATS = Object.keys(L.blueprint) as BlueprintCat[];

type ExpDraft = { cat: BudgetCatId; description: string; estimated: string; actual: string; paid: string; dueDate: string; notes: string; vendor: string };
const blankExp = (cat: BudgetCatId = 'venue'): ExpDraft => ({ cat, description: '', estimated: '', actual: '', paid: '0', dueDate: '', notes: '', vendor: '' });

export function ExpenseDialog({ open, onClose, initial, defaultCat }: { open: boolean; onClose: () => void; initial?: Expense | null; defaultCat?: BudgetCatId }) {
  const { update } = useApp();
  const { t, b } = useT();
  const [f, setF] = useState<ExpDraft>(blankExp());
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!open) return;
    setErr({});
    setF(initial ? { cat: initial.cat, description: initial.description, estimated: String(initial.estimated), actual: initial.actual == null ? '' : String(initial.actual), paid: String(initial.paid), dueDate: initial.dueDate, notes: initial.notes, vendor: initial.vendor } : blankExp(defaultCat));
  }, [open, initial, defaultCat]);

  const submit = () => {
    const e: Record<string, string> = {};
    const est = Number(f.estimated);
    const act = f.actual.trim() === '' ? null : Number(f.actual);
    const paid = f.paid.trim() === '' ? 0 : Number(f.paid);
    if (!f.description.trim()) e.description = t('Please add a description.', 'يرجى إضافة وصف.');
    if (f.estimated.trim() === '' || !(est >= 0) || isNaN(est)) e.estimated = t('Enter an estimate of zero or more.', 'أدخل تقديراً يساوي صفراً أو أكثر.');
    if (act !== null && (isNaN(act) || act < 0)) e.actual = t('Actual must be zero or more, or left blank.', 'يجب أن يكون الفعلي صفراً أو أكثر أو يترك فارغاً.');
    if (isNaN(paid) || paid < 0) e.paid = t('Paid must be zero or more.', 'يجب أن يكون المدفوع صفراً أو أكثر.');
    else if (paid > (act ?? est)) e.paid = t('Paid cannot exceed the actual (or estimated) cost.', 'لا يمكن أن يتجاوز المدفوع التكلفة الفعلية أو التقديرية.');
    setErr(e);
    if (Object.keys(e).length) return;
    const rec: Expense = { id: initial?.id ?? uid(), cat: f.cat, description: f.description.trim(), estimated: Math.round(est), actual: act === null ? null : Math.round(act), paid: Math.round(paid), dueDate: f.dueDate, notes: f.notes.trim(), vendor: f.vendor.trim(), sample: initial?.sample };
    update((s) => ({ ...s, expenses: initial ? s.expenses.map((x) => (x.id === rec.id ? rec : x)) : [...s.expenses, rec] }));
    toast({ title: initial ? t('Expense updated', 'تم تحديث المصروف') : t('Expense added', 'تمت إضافة المصروف') });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Edit expense', 'تعديل المصروف') : t('Add expense', 'إضافة مصروف')} desc={t('All amounts in AED. Leave the actual amount blank until you have a final quote or invoice.', 'جميع المبالغ بالدرهم. اترك المبلغ الفعلي فارغاً حتى يصلك عرض أو فاتورة نهائية.')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Description', 'الوصف')} error={err.description} className="col-span-2"><Input data-testid="input-expense-description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label={t('Category', 'الفئة')} className="col-span-2 sm:col-span-1"><Select data-testid="select-expense-category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as BudgetCatId })}>{BCATS.map((c) => <option key={c} value={c}>{b(L.budgetCat[c])}</option>)}</Select></Field>
        <Field label={t('Vendor (optional)', 'المزود (اختياري)')} className="col-span-2 sm:col-span-1"><Input data-testid="input-expense-vendor" value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value })} /></Field>
        <Field label={t('Estimated (AED)', 'التقديري (درهم)')} error={err.estimated}><Input data-testid="input-expense-estimated" type="number" min={0} inputMode="numeric" value={f.estimated} onChange={(e) => setF({ ...f, estimated: e.target.value })} /></Field>
        <Field label={t('Actual (AED, optional)', 'الفعلي (درهم، اختياري)')} error={err.actual}><Input data-testid="input-expense-actual" type="number" min={0} inputMode="numeric" value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} /></Field>
        <Field label={t('Paid so far (AED)', 'المدفوع حتى الآن (درهم)')} error={err.paid}><Input data-testid="input-expense-paid" type="number" min={0} inputMode="numeric" value={f.paid} onChange={(e) => setF({ ...f, paid: e.target.value })} /></Field>
        <Field label={t('Payment due date', 'تاريخ استحقاق الدفع')}><Input data-testid="input-expense-due" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} /></Field>
        <Field label={t('Notes', 'ملاحظات')} className="col-span-2"><Textarea data-testid="input-expense-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      <div className="mt-2 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-expense" onClick={submit}>{t('Save expense', 'حفظ المصروف')}</Btn></div>
    </Modal>
  );
}

export function TaskDialog({ open, onClose, initial, defaultCat }: { open: boolean; onClose: () => void; initial?: Task | null; defaultCat?: BlueprintCat }) {
  const { update } = useApp();
  const { t, b } = useT();
  const [f, setF] = useState({ cat: 'venue' as BlueprintCat, title: '', deadline: '', notes: '' });
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(initial ? { cat: initial.cat, title: initial.title, deadline: initial.deadline, notes: initial.notes } : { cat: defaultCat ?? 'venue', title: '', deadline: '', notes: '' });
  }, [open, initial, defaultCat]);
  const submit = () => {
    if (!f.title.trim()) return setErr(t('Give the task a name.', 'أضف اسماً للمهمة.'));
    if (f.title.trim().length > 140) return setErr(t('Keep the name under 140 characters.', 'اجعل الاسم أقل من ١٤٠ حرفاً.'));
    // An edited suggestion becomes the couple's own task, so profile edits will never remove it.
    const rec: Task = initial
      ? { ...initial, cat: f.cat, title: f.title.trim(), deadline: f.deadline, notes: f.notes.trim(), source: initial.source === 'profile' ? 'custom' : initial.source }
      : { id: uid(), done: false, cat: f.cat, title: f.title.trim(), deadline: f.deadline, notes: f.notes.trim(), source: 'custom' };
    update((s) => ({ ...s, tasks: initial ? s.tasks.map((x) => (x.id === rec.id ? rec : x)) : [...s.tasks, rec] }));
    toast({ title: initial ? t('Task updated', 'تم تحديث المهمة') : t('Task added', 'تمت إضافة المهمة') });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? t('Edit task', 'تعديل المهمة') : t('New task', 'مهمة جديدة')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Task name', 'اسم المهمة')} error={err} className="col-span-2"><Input data-testid="input-task-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label={t('Category', 'الفئة')} className="col-span-2 sm:col-span-1"><Select data-testid="select-task-category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value as BlueprintCat })}>{PCATS.map((c) => <option key={c} value={c}>{b(L.blueprint[c])}</option>)}</Select></Field>
        <Field label={t('Due date (optional)', 'تاريخ الاستحقاق (اختياري)')} className="col-span-2 sm:col-span-1"><Input data-testid="input-task-deadline" type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        <Field label={t('Notes', 'ملاحظات')} className="col-span-2"><Textarea data-testid="input-task-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      <div className="mt-2 flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-task" onClick={submit}>{t('Save task', 'حفظ المهمة')}</Btn></div>
    </Modal>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={title} desc={body}>
      <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-confirm" className="bg-clay hover:bg-clay/90" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel ?? t('Confirm', 'تأكيد')}</Btn></div>
    </Modal>
  );
}
