import { useState } from 'react';
import { CheckCircle2, CircleHelp, FileText, XCircle, CalendarDays } from 'lucide-react';
import { useApp } from '@/lib/store';
import { fmtDate, useT } from '@/lib/i18n';
import { monthsBetween } from '@/lib/calc';
import { IMG, PROGRAMS, todayISO } from '@/lib/seed';
import { Card, Chip, Field, Input, PageHeader, SampleTag, Select } from '@/components/kit';
import { cn } from '@/lib/utils';
import type { SupportInputs } from '@/lib/types';

type Status = 'match' | 'info' | 'no';
type Res = { status: Status; why: string[]; extra: string[] };

function evaluate(id: string, s: SupportInputs, weddingDate: string, t: (en: string, ar: string) => string): Res {
  const why: string[] = []; const extra: string[] = []; let missing = false; let fail = false;
  const months = monthsBetween(todayISO(), weddingDate);
  const need = (cond: boolean | null, ok: string, bad: string) => { if (cond === null) { missing = true; extra.push(bad); } else if (cond) why.push(ok); else { fail = true; why.push(bad); } };
  const national = s.national === '' ? null : s.national === 'yes';
  const first = s.firstMarriage === '' ? null : s.firstMarriage === 'yes';
  const income = s.income || null;
  const emp = s.employment || null;
  const age = s.age || null;
  switch (id) {
    case 'p1':
      need(national, t('Meets the sample nationality criterion', 'يستوفي معيار الجنسية التجريبي'), national === null ? t('Confirm nationality', 'أكّد الجنسية') : t('Sample criterion requires nationality', 'يتطلب المعيار التجريبي الجنسية'));
      need(first, t('First marriage', 'زواج أول'), first === null ? t('Confirm whether this is a first marriage', 'أكّد إن كان زواجاً أول') : t('Limited to first marriages in this sample', 'مقتصر على الزواج الأول في هذا المثال'));
      need(income ? ['under15', '15-30'].includes(income) : null, t('Income within the sample limit', 'الدخل ضمن الحد التجريبي'), income ? t('Income above the AED 30,000 sample limit', 'الدخل أعلى من حد ٣٠٬٠٠٠ التجريبي') : t('Provide your income range', 'أدخل نطاق الدخل'));
      break;
    case 'p2':
      need(income ? income === 'under15' : null, t('Income under AED 15,000', 'دخل أقل من ١٥٬٠٠٠ درهم'), income ? t('Income above the AED 15,000 sample limit', 'الدخل أعلى من حد ١٥٬٠٠٠ التجريبي') : t('Provide your income range', 'أدخل نطاق الدخل'));
      need(months >= 0 && months <= 12, t('Wedding within 12 months', 'العرس خلال ١٢ شهراً'), t('Wedding date is outside the 12-month window', 'تاريخ العرس خارج نافذة ١٢ شهراً'));
      break;
    case 'p3':
      need(emp ? ['employed', 'self'].includes(emp) : null, t('Employed or self-employed', 'موظف أو يعمل لحسابه'), emp ? t('Requires employment in this sample', 'يتطلب عملاً في هذا المثال') : t('Provide employment status', 'أدخل الحالة الوظيفية'));
      why.push(t('You have a monthly savings plan in Mizan', 'لديك خطة ادخار شهرية في ميزان'));
      break;
    case 'p4':
      need(age ? ['18-24', '25-30'].includes(age) : null, t('Aged 18-30', 'العمر بين ١٨ و٣٠'), age ? t('Outside the 18-30 sample age range', 'خارج نطاق العمر التجريبي ١٨-٣٠') : t('Provide your age range', 'أدخل الفئة العمرية'));
      need(first, t('First marriage', 'زواج أول'), first === null ? t('Confirm whether this is a first marriage', 'أكّد إن كان زواجاً أول') : t('Limited to first marriages', 'مقتصر على الزواج الأول'));
      break;
    case 'p5':
      why.push(t('Open to every engaged couple in this sample', 'متاح لجميع المخطوبين في هذا المثال'));
      break;
    case 'p6':
      need(emp ? emp === 'employed' : null, t('Employed', 'موظف'), emp ? t('Requires salaried employment', 'يتطلب وظيفة براتب') : t('Provide employment status', 'أدخل الحالة الوظيفية'));
      need(income ? ['15-30', '30-50'].includes(income) : null, t('Income AED 15,000-50,000', 'الدخل بين ١٥٬٠٠٠ و٥٠٬٠٠٠'), income ? t('Income outside the sample band', 'الدخل خارج النطاق التجريبي') : t('Provide your income range', 'أدخل نطاق الدخل'));
      need(national, t('Meets the sample nationality criterion', 'يستوفي معيار الجنسية التجريبي'), national === null ? t('Confirm nationality', 'أكّد الجنسية') : t('Sample criterion requires nationality', 'يتطلب المعيار التجريبي الجنسية'));
      break;
    case 'p7':
      need(months >= 0 && months <= 9, t('Wedding within 9 months', 'العرس خلال ٩ أشهر'), t('Wedding is more than 9 months away (or passed)', 'العرس بعد أكثر من ٩ أشهر (أو مضى)'));
      if (s.workshop) why.push(t('Workshop completed', 'تم إكمال الورشة')); else { missing = true; extra.push(t('Complete the Financial Planning Workshop first', 'أكمل ورشة التخطيط المالي أولاً')); }
      break;
  }
  return { status: fail ? 'no' : missing ? 'info' : 'match', why, extra };
}

export default function Support() {
  const { state, update } = useApp();
  const { t, b, lang } = useT();
  const s = state.support;
  const set = <K extends keyof SupportInputs>(k: K, v: SupportInputs[K]) => update((st) => ({ ...st, support: { ...st.support, [k]: v } }));
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const results = PROGRAMS.map((p) => ({ p, r: evaluate(p.id, s, state.profile.weddingDate, t) }));
  const meta: Record<Status, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
    match: { label: t('Potential match', 'تطابق محتمل'), cls: 'bg-forest/10 text-forest', icon: CheckCircle2 },
    info: { label: t('More information needed', 'مطلوب معلومات إضافية'), cls: 'bg-gold/20 text-[#8a6a3a]', icon: CircleHelp },
    no: { label: t('Does not currently match sample criteria', 'لا يطابق المعايير التجريبية حالياً'), cls: 'bg-clay/10 text-clay', icon: XCircle },
  };
  const count = (st: Status) => results.filter((x) => x.r.status === st).length;
  return (
    <div>
      <PageHeader eyebrow={t('Support Programs', 'برامج الدعم')} title={t('Discover Wedding Support', 'اكتشف دعم الزواج')} sub={t('Every program here is entirely fictional. Matching is a prototype demonstration, not a real eligibility determination.', 'جميع البرامج هنا خيالية بالكامل. المطابقة عرض تجريبي وليست تحديداً فعلياً للأهلية.')} />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <img src={IMG('invitation')} alt="" className="h-28 w-full object-cover" />
            <div className="space-y-3 p-5">
              <div className="font-serif text-xl text-forest">{t('Your matching details', 'بيانات المطابقة')}</div>
              <Field label={t('Age range', 'الفئة العمرية')}><Select data-testid="select-age" value={s.age} onChange={(e) => set('age', e.target.value as SupportInputs['age'])}><option value="">{t('Prefer not to say', 'أفضل عدم الإجابة')}</option><option value="18-24">18–24</option><option value="25-30">25–30</option><option value="31-40">31–40</option><option value="40+">40+</option></Select></Field>
              <Field label={t('Monthly income range', 'نطاق الدخل الشهري')}><Select data-testid="select-income" value={s.income} onChange={(e) => set('income', e.target.value as SupportInputs['income'])}><option value="">{t('Prefer not to say', 'أفضل عدم الإجابة')}</option><option value="under15">{t('Under AED 15,000', 'أقل من ١٥٬٠٠٠')}</option><option value="15-30">{t('AED 15,000–30,000', '١٥٬٠٠٠–٣٠٬٠٠٠')}</option><option value="30-50">{t('AED 30,000–50,000', '٣٠٬٠٠٠–٥٠٬٠٠٠')}</option><option value="over50">{t('Over AED 50,000', 'أكثر من ٥٠٬٠٠٠')}</option></Select></Field>
              <Field label={t('Employment status', 'الحالة الوظيفية')}><Select data-testid="select-employment" value={s.employment} onChange={(e) => set('employment', e.target.value as SupportInputs['employment'])}><option value="">{t('Prefer not to say', 'أفضل عدم الإجابة')}</option><option value="employed">{t('Employed', 'موظف')}</option><option value="self">{t('Self-employed', 'أعمل لحسابي')}</option><option value="student">{t('Student', 'طالب')}</option><option value="seeking">{t('Seeking work', 'أبحث عن عمل')}</option></Select></Field>
              <Field label={t('Wedding date', 'تاريخ الزفاف')}><Input data-testid="input-support-date" type="date" value={state.profile.weddingDate} onChange={(e) => e.target.value && update((st) => ({ ...st, profile: { ...st.profile, weddingDate: e.target.value } }))} /></Field>
              <Field label={t('Sample nationality criterion', 'معيار الجنسية التجريبي')}><Select data-testid="select-national" value={s.national} onChange={(e) => set('national', e.target.value as SupportInputs['national'])}><option value="">{t('Not specified', 'غير محدد')}</option><option value="yes">{t('Yes', 'نعم')}</option><option value="no">{t('No', 'لا')}</option></Select></Field>
              <Field label={t('First marriage?', 'زواج أول؟')}><Select data-testid="select-first" value={s.firstMarriage} onChange={(e) => set('firstMarriage', e.target.value as SupportInputs['firstMarriage'])}><option value="">{t('Not specified', 'غير محدد')}</option><option value="yes">{t('Yes', 'نعم')}</option><option value="no">{t('No', 'لا')}</option></Select></Field>
              <label className="flex items-center gap-2 text-sm text-forest"><input data-testid="checkbox-workshop" type="checkbox" className="accent-[#173B35]" checked={s.workshop} onChange={(e) => set('workshop', e.target.checked)} />{t('I completed the sample workshop', 'أكملت الورشة التجريبية')}</label>
            </div>
          </Card>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')} testid="filter-all-programs">{t('All', 'الكل')} ({results.length})</Chip>
            {(['match', 'info', 'no'] as Status[]).map((st) => <Chip key={st} testid={`filter-${st}`} active={filter === st} onClick={() => setFilter(st)}>{meta[st].label} ({count(st)})</Chip>)}
          </div>
          <div className="space-y-4">
            {results.filter((x) => filter === 'all' || x.r.status === filter).map(({ p, r }) => {
              const M = meta[r.status];
              return (
                <Card key={p.id} data-testid={`card-program-${p.id}`} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl text-forest">{b(p.name)}</h3><SampleTag label={t('Fictional sample', 'مثال خيالي')} /></div>
                      <div className="num mt-0.5 text-sm font-semibold text-gold">{b(p.benefit)}</div>
                    </div>
                    <span data-testid={`status-program-${p.id}`} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', M.cls)}><M.icon className="h-3.5 w-3.5" />{M.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{b(p.desc)}</p>
                  <div className="mt-4 grid gap-4 text-xs md:grid-cols-3">
                    <div><div className="mb-1 font-semibold uppercase tracking-[0.12em] text-forest">{t('Why', 'السبب')}</div><ul className="space-y-1 text-muted-foreground">{r.why.map((w, i) => <li key={i}>• {w}</li>)}{r.extra.map((w, i) => <li key={'x' + i} className="text-[#8a6a3a]">• {w}</li>)}</ul></div>
                    <div><div className="mb-1 font-semibold uppercase tracking-[0.12em] text-forest">{t('Sample eligibility', 'الأهلية (مثال)')}</div><ul className="space-y-1 text-muted-foreground">{p.eligibility.map((e, i) => <li key={i}>• {b(e)}</li>)}</ul></div>
                    <div>
                      <div className="mb-1 font-semibold uppercase tracking-[0.12em] text-forest">{t('Documents & process', 'المستندات والإجراءات')}</div>
                      <ul className="space-y-1 text-muted-foreground">{p.docs.map((d, i) => <li key={i} className="flex gap-1"><FileText className="h-3 w-3 shrink-0" />{b(d)}</li>)}</ul>
                      <ol className="mt-2 space-y-0.5 text-muted-foreground">{p.process.map((d, i) => <li key={i}>{i + 1}. {b(d)}</li>)}</ol>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{t('Sample deadline', 'الموعد التجريبي')}: {fmtDate(p.deadline, lang)}</span>
                    <span>{t('Sample status', 'الحالة التجريبية')}: {b(p.sampleStatus)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
