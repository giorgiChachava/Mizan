import { useState } from 'react';
import { useSearch } from 'wouter';
import { Check, Eye, Lock, MessageCircle, Pencil, Send, Trash2, UserPlus } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { finance } from '@/lib/calc';
import { IMG, todayISO, uid } from '@/lib/seed';
import { Bar, Btn, Card, Empty, Field, Input, Modal, PageHeader, Select, Textarea } from '@/components/kit';
import { ConfirmDialog } from '@/components/forms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BudgetCatId, Collaborator, Role } from '@/lib/types';

export default function Family() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const params = new URLSearchParams(useSearch());
  const [invite, setInvite] = useState<Collaborator | 'new' | null>(params.get('invite') ? 'new' : null);
  const [form, setForm] = useState({ name: '', contact: '', role: 'family' as Role, message: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [del, setDel] = useState<Collaborator | null>(null);
  const [preview, setPreview] = useState<Collaborator | null>(null);
  const [comment, setComment] = useState('');
  const [commentTask, setCommentTask] = useState('');
  const f = finance(state);

  const openInvite = (c: Collaborator | 'new') => { setErr({}); setForm(c === 'new' ? { name: '', contact: '', role: 'family', message: t('Join me in planning our wedding on Mizan.', 'انضم إليّ لتخطيط زفافنا على ميزان.') } : { name: c.name, contact: c.contact, role: c.role, message: '' }); setInvite(c); };
  const saveInvite = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t('Name is required.', 'الاسم مطلوب.');
    if (!/^\S+@\S+\.\S+$/.test(form.contact) && !/^[+\d\s]{7,}$/.test(form.contact)) e.contact = t('Enter a valid email or phone.', 'أدخل بريداً أو هاتفاً صحيحاً.');
    setErr(e);
    if (Object.keys(e).length) return;
    if (invite === 'new') {
      update((s) => ({ ...s, collaborators: [...s.collaborators, { id: uid(), name: form.name.trim(), contact: form.contact.trim(), role: form.role, status: 'invited', sharedCats: [], shareGuests: false, shareTasks: true }] }));
      toast({ title: t('Simulated invitation created', 'تم إنشاء دعوة تجريبية'), description: t('No real message was sent. Mark it accepted to simulate them joining.', 'لم تُرسل رسالة حقيقية. حدّدها كمقبولة لمحاكاة الانضمام.') });
    } else {
      const id = (invite as Collaborator).id;
      update((s) => ({ ...s, collaborators: s.collaborators.map((c) => (c.id === id ? { ...c, name: form.name.trim(), contact: form.contact.trim(), role: form.role } : c)) }));
    }
    setInvite(null);
  };
  const patch = (id: string, p: Partial<Collaborator>) => update((s) => ({ ...s, collaborators: s.collaborators.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const toggleCat = (c: Collaborator, cat: BudgetCatId) => patch(c.id, { sharedCats: c.sharedCats.includes(cat) ? c.sharedCats.filter((x) => x !== cat) : [...c.sharedCats, cat] });
  const addComment = () => {
    if (!comment.trim()) return;
    update((s) => ({ ...s, comments: [{ id: uid(), author: s.profile.name || 'Me', text: comment.trim(), date: todayISO(), taskId: commentTask || undefined }, ...s.comments] }));
    setComment('');
  };

  return (
    <div>
      <PageHeader eyebrow={t('Family Collaboration', 'التعاون العائلي')} title={t('Plan Together', 'خططوا معاً')} sub={t('Simulated invitations for this prototype. You decide exactly what each person can see.', 'دعوات تجريبية لهذا النموذج. أنت من يحدد ما يراه كل شخص.')}
        actions={<Btn data-testid="button-invite" onClick={() => openInvite('new')}><UserPlus className="h-4 w-4" />{t('Invite collaborator', 'دعوة مشارك')}</Btn>} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          {state.collaborators.length === 0 && <Empty title={t('Planning alone for now', 'تخطط وحدك حالياً')} sub={t('Invite your fiancé(e), parents or a coordinator.', 'ادعُ خطيبك/خطيبتك أو الوالدين أو منسقاً.')} />}
          {state.collaborators.map((c) => {
            const tasks = state.tasks.filter((x) => x.assignee === c.id);
            const done = tasks.filter((x) => x.done).length;
            return (
              <Card key={c.id} data-testid={`card-collab-${c.id}`} className="p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-forest font-serif text-lg text-gold">{c.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1"><div className="font-medium text-forest">{c.name}</div><div className="truncate text-xs text-muted-foreground">{b(L.role[c.role])} · {c.contact}</div></div>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', c.status === 'accepted' ? 'bg-forest/10 text-forest' : 'bg-gold/20 text-[#8a6a3a]')}>{c.status === 'accepted' ? t('Joined', 'انضم') : t('Invitation pending', 'الدعوة معلقة')}</span>
                  {c.status === 'invited' && <Btn size="sm" variant="outline" data-testid={`button-accept-${c.id}`} onClick={() => patch(c.id, { status: 'accepted' })}><Check className="h-3.5 w-3.5" />{t('Simulate accept', 'محاكاة القبول')}</Btn>}
                  <button data-testid={`button-preview-${c.id}`} title={t('Preview their view', 'معاينة ما يراه')} onClick={() => setPreview(c)} className="p-1.5 text-forest"><Eye className="h-4 w-4" /></button>
                  <button data-testid={`button-edit-collab-${c.id}`} onClick={() => openInvite(c)} className="p-1.5 text-forest"><Pencil className="h-4 w-4" /></button>
                  <button data-testid={`button-remove-collab-${c.id}`} onClick={() => setDel(c)} className="p-1.5 text-clay"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold uppercase tracking-[0.12em] text-forest">{t('Assigned tasks', 'المهام المسندة')}</span><span className="num text-muted-foreground">{done}/{tasks.length}</span></div>
                    <Bar value={tasks.length ? (done / tasks.length) * 100 : 0} className="mb-2" />
                    <ul className="space-y-1">
                      {tasks.slice(0, 4).map((x) => <li key={x.id} className={cn('text-xs', x.done ? 'text-muted-foreground line-through' : 'text-forest')}>• {x.title}</li>)}
                      {tasks.length === 0 && <li className="text-xs text-muted-foreground">{t('No tasks assigned', 'لا مهام مسندة')}</li>}
                    </ul>
                    <Select data-testid={`select-assign-${c.id}`} className="mt-2 h-8 text-xs" value="" onChange={(e) => { const id = e.target.value; if (id) update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === id ? { ...x, assignee: c.id } : x)) })); }}>
                      <option value="">{t('+ Assign a task…', '+ إسناد مهمة…')}</option>
                      {state.tasks.filter((x) => x.assignee !== c.id && !x.done).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
                    </Select>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-forest"><Lock className="h-3 w-3 text-gold" />{t('Privacy — shared with them', 'الخصوصية — ما تتم مشاركته')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {state.cats.map((cat) => {
                        const on = c.sharedCats.includes(cat.id);
                        return <button key={cat.id} data-testid={`toggle-share-${c.id}-${cat.id}`} onClick={() => toggleCat(c, cat.id)} className={cn('rounded-full border px-2 py-1 text-[11px]', on ? 'border-forest bg-forest text-ivory' : 'border-border text-muted-foreground')}>{b(L.budgetCat[cat.id])}</button>;
                      })}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-forest">
                      <label className="flex items-center gap-2"><input data-testid={`toggle-guests-${c.id}`} type="checkbox" className="accent-[#173B35]" checked={c.shareGuests} onChange={(e) => patch(c.id, { shareGuests: e.target.checked })} />{t('Share guest list', 'مشاركة قائمة الضيوف')}</label>
                      <label className="flex items-center gap-2"><input data-testid={`toggle-tasks-${c.id}`} type="checkbox" className="accent-[#173B35]" checked={c.shareTasks} onChange={(e) => patch(c.id, { shareTasks: e.target.checked })} />{t('Can view assigned tasks', 'يمكنه رؤية المهام المسندة')}</label>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <img src={IMG('florals')} alt="" className="h-32 w-full object-cover" />
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-gold" /><h2 className="font-serif text-2xl text-forest">{t('Comments & notes', 'التعليقات والملاحظات')}</h2></div>
              <Textarea data-testid="input-comment" placeholder={t('Leave a note for the family…', 'اترك ملاحظة للعائلة…')} value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="mt-2 flex gap-2">
                <Select data-testid="select-comment-task" className="h-9 text-xs" value={commentTask} onChange={(e) => setCommentTask(e.target.value)}><option value="">{t('General note', 'ملاحظة عامة')}</option>{state.tasks.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Select>
                <Btn size="sm" data-testid="button-add-comment" disabled={!comment.trim()} onClick={addComment}><Send className="h-3.5 w-3.5 rtl:-scale-x-100" /></Btn>
              </div>
              <ul className="mt-4 space-y-3">
                {state.comments.map((m) => (
                  <li key={m.id} data-testid={`comment-${m.id}`} className="group rounded-xl bg-muted p-3 text-sm">
                    <div className="flex items-center justify-between text-xs"><span className="font-medium text-forest">{m.author}</span><span className="flex items-center gap-2 text-muted-foreground">{fmtDate(m.date, lang)}<button data-testid={`button-delete-comment-${m.id}`} onClick={() => update((s) => ({ ...s, comments: s.comments.filter((x) => x.id !== m.id) }))} className="text-clay opacity-60 hover:opacity-100"><Trash2 className="h-3 w-3" /></button></span></div>
                    {m.taskId && <div className="text-[11px] text-gold">{state.tasks.find((x) => x.id === m.taskId)?.title}</div>}
                    <div className="mt-1 text-forest">{m.text}</div>
                  </li>
                ))}
                {state.comments.length === 0 && <li className="text-xs text-muted-foreground">{t('No notes yet.', 'لا توجد ملاحظات.')}</li>}
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!invite} onClose={() => setInvite(null)} title={invite === 'new' ? t('Invite a collaborator', 'دعوة مشارك') : t('Edit collaborator', 'تعديل المشارك')} desc={t('Prototype: invitations are simulated and nothing is sent.', 'نموذج أولي: الدعوات تجريبية ولا يُرسل شيء.')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Name', 'الاسم')} error={err.name}><Input data-testid="input-invite-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t('Role', 'الدور')}><Select data-testid="select-invite-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>{(Object.keys(L.role) as Role[]).map((r) => <option key={r} value={r}>{b(L.role[r])}</option>)}</Select></Field>
          <Field label={t('Email or phone', 'البريد أو الهاتف')} error={err.contact} className="col-span-2"><Input data-testid="input-invite-contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></Field>
          {invite === 'new' && <Field label={t('Personal message', 'رسالة شخصية')} className="col-span-2"><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>}
        </div>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setInvite(null)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-send-invite" onClick={saveInvite}>{invite === 'new' ? t('Create invitation', 'إنشاء الدعوة') : t('Save', 'حفظ')}</Btn></div>
      </Modal>

      <Modal wide open={!!preview} onClose={() => setPreview(null)} title={t(`What ${preview?.name} can see`, `ما يراه ${preview?.name}`)} desc={t('A preview of the shared view under your current privacy settings.', 'معاينة للعرض المشترك وفق إعدادات الخصوصية الحالية.')}>
        {preview && (
          <div className="space-y-4 text-sm">
            <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest">{t('Shared budget categories', 'فئات الميزانية المشتركة')}</div>
              {preview.sharedCats.length === 0 ? <div className="text-muted-foreground">{t('No budget information shared.', 'لا تتم مشاركة معلومات الميزانية.')}</div> : (
                <div className="grid gap-2 sm:grid-cols-2">{preview.sharedCats.map((id) => { const c = state.cats.find((x) => x.id === id)!; return <div key={id} className="rounded-xl border border-border p-3"><div className="text-forest">{b(L.budgetCat[id])}</div><div className="num text-xs text-muted-foreground">{aed(f.committedByCat[id] || 0, lang)} / {aed(c.allocated, lang)} ({t('sample', 'مثال')})</div></div>; })}</div>
              )}
            </div>
            <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest">{t('Guest list', 'قائمة الضيوف')}</div>
              {preview.shareGuests ? <ul className="grid gap-1 sm:grid-cols-2">{state.guests.map((g) => <li key={g.id} className="text-forest">{g.name} · <span className="text-muted-foreground">{b(L.rsvp[g.rsvp])}</span></li>)}</ul> : <div className="text-muted-foreground">{t('Guest list is private.', 'قائمة الضيوف خاصة.')}</div>}
            </div>
            <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-forest">{t('Their tasks', 'مهامه')}</div>
              {preview.shareTasks ? <ul>{state.tasks.filter((x) => x.assignee === preview.id).map((x) => <li key={x.id} className="text-forest">{x.done ? '✓ ' : '○ '}{x.title}</li>)}</ul> : <div className="text-muted-foreground">{t('Tasks hidden.', 'المهام مخفية.')}</div>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Remove collaborator?', 'إزالة المشارك؟')} body={t('Their tasks will be reassigned to you.', 'ستُسند مهامه إليك.')} onConfirm={() => { const id = del!.id; update((s) => ({ ...s, collaborators: s.collaborators.filter((c) => c.id !== id), tasks: s.tasks.map((x) => (x.assignee === id ? { ...x, assignee: 'me' } : x)) })); }} />
    </div>
  );
}
