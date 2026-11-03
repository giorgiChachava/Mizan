import { useState } from 'react';
import { useLocation } from 'wouter';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { syncCatering, useApp } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { Btn, Card, PageHeader } from '@/components/kit';
import { ConfirmDialog } from '@/components/forms';
import { ProfileFields, toDraft, validateDraft, type ProfileDraft } from '@/components/profile-form';
import { toast } from '@/hooks/use-toast';

export function applyDraft(d: ProfileDraft) {
  const n = (v: string) => (v.trim() === '' ? 0 : Math.round(Number(v)));
  return { name: d.name.trim(), partnerName: d.partnerName.trim(), lang: d.lang, weddingDate: d.weddingDate, stage: d.stage, style: d.style, guests: n(d.guests), budget: n(d.budget), savings: n(d.savings), monthlyCapacity: n(d.monthlyCapacity) };
}

export default function Settings() {
  const { state, update, reset } = useApp();
  const { t } = useT();
  const [, nav] = useLocation();
  const [d, setD] = useState<ProfileDraft>(toDraft(state.profile));
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);

  const save = () => {
    const e = validateDraft(d, t);
    setErr(e);
    if (Object.keys(e).length) return;
    update((s) => {
      const p = applyDraft(d);
      const planned = s.cats.reduce((a, c) => a + c.allocated, 0);
      return syncCatering({ ...s, profile: { ...s.profile, ...p, budget: p.budget || planned } });
    });
    toast({ title: t('Profile saved', 'تم حفظ الملف') });
  };
  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mizan-demo-data.json'; a.click();
    } catch { toast({ title: t('Export failed', 'فشل التصدير') }); }
  };

  return (
    <div>
      <PageHeader eyebrow={t('Settings', 'الإعدادات')} title={t('Profile & preferences', 'الملف والتفضيلات')} sub={t('Every input from onboarding can be edited here.', 'يمكن تعديل جميع بيانات الإعداد هنا.')} />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <ProfileFields d={d} set={setD} err={err} />
          <div className="mt-6 flex justify-end gap-2"><Btn variant="ghost" onClick={() => { setD(toDraft(state.profile)); setErr({}); }}>{t('Discard', 'تجاهل')}</Btn><Btn data-testid="button-save-profile" onClick={save}>{t('Save profile', 'حفظ الملف')}</Btn></div>
        </Card>
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-forest">{t('Onboarding', 'الإعداد')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Walk through the guided setup again to rebuild your profile.', 'أعد خطوات الإعداد الموجّه لبناء ملفك من جديد.')}</p>
            <Btn className="mt-4" variant="outline" data-testid="button-start-onboarding" onClick={() => nav('/onboarding')}><Sparkles className="h-4 w-4" />{t('Start onboarding', 'بدء الإعداد')}</Btn>
          </Card>
          <Card className="p-6">
            <h2 className="font-serif text-2xl text-forest">{t('Demo data', 'البيانات التجريبية')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Data is stored only in this browser. Reset restores the Ahmed sample profile.', 'تُحفظ البيانات في هذا المتصفح فقط. إعادة الضبط تستعيد ملف أحمد التجريبي.')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="outline" data-testid="button-export" onClick={exportData}><Download className="h-4 w-4" />{t('Export JSON', 'تصدير JSON')}</Btn>
              <Btn className="bg-clay hover:bg-clay/90" data-testid="button-reset-demo" onClick={() => setConfirm(true)}><RefreshCw className="h-4 w-4" />{t('Reset demo', 'إعادة ضبط العرض')}</Btn>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={t('Reset all demo data?', 'إعادة ضبط كل البيانات؟')} body={t('All tasks, expenses, guests and settings will return to the sample profile.', 'ستعود جميع المهام والمصاريف والضيوف والإعدادات إلى الملف التجريبي.')}
        onConfirm={() => { reset(); setTimeout(() => nav('/'), 0); toast({ title: t('Demo data restored', 'تمت استعادة البيانات التجريبية') }); }} />
    </div>
  );
}
