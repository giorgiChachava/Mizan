import { useState } from 'react';
import { useSearch } from 'wouter';
import { Check, Clock, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { syncCatering, useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { daysUntil } from '@/lib/calc';
import { IMG, uid } from '@/lib/seed';
import { Btn, Card, Chip, Empty, Field, Input, Modal, PageHeader, SampleTag, Select, Textarea, Bar } from '@/components/kit';
import { ConfirmDialog, TaskDialog } from '@/components/forms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BlueprintCat, Guest, Rsvp, ScheduleItem, Task } from '@/lib/types';

const CAT_IMG: Record<BlueprintCat, string> = { engagement: 'jewellery', venue: 'venue', prep: 'attire', invites: 'invitation', finance: 'catering', day: 'hero-stage' };
const CAT_SCOPE: Record<BlueprintCat, { en: string; ar: string }> = {
  engagement: { en: 'Engagement arrangements, mahr, rings, jewellery, gifts and family celebrations.', ar: 'ترتيبات الخطوبة والمهر والخواتم والمجوهرات والهدايا والاحتفالات العائلية.' },
  venue: { en: 'Venue, hall or hotel, capacity, separate celebrations, stage, florals, lighting, sound, catering.', ar: 'القاعة أو الفندق والسعة والاحتفالات المنفصلة والكوشة والزهور والإضاءة والصوت والضيافة.' },
  prep: { en: 'Dress, abaya, kandura, jewellery, perfumes, makeup, hair, photo and video.', ar: 'الفستان والعباية والكندورة والمجوهرات والعطور والمكياج والتسريحة والتصوير.' },
  invites: { en: 'Printed & digital invitations, guest list, RSVPs, favours, henna, hospitality, customs.', ar: 'الدعوات المطبوعة والرقمية وقائمة الضيوف والردود والتوزيعات والحناء والعادات.' },
  finance: { en: 'Estimates, actuals, deposits, balances, deadlines, contributions, savings.', ar: 'التقديرات والمصاريف الفعلية والعربون والأرصدة والمواعيد والمساهمات والادخار.' },
  day: { en: 'Schedule, vendor arrivals, setup, photography, ceremony timing, catering, contacts.', ar: 'الجدول ووصول المزودين والتجهيز والتصوير وتوقيت الحفل والضيافة وجهات الاتصال.' },
};

export default function Wedding() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const params = new URLSearchParams(useSearch());
  const [tab, setTab] = useState<'blueprint' | 'guests' | 'day'>((params.get('tab') as 'guests') || 'blueprint');
  const [cat, setCat] = useState<BlueprintCat | 'all'>((params.get('cat') as BlueprintCat) || 'all');
  const [taskDlg, setTaskDlg] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });
  const [del, setDel] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  const who = (id: string) => (id === 'me' ? t('Me', 'أنا') : state.collaborators.find((c) => c.id === id)?.name ?? t('Unassigned', 'غير مسندة'));
  const toggle = (id: string) => update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));
  const cats = Object.keys(L.blueprint) as BlueprintCat[];
  const visible = state.tasks.filter((x) => (cat === 'all' || x.cat === cat) && (filter === 'all' || (filter === 'done' ? x.done : !x.done))).sort((a, c) => Number(a.done) - Number(c.done) || (a.deadline || '9').localeCompare(c.deadline || '9'));

  return (
    <div>
      <PageHeader eyebrow={t('My Wedding', 'زفافي')} title={t('My Wedding Blueprint', 'مخطط زفافي')} sub={t('Six chapters, fully yours to reshape. Nothing here assumes who pays for what.', 'ستة فصول يمكنك تشكيلها كما تشاء. لا شيء هنا يفترض من يدفع ماذا.')}
        actions={<Btn data-testid="button-add-task" onClick={() => setTaskDlg({ open: true, task: null })}><Plus className="h-4 w-4" />{t('Add task', 'إضافة مهمة')}</Btn>} />

      <div className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1 text-sm w-fit">
        {([['blueprint', t('Blueprint', 'المخطط')], ['guests', t('Guests & RSVP', 'الضيوف والردود')], ['day', t('Wedding day', 'يوم العرس')]] as const).map(([k, l]) => (
          <button key={k} data-testid={`tab-${k}`} onClick={() => setTab(k)} className={cn('rounded-full px-4 py-1.5', tab === k ? 'bg-forest text-ivory' : 'text-forest')}>{l}</button>
        ))}
      </div>

      {tab === 'blueprint' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {cats.map((c, i) => {
              const ts = state.tasks.filter((x) => x.cat === c);
              const pct = ts.length ? (ts.filter((x) => x.done).length / ts.length) * 100 : 0;
              return (
                <button key={c} data-testid={`button-cat-${c}`} onClick={() => setCat(cat === c ? 'all' : c)} className={cn('group relative h-36 overflow-hidden rounded-2xl text-start ring-offset-2 ring-offset-background transition', cat === c && 'ring-2 ring-gold')}>
                  <img src={IMG(CAT_IMG[c])} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/60 to-forest/10" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-ivory">
                    <div className="num text-[10px] text-gold">0{i + 1}</div>
                    <div className="text-sm font-medium leading-tight">{b(L.blueprint[c])}</div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-ivory/20"><div className="h-full bg-gold" style={{ width: `${pct}%` }} /></div>
                  </div>
                </button>
              );
            })}
          </div>

          {cat !== 'all' && <p className="mb-4 text-sm text-muted-foreground">{b(CAT_SCOPE[cat])}</p>}
          {cat === 'engagement' && <MahrPanel />}
          {cat === 'venue' && <GuestCountPanel />}

          <Card className="p-2 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-3">
              <div className="text-sm font-medium text-forest">{cat === 'all' ? t('All tasks', 'كل المهام') : b(L.blueprint[cat])} <span className="text-muted-foreground">· {visible.length}</span></div>
              <div className="flex gap-1.5">{(['all', 'open', 'done'] as const).map((k) => <Chip key={k} testid={`filter-${k}`} active={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? t('All', 'الكل') : k === 'open' ? t('Open', 'مفتوحة') : t('Completed', 'مكتملة')}</Chip>)}</div>
            </div>
            {visible.length === 0 ? (
              <Empty title={t('No tasks here yet', 'لا توجد مهام بعد')} sub={t('Add your first task for this chapter.', 'أضف أول مهمة لهذا الفصل.')} action={<Btn size="sm" onClick={() => setTaskDlg({ open: true, task: null })}><Plus className="h-3.5 w-3.5" />{t('Add task', 'إضافة مهمة')}</Btn>} />
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((x) => {
                  const d = x.deadline ? daysUntil(x.deadline) : null;
                  return (
                    <li key={x.id} data-testid={`row-task-${x.id}`} className="group flex items-start gap-3 px-2 py-3">
                      <button data-testid={`button-toggle-task-${x.id}`} onClick={() => toggle(x.id)} className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition', x.done ? 'border-forest bg-forest text-gold' : 'border-forest/30 hover:border-gold')}>
                        {x.done && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={cn('text-sm font-medium', x.done ? 'text-muted-foreground line-through' : 'text-forest')}>{x.title}</div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{b(L.blueprint[x.cat])}</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{who(x.assignee)}</span>
                          {x.deadline && <span className={cn('inline-flex items-center gap-1', !x.done && d !== null && d < 0 && 'text-clay')}><Clock className="h-3 w-3" />{fmtDate(x.deadline, lang)}{!x.done && d !== null && d < 0 ? ` · ${t('overdue', 'متأخرة')}` : ''}</span>}
                          {x.estimate > 0 && <span className="num text-[#8a6a3a]">{aed(x.estimate, lang)} <SampleTag className="ms-1 py-0" /></span>}
                        </div>
                        {x.notes && <div className="mt-1 text-xs italic text-muted-foreground">{x.notes}</div>}
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <button data-testid={`button-edit-task-${x.id}`} onClick={() => setTaskDlg({ open: true, task: x })} className="rounded-lg p-1.5 text-forest hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                        <button data-testid={`button-delete-task-${x.id}`} onClick={() => setDel(x)} className="rounded-lg p-1.5 text-clay hover:bg-clay/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {tab === 'guests' && <GuestList />}
      {tab === 'day' && <DayPlanner />}

      <TaskDialog open={taskDlg.open} initial={taskDlg.task} defaultCat={cat === 'all' ? undefined : cat} onClose={() => setTaskDlg({ open: false, task: null })} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Delete this task?', 'حذف هذه المهمة؟')} body={del?.title ?? ''}
        onConfirm={() => { const id = del!.id; update((s) => ({ ...s, tasks: s.tasks.filter((x) => x.id !== id), comments: s.comments.filter((c) => c.taskId !== id) })); toast({ title: t('Task deleted', 'تم حذف المهمة') }); }} />
    </div>
  );
}

function MahrPanel() {
  const { state, update } = useApp();
  const { t, lang } = useT();
  const p = state.profile;
  const set = (k: 'mahrAgreed' | 'mahrPaid', v: number) => update((s) => ({ ...s, profile: { ...s.profile, [k]: Math.max(0, v) } }));
  const status = p.mahrAgreed === 0 ? t('Not recorded', 'غير مسجل') : p.mahrPaid >= p.mahrAgreed ? t('Paid in full', 'مدفوع بالكامل') : p.mahrPaid > 0 ? t('Partially paid', 'مدفوع جزئياً') : t('Unpaid', 'غير مدفوع');
  return (
    <Card className="mb-4 grid gap-4 p-5 md:grid-cols-[1fr_1fr_1fr_2fr]">
      <div className="md:col-span-4 flex items-center justify-between"><div className="font-serif text-xl text-forest">{t('Mahr — its own category', 'المهر — فئة مستقلة')}</div><span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-[#8a6a3a]">{status}</span></div>
      <Field label={t('Agreed amount (AED)', 'المبلغ المتفق عليه (درهم)')}><Input data-testid="input-mahr-agreed" type="number" min={0} value={p.mahrAgreed} onChange={(e) => set('mahrAgreed', Number(e.target.value))} /></Field>
      <Field label={t('Paid so far (AED)', 'المدفوع حتى الآن (درهم)')} error={p.mahrPaid > p.mahrAgreed ? t('Paid exceeds agreed amount', 'المدفوع يتجاوز المتفق عليه') : undefined}><Input data-testid="input-mahr-paid" type="number" min={0} value={p.mahrPaid} onChange={(e) => set('mahrPaid', Number(e.target.value))} /></Field>
      <div className="self-end pb-2"><div className="text-xs text-muted-foreground">{t('Remaining', 'المتبقي')}</div><div className="num font-semibold text-forest">{aed(Math.max(0, p.mahrAgreed - p.mahrPaid), lang)}</div></div>
      <Field label={t('Payment arrangement', 'ترتيبات الدفع')}><Textarea data-testid="input-mahr-notes" className="min-h-10" value={p.mahrNotes} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, mahrNotes: e.target.value } }))} /></Field>
    </Card>
  );
}

function GuestCountPanel() {
  const { state, update } = useApp();
  const { t, lang } = useT();
  const cat = state.cats.find((c) => c.id === 'catering')!;
  return (
    <Card className="mb-4 flex flex-wrap items-end gap-5 p-5">
      <Field label={t('Estimated guest count', 'عدد الضيوف التقديري')}><Input data-testid="input-venue-guests" type="number" min={1} max={10000} className="w-36" value={state.profile.guests} onChange={(e) => update((s) => syncCatering({ ...s, profile: { ...s.profile, guests: Math.max(1, Math.min(10000, Number(e.target.value) || 1)) } }))} /></Field>
      <label className="flex items-center gap-2 pb-2 text-sm text-forest"><input data-testid="checkbox-separate" type="checkbox" checked={state.profile.separateCelebrations} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, separateCelebrations: e.target.checked } }))} className="accent-[#173B35]" />{t('Separate men\u2019s and women\u2019s celebrations', 'احتفالات منفصلة للرجال والنساء')}</label>
      <div className="ms-auto text-end"><div className="text-xs text-muted-foreground">{t('Catering estimate updates live', 'يتحدث تقدير الضيافة مباشرة')} <SampleTag /></div><div data-testid="text-catering-estimate" className="num font-serif text-2xl text-forest">{aed(cat.allocated, lang)}</div></div>
    </Card>
  );
}

function GuestList() {
  const { state, update } = useApp();
  const { t, b } = useT();
  const [dlg, setDlg] = useState<Guest | 'new' | null>(null);
  const [q, setQ] = useState('');
  const [f, setF] = useState({ name: '', side: 'family-a' as Guest['side'], party: '1', rsvp: 'pending' as Rsvp, phone: '' });
  const [err, setErr] = useState('');
  const sides = { 'family-a': t('Family of the groom', 'أهل العريس'), 'family-b': t('Family of the bride', 'أهل العروس'), friends: t('Friends & colleagues', 'الأصدقاء والزملاء') };
  const open = (g: Guest | 'new') => { setErr(''); setF(g === 'new' ? { name: '', side: 'family-a', party: '1', rsvp: 'pending', phone: '' } : { ...g, party: String(g.party) }); setDlg(g); };
  const save = () => {
    const party = Number(f.party);
    if (!f.name.trim()) return setErr(t('Name is required.', 'الاسم مطلوب.'));
    if (!(party >= 1 && party <= 50)) return setErr(t('Party size must be 1–50.', 'عدد الأفراد من ١ إلى ٥٠.'));
    const rec: Guest = { id: dlg === 'new' ? uid() : (dlg as Guest).id, name: f.name.trim(), side: f.side, party, rsvp: f.rsvp, phone: f.phone };
    update((s) => ({ ...s, guests: dlg === 'new' ? [...s.guests, rec] : s.guests.map((g) => (g.id === rec.id ? rec : g)) }));
    setDlg(null);
  };
  const setRsvp = (id: string, r: Rsvp) => update((s) => ({ ...s, guests: s.guests.map((g) => (g.id === id ? { ...g, rsvp: r } : g)) }));
  const list = state.guests.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()));
  const sum = (r?: Rsvp) => state.guests.filter((g) => !r || g.rsvp === r).reduce((a, g) => a + g.party, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[[t('Invited (people)', 'المدعوون'), sum()], [t('Attending', 'سيحضرون'), sum('yes')], [t('Awaiting reply', 'بانتظار الرد'), sum('pending')], [t('Declined', 'اعتذروا'), sum('no')]].map(([l, v]) => (
          <Card key={l as string} className="p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="num font-serif text-3xl text-forest">{v}</div></Card>
        ))}
      </div>
      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input data-testid="input-guest-search" placeholder={t('Search guests', 'ابحث في الضيوف')} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <span className="text-xs text-muted-foreground">{t('Planned guest count', 'العدد المخطط')}: {state.profile.guests}</span>
          <Btn className="ms-auto" size="sm" data-testid="button-add-guest" onClick={() => open('new')}><Plus className="h-3.5 w-3.5" />{t('Add guest', 'إضافة ضيف')}</Btn>
        </div>
        {list.length === 0 ? <Empty title={t('No guests yet', 'لا يوجد ضيوف')} /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-start text-xs text-muted-foreground"><th className="py-2 text-start font-medium">{t('Name', 'الاسم')}</th><th className="text-start font-medium">{t('Side', 'الجهة')}</th><th className="text-start font-medium">{t('Party', 'العدد')}</th><th className="text-start font-medium">RSVP</th><th /></tr></thead>
            <tbody className="divide-y divide-border">
              {list.map((g) => (
                <tr key={g.id} data-testid={`row-guest-${g.id}`}>
                  <td className="py-2.5 text-forest">{g.name}</td><td className="text-muted-foreground">{sides[g.side]}</td><td className="num">{g.party}</td>
                  <td><Select data-testid={`select-rsvp-${g.id}`} value={g.rsvp} onChange={(e) => setRsvp(g.id, e.target.value as Rsvp)} className="h-8 w-36 text-xs">{(['pending', 'yes', 'no'] as Rsvp[]).map((r) => <option key={r} value={r}>{b(L.rsvp[r])}</option>)}</Select></td>
                  <td className="text-end whitespace-nowrap"><button data-testid={`button-edit-guest-${g.id}`} onClick={() => open(g)} className="p-1.5 text-forest"><Pencil className="h-4 w-4" /></button><button data-testid={`button-delete-guest-${g.id}`} onClick={() => update((s) => ({ ...s, guests: s.guests.filter((x) => x.id !== g.id) }))} className="p-1.5 text-clay"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
      <Modal open={!!dlg} onClose={() => setDlg(null)} title={dlg === 'new' ? t('Add guest', 'إضافة ضيف') : t('Edit guest', 'تعديل الضيف')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Name / household', 'الاسم / الأسرة')} error={err} className="col-span-2"><Input data-testid="input-guest-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label={t('Side', 'الجهة')}><Select value={f.side} onChange={(e) => setF({ ...f, side: e.target.value as Guest['side'] })}>{Object.entries(sides).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label={t('Party size', 'عدد الأفراد')}><Input data-testid="input-guest-party" type="number" min={1} value={f.party} onChange={(e) => setF({ ...f, party: e.target.value })} /></Field>
          <Field label="RSVP"><Select value={f.rsvp} onChange={(e) => setF({ ...f, rsvp: e.target.value as Rsvp })}>{(['pending', 'yes', 'no'] as Rsvp[]).map((r) => <option key={r} value={r}>{b(L.rsvp[r])}</option>)}</Select></Field>
          <Field label={t('Phone (optional)', 'الهاتف (اختياري)')}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setDlg(null)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-guest" onClick={save}>{t('Save', 'حفظ')}</Btn></div>
      </Modal>
    </div>
  );
}

function DayPlanner() {
  const { state, update } = useApp();
  const { t, lang } = useT();
  const [dlg, setDlg] = useState<ScheduleItem | 'new' | null>(null);
  const [f, setF] = useState<Omit<ScheduleItem, 'id'>>({ time: '18:00', title: '', owner: '', contact: '', kind: 'other' });
  const [err, setErr] = useState('');
  const kinds = { arrival: t('Vendor arrival', 'وصول المزود'), setup: t('Decoration setup', 'تجهيز الديكور'), photo: t('Photography', 'التصوير'), ceremony: t('Ceremony', 'الحفل'), catering: t('Catering', 'الضيافة'), other: t('Other', 'أخرى') };
  const open = (s: ScheduleItem | 'new') => { setErr(''); setF(s === 'new' ? { time: '18:00', title: '', owner: '', contact: '', kind: 'other' } : s); setDlg(s); };
  const save = () => {
    if (!f.title.trim() || !/^\d{2}:\d{2}$/.test(f.time)) return setErr(t('Add a title and valid time.', 'أضف عنواناً ووقتاً صحيحاً.'));
    const rec = { ...f, id: dlg === 'new' ? uid() : (dlg as ScheduleItem).id };
    update((s) => ({ ...s, schedule: dlg === 'new' ? [...s.schedule, rec] : s.schedule.map((x) => (x.id === rec.id ? rec : x)) }));
    setDlg(null);
  };
  const items = [...state.schedule].sort((a, c) => a.time.localeCompare(c.time));
  const dayTasks = state.tasks.filter((x) => x.cat === 'day');
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div><h2 className="font-serif text-2xl text-forest">{t('Wedding-day schedule', 'جدول يوم العرس')}</h2><div className="text-xs text-muted-foreground">{fmtDate(state.profile.weddingDate, lang)}</div></div>
          <Btn size="sm" data-testid="button-add-schedule" onClick={() => open('new')}><Plus className="h-3.5 w-3.5" />{t('Add item', 'إضافة بند')}</Btn>
        </div>
        {items.length === 0 ? <Empty title={t('No schedule yet', 'لا يوجد جدول')} /> : (
          <ol className="relative space-y-4 border-s border-gold/40 ps-6">
            {items.map((s) => (
              <li key={s.id} data-testid={`row-schedule-${s.id}`} className="group relative">
                <span className="absolute -start-[29px] top-1.5 h-2.5 w-2.5 rotate-45 bg-gold" />
                <div className="flex items-start gap-4">
                  <div className="num w-14 shrink-0 font-semibold text-forest">{s.time}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-forest">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{kinds[s.kind]}{s.owner ? ` · ${s.owner}` : ''}{s.contact ? ` · ${s.contact}` : ''}</div>
                  </div>
                  <button data-testid={`button-edit-schedule-${s.id}`} onClick={() => open(s)} className="p-1 text-forest"><Pencil className="h-4 w-4" /></button>
                  <button data-testid={`button-delete-schedule-${s.id}`} onClick={() => update((st) => ({ ...st, schedule: st.schedule.filter((x) => x.id !== s.id) }))} className="p-1 text-clay"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
      <Card className="p-6">
        <h2 className="mb-3 font-serif text-2xl text-forest">{t('Final checklist', 'القائمة النهائية')}</h2>
        <Bar value={dayTasks.length ? (dayTasks.filter((x) => x.done).length / dayTasks.length) * 100 : 0} className="mb-4" tone="gold" />
        <ul className="space-y-2">
          {dayTasks.map((x) => (
            <li key={x.id}><label className="flex items-center gap-2 text-sm text-forest"><input type="checkbox" className="accent-[#173B35]" checked={x.done} onChange={() => update((s) => ({ ...s, tasks: s.tasks.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)) }))} />{x.title}</label></li>
          ))}
          {dayTasks.length === 0 && <li className="text-sm text-muted-foreground">{t('Add tasks under “Wedding Day Planner”.', 'أضف مهام ضمن "مخطط يوم العرس".')}</li>}
        </ul>
      </Card>
      <Modal open={!!dlg} onClose={() => setDlg(null)} title={dlg === 'new' ? t('Add schedule item', 'إضافة بند للجدول') : t('Edit schedule item', 'تعديل البند')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('Time', 'الوقت')}><Input data-testid="input-schedule-time" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
          <Field label={t('Type', 'النوع')}><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as ScheduleItem['kind'] })}>{Object.entries(kinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label={t('What happens', 'ماذا يحدث')} error={err} className="col-span-2"><Input data-testid="input-schedule-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label={t('Responsible / vendor', 'المسؤول / المزود')}><Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} /></Field>
          <Field label={t('Contact', 'جهة الاتصال')}><Input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setDlg(null)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-schedule" onClick={save}>{t('Save', 'حفظ')}</Btn></div>
      </Modal>
    </div>
  );
}
