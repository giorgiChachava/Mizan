import { useState } from 'react';
import { Check, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, fmtDate, useT } from '@/lib/i18n';
import { daysUntil } from '@/lib/calc';
import { IMG } from '@/lib/seed';
import { Btn, Card, Chip, Empty, PageHeader, SampleTag } from '@/components/kit';
import { ConfirmDialog, PCATS, TaskDialog } from '@/components/forms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BlueprintCat, Task } from '@/lib/types';

const CAT_IMG: Record<BlueprintCat, string> = { venue: 'venue', catering: 'catering', clothing: 'attire', photo: 'photo', invitations: 'invitation', decoration: 'florals' };

export default function Wedding() {
  const { state, update, setQuizOpen } = useApp();
  const { t, b, lang } = useT();
  const [cat, setCat] = useState<BlueprintCat | 'all'>('all');
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');
  const [dlg, setDlg] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [del, setDel] = useState<Task | null>(null);

  const total = state.tasks.length;
  const done = state.tasks.filter((x) => x.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const toggle = (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  const visible = state.tasks
    .filter((x) => (cat === 'all' || x.cat === cat) && (filter === 'all' || (filter === 'done' ? x.done : !x.done)))
    .sort((a, c) => Number(a.done) - Number(c.done) || (a.deadline || '9').localeCompare(c.deadline || '9'));

  return (
    <div>
      <PageHeader eyebrow={t('My Wedding', 'زفافي')} title={t('Your wedding blueprint', 'مخطط زفافكم')}
        sub={t('A checklist shaped by your profile. Rename, reschedule or remove anything that does not fit your families\u2019 way of doing things.', 'قائمة مهام مبنية على ملفكم. أعيدوا التسمية أو الجدولة أو احذفوا ما لا يناسب طريقة عائلتيكم.')}
        actions={<><Btn variant="outline" data-testid="button-refresh-suggestions" onClick={() => setQuizOpen(true)}><Sparkles className="h-4 w-4" />{t('Tune suggestions', 'ضبط الاقتراحات')}</Btn><Btn data-testid="button-add-task" onClick={() => setDlg({ open: true, task: null })}><Plus className="h-4 w-4" />{t('Add task', 'إضافة مهمة')}</Btn></>} />

      <Card className="rise mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <div className="relative grid h-24 w-24 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#EAE3D6" strokeWidth="2.4" /><circle cx="18" cy="18" r="15.9" fill="none" stroke="#B99A62" strokeWidth="2.4" strokeLinecap="round" strokeDasharray={`${pct} 100`} className="transition-[stroke-dasharray] duration-700" /></svg>
          <span data-testid="text-completion" className="num font-serif text-3xl text-forest">{pct}%</span>
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-2xl text-forest">{t('Overall completion', 'نسبة الإنجاز الكلية')}</h2>
          <p className="text-sm text-muted-foreground">{t(`${done} of ${total} tasks complete`, `${done} من ${total} مهمة مكتملة`)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([['all', t('All', 'الكل')], ['open', t('To do', 'قيد التنفيذ')], ['done', t('Completed', 'مكتملة')]] as const).map(([k, l]) => <Chip key={k} testid={`filter-${k}`} active={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {PCATS.map((c) => {
          const ts = state.tasks.filter((x) => x.cat === c);
          const p = ts.length ? (ts.filter((x) => x.done).length / ts.length) * 100 : 0;
          return (
            <button key={c} data-testid={`button-cat-${c}`} onClick={() => setCat(cat === c ? 'all' : c)} aria-pressed={cat === c} className={cn('group relative h-36 overflow-hidden rounded-2xl text-start ring-offset-2 ring-offset-background transition', cat === c && 'ring-2 ring-gold')}>
              <img src={IMG(CAT_IMG[c])} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-forest/10" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-ivory">
                <div className="text-sm font-medium leading-tight">{b(L.blueprint[c])}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-ivory/70"><span className="num">{ts.filter((x) => x.done).length}/{ts.length}</span><span className="h-1 flex-1 overflow-hidden rounded-full bg-ivory/20"><span className="block h-full bg-gold" style={{ width: `${p}%` }} /></span></div>
              </div>
            </button>
          );
        })}
      </div>

      <Card className="p-2 md:p-4">
        <div className="flex items-center justify-between px-2 pb-3 pt-2">
          <h3 className="font-serif text-xl text-forest">{cat === 'all' ? t('All tasks', 'كل المهام') : b(L.blueprint[cat])}</h3>
          {cat !== 'all' && <button className="text-xs text-gold" onClick={() => setCat('all')}>{t('Show all', 'عرض الكل')}</button>}
        </div>
        {visible.length === 0 ? (
          <Empty title={t('Nothing here yet', 'لا شيء هنا بعد')} sub={t('Add a task that reflects how your families celebrate.', 'أضيفوا مهمة تعكس طريقة احتفال عائلتيكم.')} action={<Btn size="sm" onClick={() => setDlg({ open: true, task: null })}><Plus className="h-3.5 w-3.5" />{t('Add task', 'إضافة مهمة')}</Btn>} />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((x) => {
              const d = x.deadline ? daysUntil(x.deadline) : null;
              return (
                <li key={x.id} data-testid={`row-task-${x.id}`} className="group flex items-start gap-3 px-2 py-3">
                  <button data-testid={`checkbox-task-${x.id}`} onClick={() => toggle(x.id)} aria-label={x.done ? t('Mark as not done', 'إلغاء الإكمال') : t('Mark as completed', 'تحديد كمكتملة')} aria-pressed={x.done}
                    className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition', x.done ? 'border-gold bg-gold text-forest' : 'border-forest/30 hover:border-gold')}>
                    {x.done && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-sm', x.done ? 'text-muted-foreground line-through' : 'text-forest')}>{x.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{b(L.blueprint[x.cat])}</span>
                      {x.deadline && <span className={cn(!x.done && d !== null && d < 0 && 'text-clay')}>· {fmtDate(x.deadline, lang)}{!x.done && d !== null && d < 0 ? ` (${t('overdue', 'متأخرة')})` : ''}</span>}
                      {x.source === 'profile' && <span className="rounded-full bg-forest/5 px-2 py-0.5 text-[10px] text-forest">{t('Suggested for you', 'مقترحة لكم')}</span>}
                      {x.source === 'sample' && <SampleTag />}
                    </div>
                    {x.notes && <div className="mt-1 text-xs text-muted-foreground">{x.notes}</div>}
                  </div>
                  <div className="flex shrink-0 gap-0.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                    <button data-testid={`button-edit-task-${x.id}`} onClick={() => setDlg({ open: true, task: x })} className="rounded-lg p-1.5 text-forest hover:bg-muted" aria-label={t('Edit', 'تعديل')}><Pencil className="h-4 w-4" /></button>
                    <button data-testid={`button-delete-task-${x.id}`} onClick={() => setDel(x)} className="rounded-lg p-1.5 text-clay hover:bg-clay/10" aria-label={t('Delete', 'حذف')}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <TaskDialog open={dlg.open} initial={dlg.task} defaultCat={cat === 'all' ? undefined : cat} onClose={() => setDlg({ open: false, task: null })} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Delete this task?', 'حذف هذه المهمة؟')} body={del?.title ?? ''} confirmLabel={t('Delete', 'حذف')}
        onConfirm={() => { if (del) { update((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== del.id) })); toast({ title: t('Task deleted', 'تم حذف المهمة') }); } }} />
    </div>
  );
}
