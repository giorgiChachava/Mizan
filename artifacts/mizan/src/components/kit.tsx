import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-card-border bg-card shadow-[var(--shadow)]', className)} {...rest}>{children}</div>;
}

export function SampleTag({ className, label }: { className?: string; label?: string }) {
  const { t } = useT();
  return (
    <span className={cn('inline-flex items-center rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a3a]', className)}>
      {label ?? t('Sample', 'مثال')}
    </span>
  );
}

type BtnVariant = 'primary' | 'gold' | 'ghost' | 'outline' | 'danger';
export function Btn({ variant = 'primary', className, size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const v = {
    primary: 'bg-forest text-ivory hover:bg-forest-2',
    gold: 'bg-gold text-forest hover:brightness-105',
    ghost: 'text-forest hover:bg-forest/5',
    outline: 'border border-forest/20 text-forest hover:border-forest/50 bg-card',
    danger: 'text-clay hover:bg-clay/10',
  }[variant];
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,filter] active:scale-[.97] disabled:opacity-40 disabled:pointer-events-none', size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-5 text-sm', v, className)}
      {...rest}
    />
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {error ? <span className="block text-xs text-clay">{error}</span> : hint ? <span className="block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
const inputCls = 'w-full rounded-xl border border-input bg-ivory/60 px-3 h-10 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 transition';
export function Input(p: InputHTMLAttributes<HTMLInputElement>) { return <input {...p} className={cn(inputCls, p.className)} />; }
export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...p} className={cn(inputCls, 'appearance-auto', p.className)} />; }
export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...p} className={cn(inputCls, 'h-auto min-h-20 py-2', p.className)} />; }

export function Modal({ open, onClose, title, desc, children, wide }: { open: boolean; onClose: () => void; title: string; desc?: string; children: ReactNode; wide?: boolean }) {
  const { isAr } = useT();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir={isAr ? 'rtl' : 'ltr'} className={cn('max-h-[90dvh] overflow-y-auto rounded-2xl border-card-border bg-background', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <DialogHeader className="text-start">
          <DialogTitle className="font-serif text-2xl text-forest">{title}</DialogTitle>
          {desc ? <DialogDescription>{desc}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="rise mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</div>
        <h1 className="font-serif text-4xl leading-tight text-forest md:text-5xl">{title}</h1>
        {sub ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, sub, accent, testid }: { label: string; value: string; sub?: ReactNode; accent?: boolean; testid?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div data-testid={testid} className={cn('num mt-1 text-xl font-semibold tracking-tight md:text-2xl', accent ? 'text-gold' : 'text-forest')}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Bar({ value, className, tone = 'forest' }: { value: number; className?: string; tone?: 'forest' | 'gold' | 'clay' }) {
  const c = tone === 'gold' ? 'bg-gold' : tone === 'clay' ? 'bg-clay' : 'bg-forest';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-beige', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Empty({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="pattern-mashrabiya flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold/40 px-6 py-10 text-center">
      <div className="mb-3 h-8 w-8 rotate-45 border border-gold/60" />
      <div className="font-serif text-xl text-forest">{title}</div>
      {sub ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{sub}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Chip({ active, onClick, children, testid }: { active?: boolean; onClick?: () => void; children: ReactNode; testid?: string }) {
  return (
    <button data-testid={testid} type="button" onClick={onClick} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', active ? 'border-forest bg-forest text-ivory' : 'border-border bg-card text-forest hover:border-gold')}>
      {children}
    </button>
  );
}
