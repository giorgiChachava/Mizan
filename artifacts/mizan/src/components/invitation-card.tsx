import type { InvitationInput } from '@workspace/api-client-react';
import { IMG } from '@/lib/seed';
import { cn } from '@/lib/utils';

const W = {
  en: { together: 'Together with their families', request: 'request the honour of your presence at', at: 'at', rsvp: 'Kindly reply below' },
  ar: { together: 'بكل الحب والتقدير، وبمباركة العائلتين', request: 'يتشرفون بدعوتكم لحضور', at: 'الساعة', rsvp: 'نرجو تأكيد الحضور أدناه' },
};

export function formatInviteDate(date: string, lang: 'en' | 'ar') {
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d.getTime())) return date || '—';
  return d.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
export function formatInviteTime(time: string, lang: 'en' | 'ar') {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const d = new Date(); d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString(lang === 'ar' ? 'ar-AE' : 'en-GB', { hour: 'numeric', minute: '2-digit' });
}

function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 16" className={cn('h-4 w-28', className)} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d="M0 8h46M74 8h46" /><path d="M60 1l7 7-7 7-7-7z" /><circle cx="60" cy="8" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function InvitationCard({ inv, className }: { inv: InvitationInput; className?: string }) {
  const lang = inv.language;
  const w = W[lang];
  const ar = lang === 'ar';
  const serif = ar ? { fontFamily: "'IBM Plex Sans Arabic', serif", fontWeight: 600 } : { fontFamily: "'Cormorant Garamond', Georgia, serif" };
  const names = inv.coupleNames || (ar ? 'أسماء العروسين' : 'Your names');
  const date = formatInviteDate(inv.date, lang);
  const time = formatInviteTime(inv.time, lang);

  if (inv.template === 'garden') {
    return (
      <div dir={ar ? 'rtl' : 'ltr'} data-testid="card-invitation-garden" className={cn('relative overflow-hidden rounded-[28px] bg-[#F8F6F0] text-center text-forest shadow-[var(--shadow-lg)]', className)}>
        <div className="relative h-40 overflow-hidden">
          <img src={IMG('florals')} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F8F6F0]/30 to-[#F8F6F0]" />
        </div>
        <div className="relative -mt-6 px-8 pb-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8a6a3a]">{w.together}</p>
          <h2 className="mt-4 text-4xl leading-tight md:text-5xl" style={serif}>{names}</h2>
          <p className="mt-4 text-sm text-charcoal/70">{w.request}</p>
          <p className="mt-1 text-xl" style={serif}>{inv.eventName || '—'}</p>
          <Ornament className="mx-auto my-6 text-gold" />
          <p className="text-base font-medium">{date}</p>
          <p className="text-sm text-charcoal/70">{w.at} {time}</p>
          <p className="mt-4 text-lg" style={serif}>{inv.venue || '—'}</p>
          <p className="text-xs text-charcoal/60">{inv.location}</p>
          {inv.message && <p className="mx-auto mt-6 max-w-sm whitespace-pre-line text-sm italic leading-relaxed text-charcoal/75">{inv.message}</p>}
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[#8a6a3a]">{w.rsvp}</p>
        </div>
      </div>
    );
  }

  if (inv.template === 'modern') {
    return (
      <div dir={ar ? 'rtl' : 'ltr'} data-testid="card-invitation-modern" className={cn('relative overflow-hidden rounded-[28px] border border-beige bg-white text-charcoal shadow-[var(--shadow-lg)]', className)}>
        <div className="grid min-h-full grid-rows-[auto_1fr_auto] p-8 md:p-10">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-charcoal/50"><span>{inv.eventName || '—'}</span><span className="h-px w-12 bg-gold" /></div>
          <div className="py-10">
            <p className="text-xs text-charcoal/60">{w.together}</p>
            <h2 className="mt-3 text-5xl leading-[0.95] tracking-tight text-forest md:text-6xl" style={serif}>{names}</h2>
            <p className="mt-5 max-w-xs text-sm text-charcoal/70">{w.request} <span className="text-forest">{inv.eventName}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-6 border-t border-beige pt-6 text-sm">
            <div><div className="text-[10px] uppercase tracking-[0.24em] text-gold">{ar ? 'الموعد' : 'When'}</div><div className="mt-1 font-medium">{date}</div><div className="text-charcoal/60">{time}</div></div>
            <div><div className="text-[10px] uppercase tracking-[0.24em] text-gold">{ar ? 'المكان' : 'Where'}</div><div className="mt-1 font-medium">{inv.venue || '—'}</div><div className="text-charcoal/60">{inv.location}</div></div>
            {inv.message && <p className="col-span-2 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">{inv.message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // heritage
  return (
    <div dir={ar ? 'rtl' : 'ltr'} data-testid="card-invitation-heritage" className={cn('relative overflow-hidden rounded-[28px] bg-forest p-3 text-center text-ivory shadow-[var(--shadow-xl)]', className)}>
      <div className="pattern-mashrabiya absolute inset-0 opacity-50" />
      <div className="relative rounded-[22px] border border-gold/60 p-1.5">
        <div className="rounded-t-[999px] rounded-b-[18px] border border-gold/35 px-7 pb-10 pt-16">
          <Ornament className="mx-auto text-gold" />
          <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-gold">{w.together}</p>
          <h2 className="mt-4 text-4xl leading-tight text-ivory md:text-5xl" style={serif}>{names}</h2>
          <p className="mt-4 text-sm text-ivory/70">{w.request}</p>
          <p className="mt-1 text-xl text-gold" style={serif}>{inv.eventName || '—'}</p>
          <div className="mx-auto my-6 h-px w-24 bg-gold/50" />
          <p className="text-base">{date}</p>
          <p className="text-sm text-ivory/70">{w.at} {time}</p>
          <p className="mt-4 text-lg" style={serif}>{inv.venue || '—'}</p>
          <p className="text-xs text-ivory/60">{inv.location}</p>
          {inv.message && <p className="mx-auto mt-6 max-w-sm whitespace-pre-line text-sm leading-relaxed text-ivory/80">{inv.message}</p>}
          <Ornament className="mx-auto mt-7 text-gold" />
        </div>
      </div>
    </div>
  );
}
