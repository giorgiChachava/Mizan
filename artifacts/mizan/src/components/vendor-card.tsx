import { Link } from 'wouter';
import { GitCompareArrows, Heart, MapPin, Star } from 'lucide-react';
import { useApp } from '@/lib/store';
import { aed, useT } from '@/lib/i18n';
import { IMG, VENDOR_CATS, type Vendor } from '@/lib/seed';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Bi } from '@/lib/types';

export function useVendorActions() {
  const { state, update } = useApp();
  const { t } = useT();
  const toggleFav = (id: string) => update((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] }));
  const toggleCmp = (id: string) => {
    if (!state.compare.includes(id) && state.compare.length >= 3) { toast({ title: t('You can compare up to three vendors', 'يمكنكم مقارنة ثلاثة مزودين كحد أقصى'), description: t('Remove one to add another.', 'أزيلوا واحداً لإضافة آخر.') }); return; }
    update((s) => ({ ...s, compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : [...s.compare, id] }));
  };
  return { toggleFav, toggleCmp, favorites: state.favorites, compare: state.compare };
}

export function VendorCard({ v, reasons, compact }: { v: Vendor; reasons?: Bi[]; compact?: boolean }) {
  const { t, b, lang } = useT();
  const { toggleFav, toggleCmp, favorites, compare } = useVendorActions();
  const fav = favorites.includes(v.id);
  const cmp = compare.includes(v.id);
  return (
    <div data-testid={`card-vendor-${v.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <Link href={`/vendors/${v.id}`} data-testid={`link-vendor-${v.id}`} className={cn('relative block overflow-hidden', compact ? 'h-28' : 'h-44')}>
        <img src={IMG(v.img)} alt={v.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
        <span className="absolute start-3 top-3 rounded-full bg-ivory/90 px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] text-forest">DEMO DATA</span>
        <span className="absolute bottom-2.5 start-3 text-[10px] uppercase tracking-[0.16em] text-gold">{b(VENDOR_CATS[v.cat])}</span>
      </Link>
      <div className={cn('flex flex-1 flex-col', compact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <Link href={`/vendors/${v.id}`} className="min-w-0"><div className={cn('truncate font-medium text-forest hover:text-gold', compact && 'text-sm')}>{lang === 'ar' ? v.nameAr : v.name}</div></Link>
          <div className="flex shrink-0 items-center gap-0.5 text-xs text-forest"><Star className="h-3.5 w-3.5 fill-gold text-gold" />{v.rating}</div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{b(v.city)}</div>
        {!compact && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{b(v.desc)}</p>}
        {reasons && reasons.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">{reasons.slice(0, compact ? 2 : 3).map((r, i) => <span key={i} className="rounded-full bg-gold/12 px-2 py-0.5 text-[10px] text-[#8a6a3a]">{b(r)}</span>)}</div>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className={cn('num font-semibold text-forest', compact ? 'text-xs' : 'text-sm')}>{aed(v.packages[0].price, lang)}{!compact && ` – ${aed(v.packages[2].price, lang)}`}</div>
          <div className="flex gap-1">
            <button data-testid={`button-fav-${v.id}`} onClick={() => toggleFav(v.id)} className={cn('grid h-8 w-8 place-items-center rounded-full border transition', fav ? 'border-gold bg-gold/15 text-[#8a6a3a]' : 'border-border text-forest hover:border-gold')} aria-label={t('Save to favourites', 'حفظ في المفضلة')} aria-pressed={fav}><Heart className={cn('h-4 w-4', fav && 'fill-current')} /></button>
            {!compact && <button data-testid={`button-compare-${v.id}`} onClick={() => toggleCmp(v.id)} className={cn('grid h-8 w-8 place-items-center rounded-full border transition', cmp ? 'border-forest bg-forest text-gold' : 'border-border text-forest hover:border-gold')} aria-label={t('Compare', 'مقارنة')} aria-pressed={cmp}><GitCompareArrows className="h-4 w-4" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
