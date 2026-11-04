import { useMemo, useState } from 'react';
import { Check, GitCompareArrows, Heart, MapPin, MessageSquare, Search, Star, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { L, aed, useT } from '@/lib/i18n';
import { IMG, VENDORS, VENDOR_CATS, addDays, uid, type Vendor, type VendorCat } from '@/lib/seed';
import { Btn, Card, Chip, Empty, Field, Input, Modal, PageHeader, SampleTag, Select, Textarea } from '@/components/kit';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PRICE = { all: [0, Infinity], low: [0, 5000], mid: [5000, 20000], high: [20000, Infinity] } as const;

export default function Vendors() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<VendorCat | 'all'>('all');
  const [price, setPrice] = useState<keyof typeof PRICE>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<Vendor | null>(null);
  const [cmpOpen, setCmpOpen] = useState(false);

  const list = useMemo(() => VENDORS.filter((v) => {
    const s = q.trim().toLowerCase();
    const min = v.packages[0].price;
    const [lo, hi] = PRICE[price];
    return (!s || v.name.toLowerCase().includes(s) || v.nameAr.includes(q.trim())) && (cat === 'all' || v.cat === cat) && min >= lo && min < hi && (!favOnly || state.favorites.includes(v.id));
  }), [q, cat, price, favOnly, state.favorites]);

  const toggleFav = (id: string) => update((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] }));
  const toggleCmp = (id: string) => {
    if (!state.compare.includes(id) && state.compare.length >= 3) { toast({ title: t('You can compare up to three vendors.', 'يمكنك مقارنة ثلاثة مزودين كحد أقصى.') }); return; }
    update((s) => ({ ...s, compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : [...s.compare, id] }));
  };
  const cmpVendors = state.compare.map((id) => VENDORS.find((v) => v.id === id)!).filter(Boolean);

  return (
    <div>
      <PageHeader eyebrow={t('Services & Vendors', 'الخدمات والمزودون')} title={t('A curated directory', 'دليل منتقى بعناية')} sub={t('All vendors, prices, ratings and packages below are fictional demo data. Nothing here is bookable.', 'جميع المزودين والأسعار والتقييمات والباقات أدناه بيانات تجريبية خيالية. لا يمكن الحجز فعلياً.')} />

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input data-testid="input-vendor-search" className="ps-9" placeholder={t('Search by name', 'ابحث بالاسم')} value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select data-testid="select-vendor-category" className="w-56" value={cat} onChange={(e) => setCat(e.target.value as VendorCat | 'all')}>
            <option value="all">{t('All categories', 'كل الفئات')}</option>
            {(Object.keys(VENDOR_CATS) as VendorCat[]).map((c) => <option key={c} value={c}>{b(VENDOR_CATS[c])}</option>)}
          </Select>
          <Select data-testid="select-vendor-price" className="w-52" value={price} onChange={(e) => setPrice(e.target.value as keyof typeof PRICE)}>
            <option value="all">{t('Any sample price', 'أي سعر')}</option>
            <option value="low">{t('From under AED 5k', 'يبدأ أقل من ٥ آلاف')}</option>
            <option value="mid">{t('From AED 5k–20k', 'يبدأ من ٥ إلى ٢٠ ألف')}</option>
            <option value="high">{t('From AED 20k+', 'يبدأ من ٢٠ ألف فأكثر')}</option>
          </Select>
          <Chip testid="filter-favorites" active={favOnly} onClick={() => setFavOnly((x) => !x)}><Heart className="me-1 inline h-3 w-3" />{t('Favourites', 'المفضلة')} ({state.favorites.length})</Chip>
        </div>
      </Card>

      {list.length === 0 ? <Empty title={t('No vendors match', 'لا يوجد مزودون مطابقون')} sub={t('Try clearing a filter.', 'جرّب إزالة أحد الفلاتر.')} action={<Btn size="sm" variant="outline" onClick={() => { setQ(''); setCat('all'); setPrice('all'); setFavOnly(false); }}>{t('Clear filters', 'مسح الفلاتر')}</Btn>} /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((v, i) => {
            const fav = state.favorites.includes(v.id);
            const cmp = state.compare.includes(v.id);
            const inPlan = state.plan.some((p) => p.vendorId === v.id);
            return (
              <Card key={v.id} data-testid={`card-vendor-${v.id}`} className={cn('rise group overflow-hidden', i % 3 === 1 && 'rise-1', i % 3 === 2 && 'rise-2')}>
                <button className="relative block h-48 w-full overflow-hidden" onClick={() => setOpen(v)} data-testid={`button-open-vendor-${v.id}`}>
                  <img src={IMG(v.img)} alt={v.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest/70 to-transparent" />
                  <span className="absolute start-3 top-3"><SampleTag className="bg-ivory/90" label={t('Fictional', 'خيالي')} /></span>
                  {inPlan && <span className="absolute end-3 top-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-forest">{t('In plan', 'في الخطة')}</span>}
                  <span className="absolute bottom-3 start-3 text-[11px] uppercase tracking-[0.16em] text-gold">{b(VENDOR_CATS[v.cat])}</span>
                </button>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div><div className="font-medium text-forest">{lang === 'ar' ? v.nameAr : v.name}</div><div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{b(v.city)}</div></div>
                    <div className="flex items-center gap-1 text-xs text-forest"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{v.rating}<span className="text-muted-foreground">({t('sample', 'مثال')})</span></div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{b(v.desc)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="num text-sm font-semibold text-forest">{aed(v.packages[0].price, lang)} – {aed(v.packages[2].price, lang)}</div>
                    <div className="flex gap-1">
                      <button data-testid={`button-fav-${v.id}`} onClick={() => toggleFav(v.id)} className={cn('grid h-8 w-8 place-items-center rounded-full border', fav ? 'border-gold bg-gold/15 text-[#8a6a3a]' : 'border-border text-forest')} aria-label="favourite"><Heart className={cn('h-4 w-4', fav && 'fill-current')} /></button>
                      <button data-testid={`button-compare-${v.id}`} onClick={() => toggleCmp(v.id)} className={cn('grid h-8 w-8 place-items-center rounded-full border', cmp ? 'border-forest bg-forest text-gold' : 'border-border text-forest')} aria-label="compare"><GitCompareArrows className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {cmpVendors.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto flex w-fit max-w-[95vw] items-center gap-3 rounded-full border border-gold/40 bg-forest px-4 py-2 text-ivory shadow-[var(--shadow-xl)] lg:bottom-6 lg:ms-[calc(50%+8rem)] lg:-translate-x-1/2 rtl:lg:translate-x-1/2">
          <span className="text-xs">{t('Compare', 'مقارنة')} {cmpVendors.length}/3</span>
          {cmpVendors.map((v) => <button key={v.id} onClick={() => toggleCmp(v.id)} className="flex items-center gap-1 rounded-full bg-ivory/10 px-2 py-1 text-[11px]">{(lang === 'ar' ? v.nameAr : v.name).split(' ').slice(0, 2).join(' ')}<X className="h-3 w-3" /></button>)}
          <Btn size="sm" variant="gold" data-testid="button-open-compare" disabled={cmpVendors.length < 2} onClick={() => setCmpOpen(true)}>{t('Compare now', 'قارن الآن')}</Btn>
        </div>
      )}

      <VendorProfile v={open} onClose={() => setOpen(null)} onCompare={toggleCmp} />

      <Modal wide open={cmpOpen} onClose={() => setCmpOpen(false)} title={t('Side-by-side comparison', 'مقارنة جنباً إلى جنب')} desc={t('Fictional sample data for demonstration only.', 'بيانات خيالية للعرض فقط.')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr><th className="w-32" />{cmpVendors.map((v) => <th key={v.id} className="p-2 text-start align-top"><img src={IMG(v.img)} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" /><div className="font-medium text-forest">{lang === 'ar' ? v.nameAr : v.name}</div></th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {[
                [t('Category', 'الفئة'), (v: Vendor) => b(VENDOR_CATS[v.cat])],
                [t('Location', 'الموقع'), (v: Vendor) => b(v.city)],
                [t('Sample rating', 'التقييم (مثال)'), (v: Vendor) => `${v.rating} · ${v.reviews} ${t('reviews', 'تقييم')}`],
                ...[0, 1, 2].map((i) => [`${t('Package', 'باقة')} ${i + 1}`, (v: Vendor) => `${b(v.packages[i].name)} · ${aed(v.packages[i].price, lang)}`] as const),
                [t('Premium includes', 'تشمل الفاخرة'), (v: Vendor) => v.packages[2].items.map((x) => b(x)).join(' · ')],
              ].map(([label, fn], i) => {
                const vals = cmpVendors.map((v) => (fn as (v: Vendor) => string)(v));
                return <tr key={i}><td className="p-2 text-xs text-muted-foreground">{label as string}</td>{vals.map((x, j) => <td key={j} className="p-2 text-forest">{x}</td>)}</tr>;
              })}
              <tr><td className="p-2 text-xs text-muted-foreground">{t('Lowest entry price', 'أقل سعر بداية')}</td>{cmpVendors.map((v) => { const min = Math.min(...cmpVendors.map((x) => x.packages[0].price)); return <td key={v.id} className="p-2">{v.packages[0].price === min ? <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-[#8a6a3a]"><Check className="h-3 w-3" />{t('Lowest', 'الأقل')}</span> : '—'}</td>; })}</tr>
              <tr><td /> {cmpVendors.map((v) => <td key={v.id} className="p-2"><Btn size="sm" variant="outline" onClick={() => { setCmpOpen(false); setOpen(v); }}>{t('View packages', 'عرض الباقات')}</Btn></td>)}</tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

function VendorProfile({ v, onClose, onCompare }: { v: Vendor | null; onClose: () => void; onCompare: (id: string) => void }) {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const [inquiry, setInquiry] = useState(false);
  const [msg, setMsg] = useState('');
  const [date, setDate] = useState(addDays(30));
  if (!v) return null;
  const inPlan = state.plan.find((p) => p.vendorId === v.id);
  const addToPlan = (pkg: number) => {
    const p = v.packages[pkg];
    const bcat = VENDOR_CATS[v.cat].budget;
    const expId = uid();
    update((s) => {
      const prev = s.plan.find((x) => x.vendorId === v.id);
      const expenses = prev ? s.expenses.filter((e) => e.id !== prev.expenseId) : s.expenses;
      return {
        ...s,
        expenses: [...expenses, { id: expId, cat: bcat, description: `${v.name} — ${p.name.en} package (sample)`, amount: p.price, paidAmount: 0, date, status: 'unpaid' as const, vendor: v.name }],
        plan: [...s.plan.filter((x) => x.vendorId !== v.id), { vendorId: v.id, pkg, expenseId: expId }],
      };
    });
    toast({ title: t('Added to your plan and budget', 'أضيف إلى خطتك وميزانيتك'), description: `${aed(p.price, lang)} → ${b(L.budgetCat[bcat])} (${t('unpaid estimate', 'تقدير غير مدفوع')})` });
  };
  const removePlan = () => update((s) => ({ ...s, plan: s.plan.filter((x) => x.vendorId !== v.id), expenses: s.expenses.filter((e) => e.id !== inPlan?.expenseId) }));
  return (
    <>
      <Modal wide open={!!v && !inquiry} onClose={onClose} title={lang === 'ar' ? v.nameAr : v.name} desc={`${b(VENDOR_CATS[v.cat])} · ${b(v.city)} · ${t('Fictional vendor profile', 'ملف مزود خيالي')}`}>
        <img src={IMG(v.img)} alt={v.name} className="h-56 w-full rounded-2xl object-cover" />
        <div className="flex flex-wrap items-center gap-3 text-sm"><span className="flex items-center gap-1 text-forest"><Star className="h-4 w-4 fill-gold text-gold" />{v.rating} · {v.reviews} {t('reviews', 'تقييم')}</span><SampleTag label={t('Sample rating', 'تقييم تجريبي')} /></div>
        <p className="text-sm text-muted-foreground">{b(v.desc)}</p>
        <Field label={t('Estimated payment date for budget', 'تاريخ الدفع المتوقع للميزانية')} className="max-w-xs"><Input data-testid="input-vendor-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="grid gap-3 md:grid-cols-3">
          {v.packages.map((p, i) => {
            const sel = inPlan?.pkg === i;
            return (
              <div key={i} data-testid={`card-package-${v.id}-${i}`} className={cn('flex flex-col rounded-2xl border p-4', sel ? 'border-gold bg-gold/5' : 'border-border', i === 1 && !sel && 'border-forest/30')}>
                <div className="text-xs uppercase tracking-[0.16em] text-gold">{b(p.name)}</div>
                <div className="num mt-1 font-serif text-2xl text-forest">{aed(p.price, lang)}</div>
                <div className="text-[10px] text-muted-foreground">{t('Sample price', 'سعر تجريبي')}</div>
                <ul className="my-3 flex-1 space-y-1 text-xs text-forest">{p.items.map((it, k) => <li key={k} className="flex gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-gold" />{b(it)}</li>)}</ul>
                <Btn size="sm" variant={sel ? 'gold' : 'primary'} data-testid={`button-add-package-${v.id}-${i}`} onClick={() => addToPlan(i)}>{sel ? t('Selected — update', 'محدد — تحديث') : t('Add to plan & budget', 'أضف للخطة والميزانية')}</Btn>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {inPlan && <Btn variant="danger" size="sm" data-testid="button-remove-plan" onClick={removePlan}>{t('Remove from plan', 'إزالة من الخطة')}</Btn>}
          <Btn variant="outline" size="sm" onClick={() => onCompare(v.id)}>{state.compare.includes(v.id) ? t('Remove from compare', 'إزالة من المقارنة') : t('Add to compare', 'أضف للمقارنة')}</Btn>
          <Btn size="sm" data-testid="button-inquiry" onClick={() => { setMsg(t(`Hello, we are planning a wedding for ${state.profile.guests} guests and would like to know more.`, `مرحباً، نخطط لعرس لـ ${state.profile.guests} ضيف ونرغب بمعرفة المزيد.`)); setInquiry(true); }}><MessageSquare className="h-4 w-4" />{t('Send inquiry', 'إرسال استفسار')}</Btn>
        </div>
      </Modal>
      <Modal open={inquiry} onClose={() => setInquiry(false)} title={t('Inquiry (demo)', 'استفسار (تجريبي)')} desc={t('This is a simulation — no message is sent to any real business.', 'هذه محاكاة — لن تُرسل أي رسالة لأي جهة حقيقية.')}>
        <Field label={t('Message', 'الرسالة')}><Textarea data-testid="input-inquiry" value={msg} onChange={(e) => setMsg(e.target.value)} /></Field>
        <div className="flex justify-end gap-2"><Btn variant="ghost" onClick={() => setInquiry(false)}>{t('Cancel', 'إلغاء')}</Btn><Btn data-testid="button-send-inquiry" disabled={!msg.trim()} onClick={() => { setInquiry(false); update((s) => ({ ...s, comments: [...s.comments, { id: uid(), author: s.profile.name || 'Me', text: `${t('Inquiry to', 'استفسار إلى')} ${v.name}: ${msg}`, date: new Date().toISOString().slice(0, 10) }] })); toast({ title: t('Demo inquiry saved to your notes', 'حُفظ الاستفسار التجريبي في ملاحظاتك') }); }}>{t('Save demo inquiry', 'حفظ الاستفسار')}</Btn></div>
      </Modal>
    </>
  );
}
