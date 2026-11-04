import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { CalendarDays, Check, MapPin, RefreshCw } from 'lucide-react';
import { getGetPublicInvitationQueryKey, useGetPublicInvitation, useSubmitRsvp, type RsvpReceipt } from '@workspace/api-client-react';
import { InvitationCard, formatInviteDate, formatInviteTime } from '@/components/invitation-card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Stored = RsvpReceipt & { name: string };
const storeKey = (token: string) => `mizan-rsvp-${token}`;
const readStored = (token: string): Stored | null => { try { const r = localStorage.getItem(storeKey(token)); return r ? (JSON.parse(r) as Stored) : null; } catch { return null; } };

/** Public guest-facing page. Rendered outside the planner shell: no private data, no quiz. */
export default function InvitePage() {
  const { token = '' } = useParams<{ token: string }>();
  const q = useGetPublicInvitation(token, { query: { queryKey: getGetPublicInvitationQueryKey(token), enabled: !!token, retry: (n, e) => (e as { status?: number })?.status !== 404 && n < 2 } });
  const inv = q.data;
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  useEffect(() => { if (inv) setLang(inv.language); }, [inv]);
  useEffect(() => {
    const prev = { dir: document.documentElement.dir, lang: document.documentElement.lang, title: document.title };
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (inv) document.title = `${inv.coupleNames} — ${inv.eventName}`;
    return () => { document.documentElement.dir = prev.dir; document.documentElement.lang = prev.lang; document.title = prev.title; };
  }, [lang, inv]);
  const t = (en: string, ar: string) => (lang === 'ar' ? ar : en);
  const notFound = q.isError && (q.error as { status?: number })?.status === 404;

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-[100dvh] bg-[#F3EFE6]" style={lang === 'ar' ? { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } : undefined}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-serif text-xl text-forest">Mizan <span className="text-gold">|</span> <span style={{ fontFamily: 'IBM Plex Sans Arabic' }}>ميزان</span></span>
        <div className="flex rounded-full border border-beige bg-ivory p-0.5 text-xs">
          <button data-testid="button-invite-en" onClick={() => setLang('en')} className={cn('rounded-full px-3 py-1', lang === 'en' ? 'bg-forest text-ivory' : 'text-forest')}>EN</button>
          <button data-testid="button-invite-ar" onClick={() => setLang('ar')} className={cn('rounded-full px-3 py-1', lang === 'ar' ? 'bg-forest text-ivory' : 'text-forest')} style={{ fontFamily: 'IBM Plex Sans Arabic' }}>عربي</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        {q.isLoading ? (
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]"><Skeleton className="h-[560px] rounded-[28px]" /><Skeleton className="h-80 rounded-3xl" /></div>
        ) : notFound || (!token) ? (
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-beige bg-ivory p-10 text-center">
            <div className="mx-auto mb-5 h-10 w-10 rotate-45 border border-gold" />
            <h1 className="font-serif text-3xl text-forest">{t('This invitation could not be found', 'لم يتم العثور على هذه الدعوة')}</h1>
            <p className="mt-2 text-sm text-charcoal/70">{t('The link may be incomplete or the invitation may have been replaced. Please ask the couple for the latest link.', 'قد يكون الرابط ناقصاً أو تم استبدال الدعوة. يرجى طلب أحدث رابط من العروسين.')}</p>
          </div>
        ) : q.isError || !inv ? (
          <div className="mx-auto mt-16 max-w-md rounded-3xl border border-beige bg-ivory p-10 text-center">
            <h1 className="font-serif text-3xl text-forest">{t('Something went wrong', 'حدث خطأ ما')}</h1>
            <p className="mt-2 text-sm text-charcoal/70">{t('We could not load the invitation right now.', 'تعذر تحميل الدعوة الآن.')}</p>
            <button data-testid="button-invite-retry" onClick={() => q.refetch()} className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-forest px-5 text-sm text-ivory"><RefreshCw className="h-4 w-4" />{t('Try again', 'حاول مجدداً')}</button>
          </div>
        ) : (
          <div className="grid items-start gap-8 md:grid-cols-[1.1fr_1fr]">
            <div className="rise"><InvitationCard inv={inv} /></div>
            <div className="rise rise-2 space-y-4 md:sticky md:top-6">
              <div className="rounded-3xl border border-beige bg-ivory p-6">
                <div className="flex items-start gap-3 text-sm text-forest"><CalendarDays className="mt-0.5 h-4 w-4 text-gold" /><div>{formatInviteDate(inv.date, lang)}<div className="text-charcoal/60">{formatInviteTime(inv.time, lang)}</div></div></div>
                <div className="mt-3 flex items-start gap-3 text-sm text-forest"><MapPin className="mt-0.5 h-4 w-4 text-gold" /><div>{inv.venue}<div className="text-charcoal/60">{inv.location}</div></div></div>
              </div>
              <RsvpForm token={token} allowPlusOnes={inv.allowPlusOnes} maxParty={inv.maxParty} t={t} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function RsvpForm({ token, allowPlusOnes, maxParty, t }: { token: string; allowPlusOnes: boolean; maxParty: number; t: (en: string, ar: string) => string }) {
  const [stored, setStored] = useState<Stored | null>(() => readStored(token));
  const [editing, setEditing] = useState(!stored);
  const [name, setName] = useState(stored?.name ?? '');
  const [status, setStatus] = useState<'attending' | 'declined' | ''>(stored?.status ?? '');
  const max = allowPlusOnes ? Math.max(1, maxParty) : 1;
  const [count, setCount] = useState(String(stored && stored.attendees > 0 ? Math.min(stored.attendees, max) : 1));
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = useSubmitRsvp();

  const send = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('Please enter your name.', 'يرجى إدخال الاسم.'); else if (name.trim().length > 120) e.name = t('Max 120 characters.', 'الحد ١٢٠ حرفاً.');
    if (!status) e.status = t('Please choose a reply.', 'يرجى اختيار الرد.');
    const n = Number(count);
    if (status === 'attending' && !(Number.isInteger(n) && n >= 1 && n <= max)) e.count = t(`Between 1 and ${max}.`, `بين ١ و${max}.`);
    setErr(e);
    if (Object.keys(e).length || !status) return;
    submit.mutate({ token, data: { name: name.trim(), status, attendees: status === 'declined' ? 0 : n, ...(stored?.responseKey ? { responseKey: stored.responseKey } : {}) } }, {
      onSuccess: (r) => {
        const rec: Stored = { ...r, name: name.trim() };
        try { localStorage.setItem(storeKey(token), JSON.stringify(rec)); } catch { /* storage unavailable: reply is still recorded */ }
        setStored(rec); setEditing(false);
      },
      onError: (er) => setErr({ form: (er as { message?: string })?.message || t('Could not send your reply. Please try again.', 'تعذر إرسال ردكم. حاولوا مجدداً.') }),
    });
  };

  if (stored && !editing) {
    return (
      <div data-testid="card-rsvp-thanks" className="rounded-3xl bg-forest p-6 text-ivory">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gold text-forest"><Check className="h-5 w-5" /></div>
        <h2 className="mt-4 font-serif text-3xl">{stored.status === 'attending' ? t('Thank you, we look forward to seeing you', 'شكراً لكم، نتطلع لرؤيتكم') : t('Thank you for letting us know', 'شكراً لإبلاغنا')}</h2>
        <p className="mt-2 text-sm text-ivory/75">{stored.status === 'attending' ? t(`Reply recorded for ${stored.name}: ${stored.attendees} attending.`, `تم تسجيل رد ${stored.name}: ${stored.attendees} سيحضرون.`) : t(`Reply recorded for ${stored.name}: unable to attend.`, `تم تسجيل رد ${stored.name}: يعتذر عن الحضور.`)}</p>
        <button data-testid="button-rsvp-change" onClick={() => setEditing(true)} className="mt-5 text-sm text-gold underline-offset-4 hover:underline">{t('Change my reply', 'تغيير ردي')}</button>
      </div>
    );
  }

  const inputCls = 'w-full rounded-xl border border-beige bg-white px-3 h-11 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25';
  return (
    <div className="rounded-3xl border border-beige bg-ivory p-6">
      <h2 className="font-serif text-3xl text-forest">{stored ? t('Update your reply', 'حدّثوا ردكم') : t('Kindly reply', 'نرجو الرد')}</h2>
      <div className="mt-5 space-y-4">
        <label className="block space-y-1.5"><span className="text-xs font-medium text-charcoal/70">{t('Your name', 'الاسم')}</span><input data-testid="input-rsvp-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />{err.name && <span className="block text-xs text-clay">{err.name}</span>}</label>
        <div>
          <span className="text-xs font-medium text-charcoal/70">{t('Will you attend?', 'هل ستحضرون؟')}</span>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {([['attending', t('Joyfully attending', 'سأحضر بكل سرور')], ['declined', t('Regretfully decline', 'أعتذر عن الحضور')]] as const).map(([k, l]) => (
              <button key={k} type="button" data-testid={`button-rsvp-${k}`} onClick={() => setStatus(k)} aria-pressed={status === k} className={cn('rounded-2xl border px-3 py-3 text-sm transition', status === k ? 'border-forest bg-forest text-ivory' : 'border-beige bg-white text-forest hover:border-gold')}>{l}</button>
            ))}
          </div>
          {err.status && <span className="mt-1 block text-xs text-clay">{err.status}</span>}
        </div>
        {status === 'attending' && (
          allowPlusOnes ? (
            <label className="block space-y-1.5"><span className="text-xs font-medium text-charcoal/70">{t(`Number of guests, including you (max ${max})`, `عدد الحضور بما فيكم (الحد ${max})`)}</span>
              <input data-testid="input-rsvp-count" type="number" min={1} max={max} className={inputCls} value={count} onChange={(e) => setCount(e.target.value)} />{err.count && <span className="block text-xs text-clay">{err.count}</span>}</label>
          ) : <p className="text-xs text-charcoal/60">{t('This invitation is for you personally.', 'هذه الدعوة لكم شخصياً.')}</p>
        )}
        {err.form && <p data-testid="text-rsvp-error" className="text-sm text-clay">{err.form}</p>}
        <div className="flex gap-2">
          {stored && <button onClick={() => setEditing(false)} className="h-11 rounded-full px-5 text-sm text-forest">{t('Cancel', 'إلغاء')}</button>}
          <button data-testid="button-rsvp-submit" disabled={submit.isPending} onClick={send} className="h-11 flex-1 rounded-full bg-forest text-sm font-medium text-ivory transition hover:bg-forest-2 disabled:opacity-50">{submit.isPending ? t('Sending…', 'جار الإرسال…') : stored ? t('Update reply', 'تحديث الرد') : t('Send reply', 'إرسال الرد')}</button>
        </div>
      </div>
    </div>
  );
}
