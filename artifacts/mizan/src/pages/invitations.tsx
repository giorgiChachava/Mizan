import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, ExternalLink, Pencil, Plus, RefreshCw, Save, Share2, Trash2, Undo2, Users } from 'lucide-react';
import {
  getGetMyInvitationQueryKey, getListWeddingGuestsQueryKey, useAddWeddingGuest, useEditWeddingGuest, useGetMyInvitation, useListWeddingGuests, useRemoveWeddingGuest, useSaveInvitation,
  type Invitation, type InvitationEnvelope, type InvitationInput, type WeddingGuest, type WeddingGuestInput,
} from '@workspace/api-client-react';
import { useApp } from '@/lib/store';
import { L, fmtDate, useT } from '@/lib/i18n';
import { uid } from '@/lib/seed';
import { Btn, Card, Chip, Empty, Field, Input, Modal, PageHeader, SampleTag, Select, Textarea } from '@/components/kit';
import { ConfirmDialog } from '@/components/forms';
import { InvitationCard } from '@/components/invitation-card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { LocalGuest } from '@/lib/types';

const FIELDS: (keyof InvitationInput)[] = ['template', 'coupleNames', 'eventName', 'date', 'time', 'venue', 'location', 'message', 'language', 'allowPlusOnes', 'maxParty'];
const pick = (x: InvitationInput): InvitationInput => Object.fromEntries(FIELDS.map((k) => [k, x[k]])) as unknown as InvitationInput;
const same = (a: InvitationInput, b: InvitationInput) => FIELDS.every((k) => a[k] === b[k]);
export const inviteUrl = (token: string) => `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/?$/, '/')}invite/${token}`;
const errMsg = (e: unknown) => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : '');
const POLL_WINDOW = 5 * 60_000;

export default function Invitations() {
  const { t } = useT();
  const [tab, setTab] = useState<'builder' | 'guests'>('builder');
  const invQ = useGetMyInvitation({ query: { queryKey: getGetMyInvitationQueryKey(), refetchOnWindowFocus: true } });
  const saved = invQ.data?.invitation ?? null;

  return (
    <div>
      <PageHeader eyebrow={t('Invitations & Guests', 'الدعوات والضيوف')} title={t('Invite, then watch replies arrive', 'ادعوا، ثم تابعوا الردود')} sub={t('Design a digital invitation, share its private link, and every RSVP lands in your guest list automatically.', 'صمموا دعوة رقمية وشاركوا رابطها الخاص، وتصل كل الردود إلى قائمة ضيوفكم تلقائياً.')} />
      <div className="mb-6 flex w-fit gap-1 rounded-full border border-border bg-card p-1 text-sm">
        {([['builder', t('Invitation', 'الدعوة')], ['guests', t('Guest list', 'قائمة الضيوف')]] as const).map(([k, l]) => (
          <button key={k} data-testid={`tab-${k}`} onClick={() => setTab(k)} className={cn('rounded-full px-5 py-1.5 transition', tab === k ? 'bg-forest text-ivory' : 'text-forest hover:bg-muted')}>{l}</button>
        ))}
      </div>
      {invQ.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-[520px] rounded-2xl" /><Skeleton className="h-[520px] rounded-3xl" /></div>
      ) : invQ.isError ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle className="h-6 w-6 text-clay" />
          <div className="font-serif text-2xl text-forest">{t('We could not load your invitation', 'تعذر تحميل دعوتكم')}</div>
          <p className="text-sm text-muted-foreground">{errMsg(invQ.error) || t('Check your connection and try again.', 'تحققوا من الاتصال وحاولوا مجدداً.')}</p>
          <Btn data-testid="button-retry-invitation" onClick={() => invQ.refetch()}><RefreshCw className="h-4 w-4" />{t('Retry', 'إعادة المحاولة')}</Btn>
        </Card>
      ) : tab === 'builder' ? <Builder saved={saved} /> : <Guests saved={saved} />}
    </div>
  );
}

/* ------------------------------------------------------------------ Builder */
function Builder({ saved }: { saved: Invitation | null }) {
  const { state, update } = useApp();
  const { t, isAr } = useT();
  const qc = useQueryClient();
  const save = useSaveInvitation();
  const addGuest = useAddWeddingGuest();
  const addRef = useRef(addGuest.mutateAsync);
  addRef.current = addGuest.mutateAsync;
  const migrating = useRef(false);
  const [err, setErr] = useState<Partial<Record<keyof InvitationInput, string>>>({});
  const [copyFailed, setCopyFailed] = useState(false);
  const d = state.invitationDraft;
  const set = (patch: Partial<InvitationInput>) => update((s) => ({ ...s, invitationDraft: { ...s.invitationDraft, ...patch } }));

  // Adopt the server invitation into the local draft once per invitation id (e.g. after clearing local data).
  useEffect(() => {
    if (saved && state.invitationSyncedId !== saved.id) {
      update((s) => ({ ...s, invitationDraft: pick(saved), invitationSyncedId: saved.id, guestsMigrated: true }));
    }
  }, [saved, state.invitationSyncedId, update]);

  const dirty = saved ? !same(pick(saved), d) : true;
  const link = saved ? inviteUrl(saved.token) : '';

  const migrateGuests = async (pending: LocalGuest[]) => {
    if (migrating.current || pending.length === 0) return;
    migrating.current = true;
    let moved = 0;
    for (const g of pending) {
      try {
        const body: WeddingGuestInput = { name: g.name.slice(0, 120), status: g.status, attendees: g.status === 'declined' ? 0 : Math.min(100, Math.max(0, g.attendees)), notes: g.notes.slice(0, 1000) };
        await addRef.current({ data: body });
        moved++;
        update((s) => ({ ...s, sampleGuests: s.sampleGuests.filter((x) => x.id !== g.id) }));
      } catch {
        break;
      }
    }
    const allDone = moved === pending.length;
    if (allDone) update((s) => ({ ...s, guestsMigrated: true }));
    qc.invalidateQueries({ queryKey: getListWeddingGuestsQueryKey() });
    migrating.current = false;
    toast(allDone
      ? { title: t(`${moved} guests moved to your live list`, `نقل ${moved} ضيوف إلى قائمتكم المباشرة`) }
      : { title: t('Some guests were not moved', 'لم يتم نقل بعض الضيوف'), description: t('Use “Move remaining guests” on the Guest list tab to retry.', 'استخدموا "نقل الضيوف المتبقين" في تبويب قائمة الضيوف لإعادة المحاولة.') });
  };

  const validate = () => {
    const e: Partial<Record<keyof InvitationInput, string>> = {};
    const req = t('Required', 'مطلوب');
    if (!d.coupleNames.trim()) e.coupleNames = req; else if (d.coupleNames.length > 160) e.coupleNames = t('Max 160 characters', 'الحد ١٦٠ حرفاً');
    if (!d.eventName.trim()) e.eventName = req; else if (d.eventName.length > 120) e.eventName = t('Max 120 characters', 'الحد ١٢٠ حرفاً');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || isNaN(new Date(d.date + 'T00:00:00').getTime())) e.date = t('Choose a date', 'اختاروا تاريخاً');
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(d.time)) e.time = t('Choose a time', 'اختاروا وقتاً');
    if (!d.venue.trim()) e.venue = req; else if (d.venue.length > 160) e.venue = t('Max 160 characters', 'الحد ١٦٠ حرفاً');
    if (!d.location.trim()) e.location = req; else if (d.location.length > 240) e.location = t('Max 240 characters', 'الحد ٢٤٠ حرفاً');
    if (d.message.length > 2000) e.message = t('Max 2,000 characters', 'الحد ٢٠٠٠ حرف');
    if (!Number.isInteger(d.maxParty) || d.maxParty < 1 || d.maxParty > 20) e.maxParty = t('Between 1 and 20', 'بين ١ و٢٠');
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const onSave = () => {
    if (!validate()) { toast({ title: t('Please fix the highlighted fields', 'يرجى تصحيح الحقول المحددة') }); return; }
    const body: InvitationInput = { ...pick(d), coupleNames: d.coupleNames.trim(), eventName: d.eventName.trim(), venue: d.venue.trim(), location: d.location.trim(), message: d.message.trim(), maxParty: d.allowPlusOnes ? d.maxParty : 1 };
    const pendingGuests = !state.guestsMigrated ? state.sampleGuests : [];
    save.mutate({ data: body }, {
      onSuccess: (inv) => {
        qc.setQueryData<InvitationEnvelope>(getGetMyInvitationQueryKey(), { invitation: inv });
        update((s) => ({ ...s, invitationDraft: pick(inv), invitationSyncedId: inv.id }));
        setCopyFailed(false);
        toast({ title: saved ? t('Invitation updated', 'تم تحديث الدعوة') : t('Invitation saved. Your link is ready.', 'تم حفظ الدعوة. الرابط جاهز.') });
        if (pendingGuests.length) void migrateGuests(pendingGuests);
      },
      onError: (e) => toast({ title: t('Could not save the invitation', 'تعذر حفظ الدعوة'), description: errMsg(e) || t('Please try again.', 'يرجى المحاولة مجدداً.') }),
    });
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('no clipboard');
      await navigator.clipboard.writeText(link);
      setCopyFailed(false);
      toast({ title: t('Link copied', 'تم نسخ الرابط') });
    } catch {
      setCopyFailed(true);
      toast({ title: t('Copy failed', 'فشل النسخ'), description: t('Your browser blocked clipboard access. Select the link below and copy it manually.', 'منع المتصفح الوصول للحافظة. حددوا الرابط أدناه وانسخوه يدوياً.') });
    }
  };
  const share = async () => {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: d.eventName, text: d.coupleNames, url: link }); } catch { /* user dismissed the share sheet */ }
    } else void copy();
  };

  const TEMPLATES = [
    { id: 'heritage' as const, en: 'Heritage', ar: 'تراثي', sw: 'bg-forest', ring: 'border-gold' },
    { id: 'garden' as const, en: 'Garden', ar: 'حديقة', sw: 'bg-[#EAE3D6]', ring: 'border-[#5d8a7f]' },
    { id: 'modern' as const, en: 'Modern', ar: 'عصري', sw: 'bg-white', ring: 'border-charcoal/30' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
      <div className="space-y-4">
        {/* Status / share */}
        <Card className={cn('p-5', saved ? 'border-gold/40' : '')}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', saved ? (dirty ? 'bg-gold/15 text-[#8a6a3a]' : 'bg-forest/10 text-forest') : 'bg-muted text-muted-foreground')} data-testid="status-invitation">
              <span className={cn('h-1.5 w-1.5 rounded-full', saved ? (dirty ? 'bg-gold' : 'bg-forest') : 'bg-muted-foreground')} />
              {!saved ? t('Draft — not saved yet', 'مسودة — لم تحفظ بعد') : dirty ? t('Unsaved changes — guests still see the last saved version', 'تغييرات غير محفوظة — يرى الضيوف آخر نسخة محفوظة') : t('Saved and live', 'محفوظة ومنشورة')}
            </span>
            {!saved && <SampleTag label={t('Sample draft', 'مسودة تجريبية')} />}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn data-testid="button-save-invitation" onClick={onSave} disabled={save.isPending || (!!saved && !dirty)}><Save className="h-4 w-4" />{save.isPending ? t('Saving…', 'جار الحفظ…') : saved ? t('Save changes', 'حفظ التغييرات') : t('Save invitation', 'حفظ الدعوة')}</Btn>
            {saved && dirty && <Btn variant="ghost" data-testid="button-discard-invitation" onClick={() => { set(pick(saved)); setErr({}); }}><Undo2 className="h-4 w-4" />{t('Discard changes', 'تجاهل التغييرات')}</Btn>}
            <Btn variant="outline" data-testid="button-copy-link" disabled={!saved} onClick={copy} title={!saved ? t('Save first to get a link', 'احفظوا أولاً للحصول على رابط') : undefined}><Copy className="h-4 w-4" />{t('Copy link', 'نسخ الرابط')}</Btn>
            <Btn variant="outline" data-testid="button-share-link" disabled={!saved} onClick={share}><Share2 className="h-4 w-4" />{t('Share', 'مشاركة')}</Btn>
            {saved && <a data-testid="link-open-guest-page" href={link} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm text-forest hover:bg-forest/5"><ExternalLink className="h-4 w-4" />{t('Open guest page', 'فتح صفحة الضيف')}</a>}
          </div>
          {!saved && <p className="mt-3 text-xs text-muted-foreground">{t('Copy and share become available once the invitation is saved.', 'يتاح النسخ والمشاركة بعد حفظ الدعوة.')}</p>}
          {saved && (
            <div className="mt-3">
              <input data-testid="input-invite-link" readOnly value={link} dir="ltr" onFocus={(e) => e.currentTarget.select()} className={cn('w-full rounded-xl border bg-ivory/60 px-3 py-2 font-mono text-[11px] text-forest outline-none', copyFailed ? 'border-clay' : 'border-input')} />
              {copyFailed && <p className="mt-1 text-xs text-clay">{t('Automatic copy is unavailable here. Select the link above and copy it.', 'النسخ التلقائي غير متاح هنا. حددوا الرابط أعلاه وانسخوه.')}</p>}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{t('Template', 'القالب')}</div>
          <div className="grid grid-cols-3 gap-2">
            {TEMPLATES.map((x) => (
              <button key={x.id} data-testid={`button-template-${x.id}`} onClick={() => set({ template: x.id })} aria-pressed={d.template === x.id} className={cn('rounded-2xl border p-2 text-center text-xs transition', d.template === x.id ? 'border-gold bg-gold/10 text-forest' : 'border-border text-muted-foreground hover:border-gold/60')}>
                <span className={cn('mx-auto mb-1.5 block h-12 w-9 rounded-t-full border', x.sw, x.ring)} />{isAr ? x.ar : x.en}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label={t('Couple\u2019s names', 'اسما العروسين')} error={err.coupleNames} className="col-span-2"><Input data-testid="input-invite-couple" value={d.coupleNames} maxLength={160} onChange={(e) => set({ coupleNames: e.target.value })} /></Field>
            <Field label={t('Event name', 'اسم المناسبة')} error={err.eventName} className="col-span-2"><Input data-testid="input-invite-event" value={d.eventName} maxLength={120} onChange={(e) => set({ eventName: e.target.value })} /></Field>
            <Field label={t('Date', 'التاريخ')} error={err.date}><Input data-testid="input-invite-date" type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            <Field label={t('Time', 'الوقت')} error={err.time}><Input data-testid="input-invite-time" type="time" value={d.time} onChange={(e) => set({ time: e.target.value })} /></Field>
            <Field label={t('Venue', 'المكان')} error={err.venue} className="col-span-2 sm:col-span-1"><Input data-testid="input-invite-venue" value={d.venue} maxLength={160} onChange={(e) => set({ venue: e.target.value })} /></Field>
            <Field label={t('Location', 'الموقع')} error={err.location} className="col-span-2 sm:col-span-1"><Input data-testid="input-invite-location" value={d.location} maxLength={240} onChange={(e) => set({ location: e.target.value })} /></Field>
            <Field label={t('Personal message', 'رسالة شخصية')} error={err.message} hint={`${d.message.length}/2000`} className="col-span-2"><Textarea data-testid="input-invite-message" value={d.message} maxLength={2000} dir={d.language === 'ar' ? 'rtl' : 'ltr'} onChange={(e) => set({ message: e.target.value })} /></Field>
            <Field label={t('Invitation wording', 'لغة الدعوة')}>
              <div className="flex gap-1.5">
                <Chip testid="button-invite-lang-en" active={d.language === 'en'} onClick={() => set({ language: 'en' })}>English</Chip>
                <Chip testid="button-invite-lang-ar" active={d.language === 'ar'} onClick={() => set({ language: 'ar' })}>العربية</Chip>
              </div>
            </Field>
            <Field label={t('Max people per reply', 'الحد الأقصى للأفراد لكل رد')} error={err.maxParty}>
              <Input data-testid="input-invite-maxparty" type="number" min={1} max={20} disabled={!d.allowPlusOnes} value={d.allowPlusOnes ? d.maxParty : 1} onChange={(e) => set({ maxParty: Math.round(Number(e.target.value) || 0) })} />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-forest"><input data-testid="checkbox-invite-plusones" type="checkbox" className="accent-[#173B35]" checked={d.allowPlusOnes} onChange={(e) => set({ allowPlusOnes: e.target.checked, maxParty: e.target.checked ? Math.max(2, d.maxParty) : 1 })} />{t('Guests may bring additional family members', 'يمكن للضيوف اصطحاب أفراد من العائلة')}</label>
          </div>
        </Card>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span className="uppercase tracking-[0.18em]">{t('Live preview', 'معاينة مباشرة')}</span>{dirty && saved && <span className="text-[#8a6a3a]">{t('Preview shows unsaved edits', 'المعاينة تعرض تعديلات غير محفوظة')}</span>}</div>
        <div className="rounded-[32px] bg-beige/60 p-4 md:p-8">
          <InvitationCard inv={d} className="mx-auto max-w-md" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Guests */
type GuestRow = { id: string; name: string; status: 'pending' | 'attending' | 'declined'; attendees: number; notes: string; source: 'manual' | 'rsvp' | 'sample' };

function Guests({ saved }: { saved: Invitation | null }) {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const qc = useQueryClient();
  const [pollUntil, setPollUntil] = useState(() => Date.now() + POLL_WINDOW);
  useEffect(() => {
    const on = () => setPollUntil(Date.now() + POLL_WINDOW);
    window.addEventListener('focus', on);
    return () => window.removeEventListener('focus', on);
  }, []);
  const listQ = useListWeddingGuests({ query: { queryKey: getListWeddingGuestsQueryKey(), enabled: !!saved, refetchOnMount: 'always', refetchOnWindowFocus: true, refetchInterval: () => (Date.now() < pollUntil ? 10_000 : false) } });
  const addM = useAddWeddingGuest();
  const editM = useEditWeddingGuest();
  const removeM = useRemoveWeddingGuest();
  const addRef = useRef(addM.mutateAsync);
  addRef.current = addM.mutateAsync;
  const [dlg, setDlg] = useState<GuestRow | 'new' | null>(null);
  const [del, setDel] = useState<GuestRow | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | GuestRow['status']>('all');
  const [moving, setMoving] = useState(false);

  const live = !!saved;
  const rows: GuestRow[] = live
    ? (listQ.data ?? []).map((g: WeddingGuest) => ({ id: g.id, name: g.name, status: g.status, attendees: g.attendees, notes: g.notes, source: g.source }))
    : state.sampleGuests.map((g) => ({ ...g, source: 'sample' as const }));
  const visible = rows.filter((g) => (status === 'all' || g.status === status) && g.name.toLowerCase().includes(q.trim().toLowerCase()));
  const attendingPeople = rows.filter((g) => g.status === 'attending').reduce((a, g) => a + g.attendees, 0);
  const count = (s: GuestRow['status']) => rows.filter((g) => g.status === s).length;
  const invalidate = () => qc.invalidateQueries({ queryKey: getListWeddingGuestsQueryKey() });
  const leftover = live && !state.guestsMigrated ? state.sampleGuests : [];

  const moveRemaining = async () => {
    setMoving(true);
    let ok = true;
    for (const g of leftover) {
      try {
        await addRef.current({ data: { name: g.name.slice(0, 120), status: g.status, attendees: g.status === 'declined' ? 0 : g.attendees, notes: g.notes } });
        update((s) => ({ ...s, sampleGuests: s.sampleGuests.filter((x) => x.id !== g.id) }));
      } catch { ok = false; break; }
    }
    if (ok) update((s) => ({ ...s, guestsMigrated: true }));
    invalidate();
    setMoving(false);
    toast({ title: ok ? t('Guests moved', 'تم نقل الضيوف') : t('Could not move all guests. Try again.', 'تعذر نقل جميع الضيوف. حاولوا مجدداً.') });
  };

  const saveGuest = (body: WeddingGuestInput, done: () => void, fail: (m: string) => void) => {
    if (!live) {
      const rec: LocalGuest = { id: dlg && dlg !== 'new' ? dlg.id : uid(), ...body };
      update((s) => ({ ...s, sampleGuests: dlg === 'new' ? [...s.sampleGuests, rec] : s.sampleGuests.map((g) => (g.id === rec.id ? rec : g)) }));
      done();
      return;
    }
    const opts = { onSuccess: () => { invalidate(); done(); }, onError: (e: unknown) => fail(errMsg(e) || t('Could not save the guest.', 'تعذر حفظ الضيف.')) };
    if (dlg === 'new') addM.mutate({ data: body }, opts);
    else if (dlg) editM.mutate({ id: dlg.id, data: body }, opts);
  };
  const removeGuest = (g: GuestRow) => {
    if (!live) { update((s) => ({ ...s, sampleGuests: s.sampleGuests.filter((x) => x.id !== g.id) })); return; }
    removeM.mutate({ id: g.id }, { onSuccess: () => { invalidate(); toast({ title: t('Guest removed', 'تمت إزالة الضيف') }); }, onError: (e) => toast({ title: t('Could not remove guest', 'تعذر إزالة الضيف'), description: errMsg(e) }) });
  };

  return (
    <div className="space-y-4">
      {!live && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-[#6d5530]">
          <Users className="h-4 w-4" />
          <span className="flex-1">{t('This is a local sample guest list. When you save your invitation, these guests move once to your live list, where RSVPs arrive.', 'هذه قائمة ضيوف تجريبية محلية. عند حفظ الدعوة تنتقل هؤلاء مرة واحدة إلى قائمتكم المباشرة حيث تصل الردود.')}</span>
        </div>
      )}
      {leftover.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
          <span className="flex-1 text-forest">{t(`${leftover.length} local guests have not moved to your live list yet.`, `${leftover.length} ضيوف محليين لم ينتقلوا بعد إلى القائمة المباشرة.`)}</span>
          <Btn size="sm" data-testid="button-move-guests" disabled={moving} onClick={moveRemaining}>{moving ? t('Moving…', 'جار النقل…') : t('Move remaining guests', 'نقل الضيوف المتبقين')}</Btn>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [t('Attending (people)', 'الحضور (أفراد)'), attendingPeople, 'attending-people'],
          [t('Confirmed replies', 'ردود مؤكدة'), count('attending'), 'attending'],
          [t('Awaiting reply', 'بانتظار الرد'), count('pending'), 'pending'],
          [t('Declined', 'اعتذروا'), count('declined'), 'declined'],
        ].map(([l, v, id]) => (
          <Card key={id as string} className="p-4"><div className="text-xs text-muted-foreground">{l}</div><div data-testid={`text-guests-${id}`} className="num font-serif text-4xl text-forest">{v}</div></Card>
        ))}
      </div>

      <Card className="p-2 md:p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 px-2 pt-2">
          <Input data-testid="input-guest-search" type="search" placeholder={t('Search guests', 'ابحثوا في الضيوف')} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select data-testid="select-guest-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="h-10 w-auto">
            <option value="all">{t('All statuses', 'كل الحالات')}</option>{(['attending', 'pending', 'declined'] as const).map((s) => <option key={s} value={s}>{b(L.guestStatus[s])}</option>)}
          </Select>
          {live && <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{listQ.isFetching ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-gold" />}{Date.now() < pollUntil ? t('Live updates on', 'التحديث المباشر يعمل') : t('Live updates paused', 'التحديث المباشر متوقف')}</span>}
          {live && <button data-testid="button-refresh-guests" onClick={() => { setPollUntil(Date.now() + POLL_WINDOW); listQ.refetch(); }} className="text-xs text-forest underline-offset-4 hover:underline">{t('Refresh', 'تحديث')}</button>}
          <Btn className="ms-auto" size="sm" data-testid="button-add-guest" onClick={() => setDlg('new')}><Plus className="h-3.5 w-3.5" />{t('Add guest', 'إضافة ضيف')}</Btn>
        </div>
        {live && listQ.isLoading ? (
          <div className="space-y-2 p-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : live && listQ.isError ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center"><AlertTriangle className="h-5 w-5 text-clay" /><p className="text-sm text-forest">{t('Could not load guests.', 'تعذر تحميل الضيوف.')}</p><Btn size="sm" onClick={() => listQ.refetch()}>{t('Retry', 'إعادة المحاولة')}</Btn></div>
        ) : visible.length === 0 ? (
          <Empty title={rows.length ? t('No guests match', 'لا يوجد ضيوف مطابقون') : t('No guests yet', 'لا يوجد ضيوف بعد')} sub={rows.length ? undefined : t('Share your invitation link or add guests manually.', 'شاركوا رابط الدعوة أو أضيفوا الضيوف يدوياً.')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="text-xs text-muted-foreground">{[t('Guest', 'الضيف'), t('RSVP', 'الرد'), t('People', 'الأفراد'), t('Event', 'المناسبة'), t('Source', 'المصدر'), ''].map((h, i) => <th key={i} className="px-2 py-2 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {visible.map((g) => (
                  <tr key={g.id} data-testid={`row-guest-${g.id}`}>
                    <td className="px-2 py-3"><div className="text-forest">{g.name}</div>{g.notes && <div className="text-xs text-muted-foreground">{g.notes}</div>}</td>
                    <td className="px-2"><span className={cn('rounded-full px-2.5 py-1 text-xs', g.status === 'attending' ? 'bg-forest/10 text-forest' : g.status === 'declined' ? 'bg-clay/10 text-clay' : 'bg-gold/15 text-[#8a6a3a]')}>{b(L.guestStatus[g.status])}</span></td>
                    <td className="num px-2 text-forest">{g.attendees}</td>
                    <td className="px-2 text-xs text-muted-foreground">{saved ? `${saved.eventName} · ${fmtDate(saved.date, lang)}` : state.invitationDraft.eventName}</td>
                    <td className="px-2 text-xs">{g.source === 'rsvp' ? <span className="text-gold">{t('Guest RSVP', 'رد الضيف')}</span> : g.source === 'sample' ? <SampleTag /> : <span className="text-muted-foreground">{t('Added by you', 'أضفتموه')}</span>}</td>
                    <td className="whitespace-nowrap px-2 text-end">
                      <button data-testid={`button-edit-guest-${g.id}`} onClick={() => setDlg(g)} className="rounded-lg p-1.5 text-forest hover:bg-muted" aria-label={t('Edit', 'تعديل')}><Pencil className="h-4 w-4" /></button>
                      <button data-testid={`button-delete-guest-${g.id}`} onClick={() => setDel(g)} className="rounded-lg p-1.5 text-clay hover:bg-clay/10" aria-label={t('Delete', 'حذف')}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GuestDialog row={dlg} onClose={() => setDlg(null)} onSave={saveGuest} pending={addM.isPending || editM.isPending} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={t('Remove this guest?', 'إزالة هذا الضيف؟')} body={del?.name ?? ''} confirmLabel={t('Remove', 'إزالة')} onConfirm={() => del && removeGuest(del)} />
    </div>
  );
}

function GuestDialog({ row, onClose, onSave, pending }: { row: GuestRow | 'new' | null; onClose: () => void; onSave: (b: WeddingGuestInput, done: () => void, fail: (m: string) => void) => void; pending: boolean }) {
  const { t, b } = useT();
  const [f, setF] = useState({ name: '', status: 'pending' as GuestRow['status'], attendees: '1', notes: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!row) return;
    setErr({});
    setF(row === 'new' ? { name: '', status: 'pending', attendees: '1', notes: '' } : { name: row.name, status: row.status, attendees: String(row.attendees), notes: row.notes });
  }, [row]);
  const submit = () => {
    const e: Record<string, string> = {};
    const n = Number(f.attendees);
    if (!f.name.trim()) e.name = t('Name is required.', 'الاسم مطلوب.'); else if (f.name.trim().length > 120) e.name = t('Max 120 characters.', 'الحد ١٢٠ حرفاً.');
    if (f.status !== 'declined' && !(Number.isInteger(n) && n >= 1 && n <= 100)) e.attendees = t('Between 1 and 100.', 'بين ١ و١٠٠.');
    if (f.notes.length > 1000) e.notes = t('Max 1,000 characters.', 'الحد ١٠٠٠ حرف.');
    setErr(e);
    if (Object.keys(e).length) return;
    onSave({ name: f.name.trim(), status: f.status, attendees: f.status === 'declined' ? 0 : n, notes: f.notes.trim() }, () => { toast({ title: t('Guest saved', 'تم حفظ الضيف') }); onClose(); }, (m) => setErr({ form: m }));
  };
  return (
    <Modal open={!!row} onClose={onClose} title={row === 'new' ? t('Add guest', 'إضافة ضيف') : t('Edit guest', 'تعديل الضيف')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('Name or household', 'الاسم أو الأسرة')} error={err.name} className="col-span-2"><Input data-testid="input-guest-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('RSVP status', 'حالة الرد')}><Select data-testid="select-guest-rsvp" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as GuestRow['status'] })}>{(['pending', 'attending', 'declined'] as const).map((s) => <option key={s} value={s}>{b(L.guestStatus[s])}</option>)}</Select></Field>
        <Field label={t('Number of people', 'عدد الأفراد')} error={err.attendees}><Input data-testid="input-guest-attendees" type="number" min={0} max={100} disabled={f.status === 'declined'} value={f.status === 'declined' ? '0' : f.attendees} onChange={(e) => setF({ ...f, attendees: e.target.value })} /></Field>
        <Field label={t('Notes', 'ملاحظات')} error={err.notes} className="col-span-2"><Textarea data-testid="input-guest-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      {err.form && <p className="text-sm text-clay">{err.form}</p>}
      <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={onClose}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-save-guest" disabled={pending} onClick={submit}>{pending ? t('Saving…', 'جار الحفظ…') : t('Save guest', 'حفظ الضيف')}</Btn></div>
    </Modal>
  );
}
