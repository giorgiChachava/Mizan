import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Check, GitCompareArrows, Heart, MapPin, MessageSquare, Star, Wallet } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, fmtDate, useT } from '@/lib/i18n';
import { IMG, VENDORS, VENDOR_CATS, todayISO, uid } from '@/lib/seed';
import { scoreMap } from '@/lib/profile';
import { Btn, Card, Empty, Field, Input, PageHeader, Textarea } from '@/components/kit';
import { useVendorActions } from '@/components/vendor-card';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function VendorDetail() {
  const params = useParams<{ id: string }>();
  const { state, update } = useApp();
  const { t, b, lang, isAr } = useT();
  const { toggleFav, toggleCmp, favorites, compare } = useVendorActions();
  const v = VENDORS.find((x) => x.id === params.id);
  const p = state.profile;
  const [f, setF] = useState({ name: [p.name, p.partnerName].filter(Boolean).join(' & '), contact: '', date: p.dateMode === 'date' ? p.weddingDate : '', guests: String(p.guests), message: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  if (!v) return <Empty title={t('Vendor not found', 'المزود غير موجود')} sub={t('This profile may have been removed from the demo list.', 'ربما أزيل هذا الملف من القائمة التجريبية.')} action={<Link href="/vendors" className="text-sm text-forest underline">{t('Back to vendors', 'العودة للمزودين')}</Link>} />;
  const rec = scoreMap(state)[v.id];
  const fav = favorites.includes(v.id);
  const cmp = compare.includes(v.id);
  const mine = state.enquiries.filter((e) => e.vendorId === v.id);
  const meta = VENDOR_CATS[v.cat];

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = t('Please enter your name.', 'يرجى إدخال الاسم.');
    const c = f.contact.trim();
    if (!c) e.contact = t('Add an email or phone number.', 'أضيفوا بريداً إلكترونياً أو رقم هاتف.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c) && !/^\+?[0-9\s-]{7,16}$/.test(c)) e.contact = t('Enter a valid email or UAE phone number.', 'أدخلوا بريداً أو رقم هاتف صحيحاً.');
    if (f.date && f.date < todayISO()) e.date = t('Choose a future date.', 'اختاروا تاريخاً مستقبلياً.');
    const g = Number(f.guests);
    if (!(g >= 1 && g <= 5000)) e.guests = t('Guests must be between 1 and 5,000.', 'عدد الضيوف بين ١ و٥٠٠٠.');
    if (f.message.trim().length < 10) e.message = t('Write at least 10 characters.', 'اكتبوا ١٠ أحرف على الأقل.');
    setErr(e);
    if (Object.keys(e).length) return;
    update((s) => ({ ...s, enquiries: [{ id: uid(), vendorId: v.id, name: f.name.trim(), contact: c, date: f.date, guests: Math.round(g), message: f.message.trim(), createdAt: new Date().toISOString() }, ...s.enquiries] }));
    setF({ ...f, message: '' });
    toast({ title: t('Enquiry saved (demo)', 'تم حفظ الاستفسار (تجريبي)'), description: t('Nothing was sent. This vendor is fictional.', 'لم يُرسل شيء. هذا المزود خيالي.') });
  };
  const addEstimate = (i: number) => {
    const pk = v.packages[i];
    update((s) => ({ ...s, expenses: [...s.expenses, { id: uid(), cat: meta.budget, description: `${v.name} — ${pk.name.en}`, estimated: pk.price, actual: null, paid: 0, dueDate: '', notes: t('Demo quote from vendor profile', 'عرض تجريبي من ملف المزود'), vendor: v.name }] }));
    toast({ title: t('Estimate added to your budget', 'أضيف التقدير إلى ميزانيتكم'), description: `${aed(pk.price, lang)} → ${b(L.budgetCat[meta.budget])}` });
  };

  return (
    <div>
      <Link href="/vendors" data-testid="link-back-vendors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-forest hover:text-gold"><ArrowLeft className={cn('h-4 w-4', isAr && 'rotate-180')} />{t('All vendors', 'كل المزودين')}</Link>
      <div className="rise relative mb-8 h-64 overflow-hidden rounded-3xl md:h-80">
        <img src={IMG(v.img)} alt={v.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/40 to-transparent" />
        <span className="absolute end-4 top-4 rounded-full bg-ivory px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-forest">DEMO DATA · {t('FICTIONAL BUSINESS', 'نشاط خيالي')}</span>
        <div className="absolute inset-x-0 bottom-0 p-6 text-ivory md:p-8">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{b(meta)}</div>
          <h1 data-testid="text-vendor-name" className="font-serif text-4xl md:text-5xl">{lang === 'ar' ? v.nameAr : v.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ivory/80"><span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{b(v.city)}</span><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-gold text-gold" />{v.rating} · {v.reviews} {t('sample reviews', 'تقييماً تجريبياً')}</span>{v.capacity && <span>{t(`Up to ${v.capacity} guests`, `حتى ${v.capacity} ضيف`)}</span>}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-forest">{b(v.desc)}</p>
            {rec && rec.reasons.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{rec.reasons.map((r, i) => <span key={i} className="rounded-full bg-gold/15 px-3 py-1 text-xs text-[#8a6a3a]">{b(r)}</span>)}</div>}
            <div className="mt-5 flex flex-wrap gap-2">
              <Btn variant={fav ? 'gold' : 'outline'} size="sm" data-testid="button-detail-fav" onClick={() => toggleFav(v.id)}><Heart className={cn('h-4 w-4', fav && 'fill-current')} />{fav ? t('Saved', 'محفوظ') : t('Save to favourites', 'حفظ في المفضلة')}</Btn>
              <Btn variant={cmp ? 'primary' : 'outline'} size="sm" data-testid="button-detail-compare" onClick={() => toggleCmp(v.id)}><GitCompareArrows className="h-4 w-4" />{cmp ? t('In comparison', 'ضمن المقارنة') : t('Add to compare', 'أضف للمقارنة')}</Btn>
            </div>
          </Card>
          <div>
            <h2 className="mb-3 font-serif text-2xl text-forest">{t('Services and packages', 'الخدمات والباقات')}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {v.packages.map((pk, i) => (
                <Card key={i} data-testid={`card-package-${i}`} className={cn('flex flex-col p-5', i === 1 && 'border-gold/60')}>
                  <div className="text-xs uppercase tracking-[0.16em] text-gold">{b(pk.name)}</div>
                  <div className="num mt-1 font-serif text-3xl text-forest">{aed(pk.price, lang)}</div>
                  <div className="text-[10px] text-muted-foreground">{t('Indicative demo price', 'سعر تجريبي إرشادي')}</div>
                  <ul className="my-4 flex-1 space-y-1.5 text-xs text-forest">{pk.items.map((it, k) => <li key={k} className="flex gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-gold" />{b(it)}</li>)}</ul>
                  <Btn size="sm" variant="outline" data-testid={`button-add-estimate-${i}`} onClick={() => addEstimate(i)}><Wallet className="h-3.5 w-3.5" />{t('Add as estimate', 'أضف كتقدير')}</Btn>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <PageHeader eyebrow={t('Enquiry', 'استفسار')} title={t('Ask about availability', 'اسألوا عن التوفر')} />
          <Card className="-mt-6 p-6">
            <p className="mb-4 rounded-xl bg-gold/10 p-3 text-xs text-[#8a6a3a]">{t('Demo only: your enquiry is saved in this browser and is NOT sent to anyone.', 'تجريبي فقط: يحفظ استفساركم في هذا المتصفح ولن يرسل لأي جهة.')}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Your name', 'الاسم')} error={err.name} className="col-span-2"><Input data-testid="input-enquiry-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label={t('Email or phone', 'البريد أو الهاتف')} error={err.contact} className="col-span-2"><Input data-testid="input-enquiry-contact" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} placeholder="name@example.com / +971 50 000 0000" /></Field>
              <Field label={t('Event date (optional)', 'تاريخ المناسبة (اختياري)')} error={err.date}><Input data-testid="input-enquiry-date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
              <Field label={t('Guests', 'الضيوف')} error={err.guests}><Input data-testid="input-enquiry-guests" type="number" min={1} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></Field>
              <Field label={t('Message', 'الرسالة')} error={err.message} className="col-span-2"><Textarea data-testid="input-enquiry-message" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder={t('Tell them about your celebration…', 'أخبروهم عن احتفالكم…')} /></Field>
            </div>
            <Btn className="mt-4 w-full" data-testid="button-submit-enquiry" onClick={submit}><MessageSquare className="h-4 w-4" />{t('Save demo enquiry', 'حفظ الاستفسار التجريبي')}</Btn>
          </Card>
          {mine.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-forest">{t('Your saved enquiries', 'استفساراتكم المحفوظة')}</h3>
              <ul className="space-y-2">{mine.map((e) => <li key={e.id} data-testid={`row-enquiry-${e.id}`} className="rounded-xl border border-border p-3 text-xs"><div className="flex justify-between text-muted-foreground"><span>{fmtDate(e.createdAt.slice(0, 10), lang)}</span><span className="font-semibold text-[#8a6a3a]">{t('Not sent · demo', 'لم يرسل · تجريبي')}</span></div><p className="mt-1 text-forest">{e.message}</p></li>)}</ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
