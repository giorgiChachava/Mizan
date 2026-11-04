import { useState } from 'react';
import { Download, RefreshCw, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { GUEST_OPTS, STYLE_OPTS } from '@/lib/profile';
import { Btn, Card, Chip, PageHeader } from '@/components/kit';
import { ConfirmDialog } from '@/components/forms';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { state, update, reset, setQuizOpen } = useApp();
  const { t, b } = useT();
  const [confirm, setConfirm] = useState(false);
  const p = state.profile;
  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mizan-plan.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={t('Settings', 'الإعدادات')} title={t('Preferences', 'التفضيلات')} />
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-forest">{t('Wedding profile', 'ملف الزفاف')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{[p.name, p.partnerName].filter(Boolean).join(' & ')} · {b(STYLE_OPTS[p.style])} · {b(GUEST_OPTS[p.guestRange])}</p>
          <p className="mt-2 text-xs text-muted-foreground">{t('Editing refreshes suggestions only. Expenses, completed and custom tasks are kept.', 'التعديل يحدّث الاقتراحات فقط. تبقى المصاريف والمهام المكتملة والخاصة.')}</p>
          <Btn className="mt-4" data-testid="button-settings-edit-profile" onClick={() => setQuizOpen(true)}><Sparkles className="h-4 w-4" />{t('Edit wedding profile', 'تعديل ملف الزفاف')}</Btn>
        </Card>
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-forest">{t('Language', 'اللغة')}</h2>
          <div className="mt-3 flex gap-2">
            <Chip testid="button-lang-en" active={p.lang === 'en'} onClick={() => update((s) => ({ ...s, profile: { ...s.profile, lang: 'en' } }))}>English</Chip>
            <Chip testid="button-lang-ar" active={p.lang === 'ar'} onClick={() => update((s) => ({ ...s, profile: { ...s.profile, lang: 'ar' } }))}>العربية</Chip>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-serif text-2xl text-forest">{t('Your data', 'بياناتكم')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('Planner data is stored in this browser. Your saved invitation and guest RSVPs live on the server.', 'تحفظ بيانات التخطيط في هذا المتصفح. الدعوة المحفوظة وردود الضيوف محفوظة على الخادم.')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn variant="outline" data-testid="button-export" onClick={exportData}><Download className="h-4 w-4" />{t('Export plan (JSON)', 'تصدير الخطة')}</Btn>
            <Btn variant="danger" data-testid="button-reset" onClick={() => setConfirm(true)}><RefreshCw className="h-4 w-4" />{t('Reset local demo data', 'إعادة ضبط البيانات التجريبية')}</Btn>
          </div>
        </Card>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title={t('Reset local demo data?', 'إعادة ضبط البيانات المحلية؟')} confirmLabel={t('Reset', 'إعادة ضبط')}
        body={t('Budget, tasks, favourites and enquiries in this browser return to the sample plan. Your saved invitation, guest list and RSVPs on the server are not changed.', 'تعود الميزانية والمهام والمفضلة والاستفسارات في هذا المتصفح إلى الخطة التجريبية. لن تتغير دعوتكم المحفوظة وقائمة الضيوف والردود على الخادم.')}
        onConfirm={() => { reset(); toast({ title: t('Local demo data reset', 'تمت إعادة الضبط'), description: t('Server guests and RSVPs unchanged.', 'ضيوف الخادم والردود لم تتغير.') }); }} />
    </div>
  );
}
