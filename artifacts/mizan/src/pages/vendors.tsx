import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Check, Heart, Search, Sparkles, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import { aed, useT } from '@/lib/i18n';
import { BAND_LABEL, IMG, VENDORS, VENDOR_CATS, type PriceBand, type Vendor, type VendorCat } from '@/lib/seed';
import { recommend, scoreMap } from '@/lib/profile';
import { Btn, Chip, Empty, Input, Modal, PageHeader } from '@/components/kit';
import { VendorCard, useVendorActions } from '@/components/vendor-card';

export default function Vendors() {
  const { state, setQuizOpen } = useApp();
  const { t, b, lang } = useT();
  const { toggleCmp } = useVendorActions();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<VendorCat | 'all'>('all');
  const [band, setBand] = useState<PriceBand | 'all'>('all');
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState<'recommended' | 'price' | 'rating'>('recommended');
  const [cmpOpen, setCmpOpen] = useState(false);
  const scores = useMemo(() => scoreMap(state), [state]);
  const recs = useMemo(() => recommend(state, 4), [state]);

  const list = VENDORS.filter((v) => {
    const s = q.trim().toLowerCase();
    return (!s || v.name.toLowerCase().includes(s) || v.nameAr.includes(q.trim())) && (cat === 'all' || v.cat === cat) && (band === 'all' || v.band === band) && (!favOnly || state.favorites.includes(v.id));
  }).sort((a, c) => sort === 'price' ? a.packages[0].price - c.packages[0].price : sort === 'rating' ? c.rating - a.rating : (scores[c.id]?.score ?? 0) - (scores[a.id]?.score ?? 0));
  const cmpVendors = state.compare.map((id) => VENDORS.find((v) => v.id === id)).filter(Boolean) as Vendor[];
  const clear = () => { setQ(''); setCat('all'); setBand('all'); setFavOnly(false); };

  return (
    <div>
      <PageHeader eyebrow={t('Vendors', 'المزودون')} title={t('Discover vendors', 'اكتشفوا المزودين')} sub={t('Every business, price and rating below is fictional DEMO DATA, not a real UAE company. Bookings and payments are not available yet.', 'جميع الأعمال والأسعار والتقييمات أدناه بيانات تجريبية خيالية وليست شركات إماراتية حقيقية. الحجوزات والمدفوعات غير متاحة بعد.')} />

      <section className="rise mb-8 rounded-3xl border border-gold/30 bg-gold/5 p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h2 className="font-serif text-2xl text-forest">{t('Recommended for your wedding', 'مقترحة لزفافكم')}</h2>
          <button data-testid="button-vendors-edit-profile" onClick={() => setQuizOpen(true)} className="ms-auto text-xs text-forest underline-offset-4 hover:text-gold hover:underline">{t('Update preferences', 'تحديث التفضيلات')}</button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{recs.map((r) => <VendorCard key={r.vendor.id} v={r.vendor} reasons={r.reasons} compact />)}</div>
      </section>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input data-testid="input-vendor-search" type="search" placeholder={t('Search by name', 'ابحثوا بالاسم')} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'value', 'mid', 'premium'] as const).map((x) => <Chip key={x} testid={`filter-band-${x}`} active={band === x} onClick={() => setBand(x)}>{x === 'all' ? t('Any price', 'كل الأسعار') : b(BAND_LABEL[x])}</Chip>)}
        </div>
        <div className="flex items-center gap-2 md:ms-auto">
          <Chip testid="filter-favourites" active={favOnly} onClick={() => setFavOnly(!favOnly)}><span className="inline-flex items-center gap-1"><Heart className="h-3 w-3" />{t('Favourites', 'المفضلة')} ({state.favorites.length})</span></Chip>
          <select data-testid="select-vendor-sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-8 rounded-full border border-border bg-card px-3 text-xs text-forest">
            <option value="recommended">{t('Best match', 'الأنسب')}</option><option value="price">{t('Lowest price', 'الأقل سعراً')}</option><option value="rating">{t('Sample rating', 'التقييم التجريبي')}</option>
          </select>
        </div>
      </div>
      <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
        <Chip testid="filter-cat-all" active={cat === 'all'} onClick={() => setCat('all')}>{t('All categories', 'كل الفئات')}</Chip>
        {(Object.keys(VENDOR_CATS) as VendorCat[]).map((c) => <Chip key={c} testid={`filter-cat-${c}`} active={cat === c} onClick={() => setCat(c)}>{b(VENDOR_CATS[c])}</Chip>)}
      </div>

      {list.length === 0 ? (
        <Empty title={favOnly ? t('No favourites match', 'لا توجد مفضلة مطابقة') : t('No vendors match these filters', 'لا يوجد مزودون مطابقون')} sub={t('Try widening the price range or clearing the search.', 'جربوا توسيع نطاق السعر أو مسح البحث.')} action={<Btn size="sm" variant="outline" onClick={clear}>{t('Clear filters', 'مسح التصفية')}</Btn>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{list.map((v) => <VendorCard key={v.id} v={v} reasons={scores[v.id]?.reasons} />)}</div>
      )}

      {cmpVendors.length > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-30 mx-auto flex w-fit max-w-[95vw] items-center gap-2 rounded-full border border-gold/40 bg-forest px-4 py-2 text-ivory shadow-[var(--shadow-xl)] lg:bottom-6 lg:ps-64">
          <span className="text-xs">{t('Compare', 'مقارنة')} {cmpVendors.length}/3</span>
          {cmpVendors.map((v) => <button key={v.id} onClick={() => toggleCmp(v.id)} className="hidden items-center gap-1 rounded-full bg-ivory/10 px-2 py-1 text-[11px] sm:flex">{(lang === 'ar' ? v.nameAr : v.name).split(' ').slice(0, 2).join(' ')}<X className="h-3 w-3" /></button>)}
          <Btn size="sm" variant="gold" data-testid="button-open-compare" disabled={cmpVendors.length < 2} onClick={() => setCmpOpen(true)}>{t('Compare now', 'قارن الآن')}</Btn>
        </div>
      )}

      <Modal wide open={cmpOpen} onClose={() => setCmpOpen(false)} title={t('Side-by-side comparison', 'مقارنة جنباً إلى جنب')} desc={t('Fictional DEMO DATA for illustration only.', 'بيانات تجريبية خيالية للتوضيح فقط.')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead><tr><th className="w-32" />{cmpVendors.map((v) => <th key={v.id} className="p-2 text-start align-top"><img src={IMG(v.img)} alt="" className="mb-2 h-24 w-full rounded-xl object-cover" /><div className="font-medium text-forest">{lang === 'ar' ? v.nameAr : v.name}</div></th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {([
                [t('Category', 'الفئة'), (v: Vendor) => b(VENDOR_CATS[v.cat])],
                [t('Location', 'الموقع'), (v: Vendor) => b(v.city)],
                [t('Sample rating', 'التقييم التجريبي'), (v: Vendor) => `${v.rating} · ${v.reviews} ${t('reviews', 'تقييم')}`],
                [t('Price range', 'نطاق السعر'), (v: Vendor) => `${aed(v.packages[0].price, lang)} – ${aed(v.packages[2].price, lang)}`],
                [t('Capacity', 'السعة'), (v: Vendor) => (v.capacity ? `${v.capacity}` : '—')],
                [t('Match for you', 'الملاءمة لكم'), (v: Vendor) => (scores[v.id]?.reasons.map((r) => b(r)).join(' · ') || '—')],
                [t('Top package includes', 'تشمل الباقة الكبرى'), (v: Vendor) => v.packages[2].items.map((x) => b(x)).join(' · ')],
              ] as [string, (v: Vendor) => string][]).map(([label, fn], i) => (
                <tr key={i}><td className="p-2 text-xs text-muted-foreground">{label}</td>{cmpVendors.map((v) => <td key={v.id} className="p-2 text-forest">{fn(v)}</td>)}</tr>
              ))}
              <tr><td className="p-2 text-xs text-muted-foreground">{t('Lowest entry price', 'أقل سعر بداية')}</td>{cmpVendors.map((v) => { const min = Math.min(...cmpVendors.map((x) => x.packages[0].price)); return <td key={v.id} className="p-2">{v.packages[0].price === min ? <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-xs text-[#8a6a3a]"><Check className="h-3 w-3" />{t('Lowest', 'الأقل')}</span> : '—'}</td>; })}</tr>
              <tr><td />{cmpVendors.map((v) => <td key={v.id} className="p-2"><Link href={`/vendors/${v.id}`} onClick={() => setCmpOpen(false)} className="inline-flex h-8 items-center rounded-full border border-forest/20 px-3 text-xs text-forest hover:border-gold">{t('Open profile', 'فتح الملف')}</Link></td>)}</tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
