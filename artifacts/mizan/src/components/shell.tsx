import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, CalendarHeart, LayoutDashboard, Mail, Menu, Settings, Store, Wallet, X, AlertTriangle, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useT, aed, fmtDate } from '@/lib/i18n';
import { daysUntil, outstandingOf } from '@/lib/calc';
import { effectiveDate, TIMEFRAME_OPTS } from '@/lib/profile';
import { WeddingQuiz } from '@/components/quiz';
import { cn } from '@/lib/utils';

export const NAV = [
  { href: '/', icon: LayoutDashboard, en: 'Dashboard', ar: 'لوحة التحكم', short: { en: 'Home', ar: 'الرئيسية' } },
  { href: '/wedding', icon: CalendarHeart, en: 'My Wedding', ar: 'زفافي', short: { en: 'Wedding', ar: 'زفافي' } },
  { href: '/budget', icon: Wallet, en: 'Budget', ar: 'الميزانية', short: { en: 'Budget', ar: 'الميزانية' } },
  { href: '/vendors', icon: Store, en: 'Vendors', ar: 'المزودون', short: { en: 'Vendors', ar: 'المزودون' } },
  { href: '/invitations', icon: Mail, en: 'Invitations & Guests', ar: 'الدعوات والضيوف', short: { en: 'Invites', ar: 'الدعوات' } },
];

function Logo({ light }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
      <span className={cn('relative grid h-9 w-9 place-items-center rounded-xl border', light ? 'border-gold/60' : 'border-gold')}>
        <span className="h-3.5 w-3.5 rotate-45 border border-gold" />
        <span className="absolute h-[1px] w-6 bg-gold" />
      </span>
      <span className="leading-none">
        <span className={cn('block font-serif text-2xl', light ? 'text-ivory' : 'text-forest')}>Mizan <span className="text-gold">|</span> <span className="text-xl" style={{ fontFamily: 'IBM Plex Sans Arabic' }}>ميزان</span></span>
      </span>
    </Link>
  );
}

function NavItems({ onNav }: { onNav?: () => void }) {
  const [loc] = useLocation();
  const { t } = useT();
  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const active = n.href === '/' ? loc === '/' : loc.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={onNav} data-testid={`link-nav-${n.href.slice(1) || 'dashboard'}`}
            className={cn('group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors', active ? 'bg-sidebar-accent text-ivory' : 'text-ivory/65 hover:bg-sidebar-accent/60 hover:text-ivory')}>
            {active && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-gold" />}
            <n.icon className={cn('h-4 w-4', active ? 'text-gold' : '')} strokeWidth={1.6} />
            {t(n.en, n.ar)}
          </Link>
        );
      })}
    </nav>
  );
}

export function useNotifications() {
  const { state } = useApp();
  const { t, lang } = useT();
  return useMemo(() => {
    const items: { id: string; text: string; when: string; days: number }[] = [];
    state.expenses.filter((e) => outstandingOf(e) > 0 && e.dueDate).forEach((e) => {
      const d = daysUntil(e.dueDate);
      if (d <= 45) items.push({ id: 'e' + e.id, days: d, when: fmtDate(e.dueDate, lang), text: `${t('Payment due', 'دفعة مستحقة')}: ${e.description} — ${aed(outstandingOf(e), lang)}` });
    });
    state.tasks.filter((x) => !x.done && x.deadline).forEach((x) => {
      const d = daysUntil(x.deadline);
      if (d <= 30) items.push({ id: 't' + x.id, days: d, when: fmtDate(x.deadline, lang), text: `${d < 0 ? t('Overdue', 'متأخرة') : t('Task due', 'مهمة مستحقة')}: ${x.title}` });
    });
    return items.sort((a, b) => a.days - b.days);
  }, [state, t, lang]);
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, update, storageError, setQuizOpen } = useApp();
  const { t, b, isAr } = useT();
  const [readNotifs, setReadNotifs] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mizan-read-notifs') || '[]'); } catch { return []; } });
  const markRead = (ids: string[]) => { setReadNotifs(ids); try { localStorage.setItem('mizan-read-notifs', JSON.stringify(ids)); } catch { /* storage unavailable */ } };
  const wDate = effectiveDate(state.profile);
  const [mobile, setMobile] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [, nav] = useLocation();
  const notifs = useNotifications();
  const unread = notifs.filter((n) => !readNotifs.includes(n.id)).length;
  const setLang = (l: 'en' | 'ar') => update((s) => ({ ...s, profile: { ...s.profile, lang: l } }));

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col bg-sidebar px-4 py-6 lg:flex">
        <div className="pattern-mashrabiya pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative px-2"><Logo light /></div>
        <div className="relative mt-10 flex-1"><NavItems /></div>
        <div className="relative rounded-2xl border border-gold/25 bg-sidebar-accent/50 p-4 text-xs text-ivory/70">
          <div className="mb-1 font-semibold uppercase tracking-[0.18em] text-gold">{t('Your wedding', 'زفافك')}</div>
          <div className="font-serif text-lg text-ivory">{wDate ? fmtDate(wDate, state.profile.lang) : state.profile.dateMode === 'timeframe' ? b(TIMEFRAME_OPTS[state.profile.timeframe]) : t('Date to be decided', 'التاريخ لم يحدد')}</div>
          <div>{t('Your traditions. Your budget.', 'عاداتك. ميزانيتك.')}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-charcoal/50" onClick={() => setMobile(false)} />
          <div className="absolute inset-y-0 start-0 w-72 bg-sidebar p-5">
            <div className="mb-8 flex items-center justify-between"><Logo light /><button data-testid="button-close-menu" onClick={() => setMobile(false)} className="text-ivory"><X className="h-5 w-5" /></button></div>
            <NavItems onNav={() => setMobile(false)} />
          </div>
        </div>
      )}

      <div className="lg:ps-64">
        {/* Demo banner */}
        <div data-testid="text-demo-banner" className="flex items-center justify-center gap-2 bg-forest px-4 py-2 text-center text-[11px] font-medium tracking-wide text-ivory/90">
          <span className="rounded-sm bg-gold px-1.5 py-0.5 text-[10px] font-bold text-forest">DEMO</span>
          <span>{t('Demo — vendors, prices, ratings and items marked Sample are fictional. Your own entries stay in this browser.', 'عرض تجريبي — المزودون والأسعار والتقييمات والعناصر المعلّمة "مثال" خيالية. بياناتكم تبقى في هذا المتصفح.')}</span>
        </div>
        {storageError && (
          <div className="flex items-center justify-center gap-2 bg-clay/10 px-4 py-2 text-xs text-clay">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('Your browser storage is unavailable — changes will not persist after refresh.', 'تخزين المتصفح غير متاح — لن تُحفظ التغييرات بعد التحديث.')}
          </div>
        )}
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button data-testid="button-open-menu" onClick={() => setMobile(true)} className="rounded-lg p-2 text-forest lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden"><Logo /></div>
            <div className="hidden text-sm text-muted-foreground lg:block">{t('Your wedding. Your traditions. Your budget.', 'زفافك. عاداتك. ميزانيتك.')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-border bg-card p-0.5 text-xs">
              <button data-testid="button-lang-en" onClick={() => setLang('en')} className={cn('rounded-full px-3 py-1', !isAr ? 'bg-forest text-ivory' : 'text-forest')}>EN</button>
              <button data-testid="button-lang-ar" onClick={() => setLang('ar')} className={cn('rounded-full px-3 py-1', isAr ? 'bg-forest text-ivory' : 'text-forest')} style={{ fontFamily: 'IBM Plex Sans Arabic' }}>عربي</button>
            </div>
            <div className="relative">
              <button data-testid="button-notifications" onClick={() => { setNotifOpen((o) => !o); setProfOpen(false); }} className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-forest">
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute -top-1 -end-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-forest">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="absolute end-0 top-11 z-50 w-80 rounded-2xl border border-border bg-popover p-2 shadow-[var(--shadow-xl)]">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-sm font-semibold text-forest">{t('Notifications', 'الإشعارات')}</span>
                    <button data-testid="button-mark-read" className="text-xs text-gold" onClick={() => markRead(notifs.map((n) => n.id))}>{t('Mark all read', 'تحديد الكل كمقروء')}</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifs.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">{t('You are all caught up.', 'لا توجد إشعارات جديدة.')}</div>}
                    {notifs.map((n) => (
                      <div key={n.id} className={cn('rounded-xl px-3 py-2 text-xs', !readNotifs.includes(n.id) && 'bg-gold/10')}>
                        <div className="text-forest">{n.text}</div>
                        {n.when && <div className="mt-0.5 text-muted-foreground">{n.when}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button data-testid="button-profile" onClick={() => { setProfOpen((o) => !o); setNotifOpen(false); }} className="flex items-center gap-2 rounded-full border border-border bg-card py-1 ps-1 pe-3">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-forest text-xs font-semibold text-gold">{(state.profile.name || 'M').slice(0, 1).toUpperCase()}</span>
                <span className="hidden text-sm text-forest sm:block">{state.profile.name || t('Guest', 'ضيف')}</span>
              </button>
              {profOpen && (
                <div className="absolute end-0 top-11 z-50 w-56 rounded-2xl border border-border bg-popover p-1.5 text-sm shadow-[var(--shadow-xl)]">
                  <button data-testid="button-profile-quiz" onClick={() => { setProfOpen(false); setQuizOpen(true); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-forest hover:bg-muted"><Sparkles className="h-4 w-4 text-gold" />{t('Edit wedding profile', 'تعديل ملف الزفاف')}</button>
                  <button data-testid="button-profile-settings" onClick={() => { setProfOpen(false); nav('/settings'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-forest hover:bg-muted"><Settings className="h-4 w-4 text-gold" />{t('Settings and demo data', 'الإعدادات والبيانات التجريبية')}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-8 md:px-8 lg:pb-16" onClick={() => { if (notifOpen) setNotifOpen(false); if (profOpen) setProfOpen(false); }}>{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border bg-background/95 py-2 backdrop-blur lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} data-testid={`link-mobile-${n.href.slice(1) || 'dashboard'}`} className="flex flex-col items-center gap-0.5 px-2 text-[10px] text-forest">
            <n.icon className="h-5 w-5" strokeWidth={1.5} />
            {b(n.short)}
          </Link>
        ))}
      </nav>
      <WeddingQuiz />
    </div>
  );
}
