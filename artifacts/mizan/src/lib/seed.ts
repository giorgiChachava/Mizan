import type { AppState, Bi, BudgetCatId } from './types';

export const IMG = (n: string) => `${import.meta.env.BASE_URL}images/${n}.jpg`;

const iso = (d: Date) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
export const todayISO = () => iso(new Date());
export const addDays = (days: number, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + days); return iso(d); };
export const addMonths = (months: number, from = new Date()) => { const d = new Date(from); d.setMonth(d.getMonth() + months); return iso(d); };
export const uid = () => Math.random().toString(36).slice(2, 10);

export const CAT_COLORS: Record<BudgetCatId, string> = {
  venue: '#173B35', catering: '#B99A62', prep: '#5d8a7f', mahr: '#8a6a3a', invites: '#cbb994', other: '#a5553f',
};

export type VendorCat = 'venues' | 'hotels' | 'catering' | 'photo' | 'video' | 'makeup' | 'dress' | 'jewellery' | 'decor' | 'invites' | 'planners';
export const VENDOR_CATS: Record<VendorCat, Bi & { budget: BudgetCatId }> = {
  venues: { en: 'Wedding venues', ar: 'أماكن الأعراس', budget: 'venue' },
  hotels: { en: 'Hotels & wedding halls', ar: 'فنادق وقاعات', budget: 'venue' },
  catering: { en: 'Catering companies', ar: 'شركات الضيافة', budget: 'catering' },
  photo: { en: 'Photographers', ar: 'مصورون', budget: 'prep' },
  video: { en: 'Videographers', ar: 'مصورو فيديو', budget: 'prep' },
  makeup: { en: 'Makeup artists', ar: 'خبيرات تجميل', budget: 'prep' },
  dress: { en: 'Dress designers', ar: 'مصممو الفساتين', budget: 'prep' },
  jewellery: { en: 'Jewellery', ar: 'المجوهرات', budget: 'mahr' },
  decor: { en: 'Decoration', ar: 'الديكور والكوشة', budget: 'venue' },
  invites: { en: 'Invitation designers', ar: 'تصميم الدعوات', budget: 'invites' },
  planners: { en: 'Wedding planners', ar: 'منظمو الأعراس', budget: 'other' },
};

export interface Pkg { name: Bi; price: number; items: Bi[] }
export interface Vendor { id: string; name: string; nameAr: string; cat: VendorCat; city: Bi; desc: Bi; rating: number; reviews: number; img: string; packages: Pkg[] }

const P = (en: string, ar: string): Bi => ({ en, ar });
const pk = (base: number, unit: Bi[], mult = [1, 1.6, 2.5]): Pkg[] => [
  { name: P('Basic', 'أساسي'), price: Math.round(base * mult[0]), items: unit.slice(0, 2) },
  { name: P('Standard', 'قياسي'), price: Math.round(base * mult[1]), items: unit.slice(0, 3) },
  { name: P('Premium', 'فاخر'), price: Math.round(base * mult[2]), items: unit },
];
const C = { dxb: P('Dubai', 'دبي'), auh: P('Abu Dhabi', 'أبوظبي'), shj: P('Sharjah', 'الشارقة'), ain: P('Al Ain', 'العين'), rak: P('Ras Al Khaimah', 'رأس الخيمة'), fuj: P('Fujairah', 'الفجيرة'), ajm: P('Ajman', 'عجمان') };

export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Qasr Al Sarab Gardens', nameAr: 'حدائق قصر السراب', cat: 'venues', city: C.auh, img: 'venue', rating: 4.8, reviews: 126, desc: P('Open-air desert garden venue with a lantern-lit majlis and separate courtyards for men and women.', 'مكان مفتوح في حديقة صحراوية مع مجلس مضاء بالفوانيس وساحات منفصلة للرجال والنساء.'), packages: pk(28000, [P('Venue hire, 6 hours', 'استئجار المكان ٦ ساعات'), P('Separate courtyards', 'ساحات منفصلة'), P('Valet & ushers', 'خدمة صف السيارات والمستقبلين'), P('Bridal suite overnight', 'جناح العروس لليلة')]) },
  { id: 'v2', name: 'Al Waha Majlis Estate', nameAr: 'مجلس الواحة', cat: 'venues', city: C.ain, img: 'venue', rating: 4.5, reviews: 74, desc: P('Heritage-style estate among date palms, ideal for traditional Emirati evenings.', 'عزبة بطابع تراثي بين النخيل، مثالية للأمسيات الإماراتية التقليدية.'), packages: pk(16500, [P('Estate hire, evening', 'استئجار العزبة مساءً'), P('Majlis seating', 'جلسات مجلس'), P('Lighting package', 'باقة إضاءة'), P('Heritage welcome area', 'منطقة استقبال تراثية')]) },
  { id: 'v3', name: 'Lulu Bay Grand Ballroom', nameAr: 'قاعة لؤلؤة الخليج الكبرى', cat: 'hotels', city: C.dxb, img: 'hero-stage', rating: 4.9, reviews: 211, desc: P('Five-star ballroom for up to 600 guests with in-house kosha stage team.', 'قاعة فندقية فاخرة تتسع حتى ٦٠٠ ضيف مع فريق كوشة داخلي.'), packages: pk(42000, [P('Ballroom, 7 hours', 'القاعة ٧ ساعات'), P('Standard stage', 'كوشة قياسية'), P('AV & sound', 'صوت وإضاءة'), P('Two hotel suites', 'جناحان فندقيان')], [1, 1.45, 2]) },
  { id: 'v4', name: 'Dar Al Farah Hall', nameAr: 'قاعة دار الفرح', cat: 'hotels', city: C.shj, img: 'florals', rating: 4.4, reviews: 98, desc: P('Family-run wedding hall known for warm hospitality and flexible layouts.', 'قاعة أفراح عائلية معروفة بكرم الضيافة ومرونة التصميم.'), packages: pk(19500, [P('Hall hire', 'استئجار القاعة'), P('Basic decor', 'ديكور أساسي'), P('Coffee & dates service', 'خدمة القهوة والتمر'), P('Extended hours', 'ساعات إضافية')]) },
  { id: 'v5', name: 'Bayt Al Ghadeer Catering', nameAr: 'ضيافة بيت الغدير', cat: 'catering', city: C.auh, img: 'catering', rating: 4.7, reviews: 164, desc: P('Traditional machboos, harees and luqaimat prepared for large family celebrations.', 'مجبوس وهريس ولقيمات تقليدية تُحضّر للاحتفالات العائلية الكبيرة.'), packages: pk(24000, [P('Buffet for 250', 'بوفيه لـ ٢٥٠ ضيفاً'), P('Arabic coffee service', 'خدمة القهوة العربية'), P('Live luqaimat station', 'ركن لقيمات مباشر'), P('Whole lamb ouzi', 'أوزي خروف كامل')], [1, 1.4, 1.9]) },
  { id: 'v6', name: 'Saffron & Rose Kitchen', nameAr: 'مطبخ الزعفران والورد', cat: 'catering', city: C.dxb, img: 'catering', rating: 4.6, reviews: 88, desc: P('Contemporary Emirati-fusion menus with plated service options.', 'قوائم طعام إماراتية بلمسة عصرية مع خيار التقديم الفردي.'), packages: pk(29000, [P('Fusion buffet', 'بوفيه بلمسة عصرية'), P('Dessert table', 'طاولة حلويات'), P('Plated service', 'تقديم فردي'), P('Mocktail bar', 'ركن مشروبات')], [1, 1.35, 1.8]) },
  { id: 'v7', name: 'Noor Frames Studio', nameAr: 'استوديو إطارات النور', cat: 'photo', city: C.dxb, img: 'photo', rating: 4.8, reviews: 143, desc: P('Discreet, women-led photography team for ladies\u2019 celebrations.', 'فريق تصوير نسائي متكتم لحفلات السيدات.'), packages: pk(6500, [P('6 hours coverage', 'تغطية ٦ ساعات'), P('300 edited images', '٣٠٠ صورة معدّلة'), P('Printed album', 'ألبوم مطبوع'), P('Second photographer', 'مصورة ثانية')]) },
  { id: 'v8', name: 'Sadu Light Photography', nameAr: 'تصوير ضوء السدو', cat: 'photo', city: C.rak, img: 'photo', rating: 4.3, reviews: 52, desc: P('Documentary style coverage of henna nights and family moments.', 'تغطية توثيقية لليالي الحناء واللحظات العائلية.'), packages: pk(4800, [P('Event coverage', 'تغطية الحفل'), P('Online gallery', 'معرض إلكتروني'), P('Henna night add-on', 'إضافة ليلة الحناء'), P('Same-day previews', 'معاينة في نفس اليوم')]) },
  { id: 'v9', name: 'Mirage Motion Films', nameAr: 'أفلام سراب', cat: 'video', city: C.auh, img: 'hero-stage', rating: 4.6, reviews: 67, desc: P('Cinematic wedding films with drone and highlight edits.', 'أفلام أعراس سينمائية مع تصوير جوي ومقاطع مختصرة.'), packages: pk(7800, [P('Highlight film', 'فيلم مختصر'), P('Full ceremony edit', 'مونتاج الحفل كاملاً'), P('Drone footage', 'تصوير جوي'), P('Teaser in 48h', 'مقطع تشويقي خلال ٤٨ ساعة')]) },
  { id: 'v10', name: 'Hanan Glow Atelier', nameAr: 'أتيليه حنان للتجميل', cat: 'makeup', city: C.shj, img: 'jewellery', rating: 4.7, reviews: 119, desc: P('Bridal makeup and hairstyling, home visits across the Northern Emirates.', 'مكياج وتسريح للعروس مع زيارات منزلية في الإمارات الشمالية.'), packages: pk(3500, [P('Bridal makeup', 'مكياج العروس'), P('Hairstyling', 'تسريح الشعر'), P('Trial session', 'جلسة تجريبية'), P('Mother & sisters', 'الأم والأخوات')]) },
  { id: 'v11', name: 'Maison Yasmeen Couture', nameAr: 'دار ياسمين للأزياء', cat: 'dress', city: C.dxb, img: 'attire', rating: 4.9, reviews: 95, desc: P('Made-to-measure gowns and embroidered abayas with modest silhouettes.', 'فساتين مفصلة وعبايات مطرزة بتصاميم محتشمة.'), packages: pk(14000, [P('Bespoke gown', 'فستان مفصّل'), P('Three fittings', 'ثلاث بروفات'), P('Matching abaya', 'عباية متناسقة'), P('Veil & accessories', 'الطرحة والإكسسوارات')]) },
  { id: 'v12', name: 'Kandura House Al Ain', nameAr: 'بيت الكندورة العين', cat: 'dress', city: C.ain, img: 'attire', rating: 4.5, reviews: 61, desc: P('Tailored groom kanduras, bisht and ghutra styling.', 'كندورة العريس المفصلة مع البشت وتنسيق الغترة.'), packages: pk(2600, [P('Two kanduras', 'كندورتان'), P('Bisht rental', 'استئجار البشت'), P('Perfume pairing', 'تنسيق العطور'), P('Same-week alterations', 'تعديلات خلال الأسبوع')]) },
  { id: 'v13', name: 'Dhahab Al Khaleej Jewellers', nameAr: 'ذهب الخليج للمجوهرات', cat: 'jewellery', city: C.dxb, img: 'jewellery', rating: 4.6, reviews: 132, desc: P('Traditional mortaasha and contemporary bridal sets in 21k gold.', 'مرتعشة تقليدية وأطقم عروس عصرية من ذهب عيار ٢١.'), packages: pk(12000, [P('Engagement rings', 'خواتم الخطوبة'), P('Necklace set', 'طقم قلادة'), P('Full bridal set', 'طقم عروس كامل'), P('Custom engraving', 'نقش خاص')], [1, 2, 3.2]) },
  { id: 'v14', name: 'Ward Al Reef Decor', nameAr: 'ورد الريف للديكور', cat: 'decor', city: C.ajm, img: 'florals', rating: 4.4, reviews: 79, desc: P('Kosha stages, fresh florals and lighting design for halls and homes.', 'كوشات وزهور طبيعية وتصميم إضاءة للقاعات والبيوت.'), packages: pk(9000, [P('Kosha stage', 'الكوشة'), P('Entrance florals', 'زهور المدخل'), P('Table centrepieces', 'تنسيقات الطاولات'), P('Lighting design', 'تصميم الإضاءة')], [1, 1.7, 2.6]) },
  { id: 'v15', name: 'Fanar Events Styling', nameAr: 'فنار لتنسيق الحفلات', cat: 'decor', city: C.fuj, img: 'hero-stage', rating: 4.2, reviews: 38, desc: P('Minimal modern styling with gold accents and sustainable florals.', 'تنسيق عصري بسيط بلمسات ذهبية وزهور مستدامة.'), packages: pk(6500, [P('Stage backdrop', 'خلفية المسرح'), P('Aisle florals', 'زهور الممر'), P('Candle styling', 'تنسيق الشموع'), P('Majlis cushions', 'وسائد المجلس')]) },
  { id: 'v16', name: 'Qalam Invitations', nameAr: 'قلم للدعوات', cat: 'invites', city: C.shj, img: 'invitation', rating: 4.8, reviews: 104, desc: P('Arabic calligraphy invitations, gold foil and matching digital cards.', 'دعوات بالخط العربي مع طباعة ذهبية وبطاقات رقمية متطابقة.'), packages: pk(2400, [P('250 printed cards', '٢٥٠ بطاقة مطبوعة'), P('Digital invitation', 'دعوة رقمية'), P('Wax seal & box', 'ختم شمعي وعلبة'), P('Guest favours', 'توزيعات الضيوف')]) },
  { id: 'v17', name: 'Mithaq Wedding Planning', nameAr: 'ميثاق لتنظيم الأعراس', cat: 'planners', city: C.auh, img: 'florals', rating: 4.7, reviews: 58, desc: P('Full or partial planning that coordinates both families and every vendor.', 'تنظيم كامل أو جزئي ينسّق بين العائلتين وجميع المزودين.'), packages: pk(8000, [P('Day-of coordination', 'تنسيق يوم العرس'), P('Vendor management', 'إدارة المزودين'), P('Full planning', 'تخطيط كامل'), P('Family liaison', 'التنسيق مع العائلتين')], [1, 2, 3.5]) },
  { id: 'v18', name: 'Sidra Planning Co.', nameAr: 'سدرة للتخطيط', cat: 'planners', city: C.dxb, img: 'invitation', rating: 4.3, reviews: 29, desc: P('Budget-conscious planning for intimate home weddings.', 'تخطيط اقتصادي لأعراس البيت الصغيرة.'), packages: pk(4200, [P('Checklist & timeline', 'قائمة مهام وجدول'), P('Vendor shortlist', 'قائمة مزودين مختصرة'), P('On-the-day lead', 'مسؤول يوم العرس'), P('Guest management', 'إدارة الضيوف')]) },
];

export interface Program {
  id: string; name: Bi; benefit: Bi; desc: Bi; eligibility: Bi[]; deadline: string; docs: Bi[]; process: Bi[]; sampleStatus: Bi;
}
export const PROGRAMS: Program[] = [
  { id: 'p1', name: P('Sample Marriage Grant (fictional)', 'منحة زواج تجريبية (خيالية)'), benefit: P('AED 30,000 one-time (sample)', '٣٠٬٠٠٠ درهم لمرة واحدة (مثال)'), desc: P('A fictional grant used to demonstrate eligibility matching for first marriages.', 'منحة خيالية لعرض آلية المطابقة لحالات الزواج الأول.'), eligibility: [P('National of the sample country', 'مواطن في البلد التجريبي'), P('First marriage', 'زواج أول'), P('Monthly income under AED 30,000', 'دخل شهري أقل من ٣٠٬٠٠٠ درهم')], deadline: addMonths(4), docs: [P('ID copy', 'نسخة الهوية'), P('Marriage contract', 'عقد الزواج'), P('Salary certificate', 'شهادة راتب')], process: [P('Create sample account', 'إنشاء حساب تجريبي'), P('Upload documents', 'رفع المستندات'), P('Review (demo)', 'المراجعة (تجريبية)')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
  { id: 'p2', name: P('Family Wedding Assistance', 'مساعدة الأعراس العائلية'), benefit: P('Up to AED 15,000 (sample)', 'حتى ١٥٬٠٠٠ درهم (مثال)'), desc: P('Illustrative assistance for couples hosting family-scale celebrations.', 'مساعدة توضيحية للأزواج الذين يقيمون احتفالات عائلية.'), eligibility: [P('Income under AED 15,000', 'دخل أقل من ١٥٬٠٠٠ درهم'), P('Wedding within 12 months', 'العرس خلال ١٢ شهراً')], deadline: addMonths(6), docs: [P('ID copy', 'نسخة الهوية'), P('Income proof', 'إثبات الدخل')], process: [P('Online form (demo)', 'نموذج إلكتروني (تجريبي)'), P('Interview (demo)', 'مقابلة (تجريبية)')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
  { id: 'p3', name: P('Wedding Savings Match', 'مطابقة مدخرات الزواج'), benefit: P('25% match up to AED 10,000 (sample)', 'مطابقة ٢٥٪ حتى ١٠٬٠٠٠ درهم (مثال)'), desc: P('Fictional scheme that matches part of your planned monthly wedding savings.', 'برنامج خيالي يطابق جزءاً من مدخراتك الشهرية للعرس.'), eligibility: [P('Employed or self-employed', 'موظف أو يعمل لحسابه'), P('Saving monthly toward the wedding', 'ادخار شهري للعرس')], deadline: addMonths(8), docs: [P('Bank statement', 'كشف حساب'), P('Savings plan', 'خطة الادخار')], process: [P('Link savings plan', 'ربط خطة الادخار'), P('Monthly check-in (demo)', 'متابعة شهرية (تجريبية)')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
  { id: 'p4', name: P('Community Marriage Fund', 'صندوق الزواج المجتمعي'), benefit: P('AED 8,000 (sample)', '٨٬٠٠٠ درهم (مثال)'), desc: P('A made-up community fund for young couples aged 18 to 30.', 'صندوق مجتمعي متخيل للأزواج من عمر ١٨ إلى ٣٠.'), eligibility: [P('Aged 18-30', 'العمر ١٨ إلى ٣٠'), P('First marriage', 'زواج أول')], deadline: addMonths(2), docs: [P('ID copy', 'نسخة الهوية'), P('Family book (sample)', 'خلاصة القيد (مثال)')], process: [P('Community referral (demo)', 'ترشيح مجتمعي (تجريبي)')], sampleStatus: P('Closing soon (sample)', 'يغلق قريباً (مثال)') },
  { id: 'p5', name: P('Financial Planning Workshop', 'ورشة التخطيط المالي'), benefit: P('Free 3-session course (sample)', 'دورة مجانية من ٣ جلسات (مثال)'), desc: P('Illustrative workshop on budgeting for a new household.', 'ورشة توضيحية حول ميزانية الأسرة الجديدة.'), eligibility: [P('Open to all engaged couples', 'متاحة لجميع المخطوبين')], deadline: addMonths(1), docs: [P('Registration form', 'استمارة التسجيل')], process: [P('Choose a session', 'اختيار موعد'), P('Attend (demo)', 'الحضور (تجريبي)')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
  { id: 'p6', name: P('Wedding Expense Support Scheme', 'برنامج دعم مصاريف الزواج'), benefit: P('Interest-free AED 40,000 (sample)', '٤٠٬٠٠٠ درهم بدون فوائد (مثال)'), desc: P('A fictional interest-free facility that needs salary verification.', 'تسهيل خيالي بدون فوائد يتطلب التحقق من الراتب.'), eligibility: [P('Employed', 'موظف'), P('Income AED 15,000-50,000', 'دخل ١٥٬٠٠٠ إلى ٥٠٬٠٠٠ درهم'), P('National of the sample country', 'مواطن في البلد التجريبي')], deadline: addMonths(5), docs: [P('Salary certificate', 'شهادة راتب'), P('Employer letter', 'خطاب جهة العمل'), P('ID copy', 'نسخة الهوية')], process: [P('Pre-check (demo)', 'فحص مبدئي (تجريبي)'), P('Document review', 'مراجعة المستندات')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
  { id: 'p7', name: P('Newlywed Celebration Assistance', 'مساعدة احتفال المتزوجين الجدد'), benefit: P('AED 5,000 voucher (sample)', 'قسيمة ٥٬٠٠٠ درهم (مثال)'), desc: P('A pretend voucher for weddings held in the next 9 months.', 'قسيمة افتراضية للأعراس خلال الأشهر التسعة القادمة.'), eligibility: [P('Wedding within 9 months', 'العرس خلال ٩ أشهر'), P('Completed workshop', 'إكمال الورشة')], deadline: addMonths(3), docs: [P('Workshop certificate', 'شهادة الورشة'), P('Venue confirmation', 'تأكيد القاعة')], process: [P('Submit certificate', 'تقديم الشهادة'), P('Receive voucher (demo)', 'استلام القسيمة (تجريبي)')], sampleStatus: P('Open (sample)', 'مفتوح (مثال)') },
];

export function seedState(): AppState {
  const date = addMonths(10);
  return {
    version: 1,
    profile: { name: 'Ahmed', partnerName: 'Mariam', lang: 'en', weddingDate: date, stage: 'early', guests: 250, budget: 145000, savings: 25000, monthlyCapacity: 8000, style: 'traditional', mahrAgreed: 20000, mahrPaid: 5000, mahrNotes: 'Agreed between both families; paid in two stages.', separateCelebrations: true },
    cats: [
      { id: 'venue', allocated: 45000 }, { id: 'catering', allocated: 35000 }, { id: 'prep', allocated: 25000 },
      { id: 'mahr', allocated: 20000 }, { id: 'invites', allocated: 10000 }, { id: 'other', allocated: 10000 },
    ],
    tasks: [
      { id: 't1', cat: 'engagement', title: 'Agree mahr amount and payment stages', done: true, deadline: addDays(-20), assignee: 'me', notes: 'Both families present.', estimate: 0 },
      { id: 't2', cat: 'engagement', title: 'Choose engagement rings', done: true, deadline: addDays(-5), assignee: 'c1', notes: '', estimate: 6000 },
      { id: 't3', cat: 'engagement', title: 'Plan family engagement dinner', done: false, deadline: addDays(18), assignee: 'c2', notes: '', estimate: 3500 },
      { id: 't4', cat: 'venue', title: 'Confirm venue and pay deposit', done: false, deadline: addDays(12), assignee: 'me', notes: 'Shortlist: hotel ballroom vs hall.', estimate: 15000 },
      { id: 't5', cat: 'venue', title: 'Decide on separate men\u2019s and women\u2019s celebrations', done: true, deadline: addDays(-2), assignee: 'c2', notes: '', estimate: 0 },
      { id: 't6', cat: 'venue', title: 'Catering tasting', done: false, deadline: addDays(40), assignee: 'c1', notes: '', estimate: 0 },
      { id: 't7', cat: 'prep', title: 'First dress fitting', done: false, deadline: addDays(55), assignee: 'c1', notes: 'Bring abaya fabric samples.', estimate: 14000 },
      { id: 't8', cat: 'prep', title: 'Order groom kandura & bisht', done: false, deadline: addDays(120), assignee: 'me', notes: '', estimate: 2600 },
      { id: 't9', cat: 'prep', title: 'Book photographer', done: false, deadline: addDays(30), assignee: 'me', notes: '', estimate: 6500 },
      { id: 't10', cat: 'invites', title: 'Finalise guest list with both families', done: false, deadline: addDays(60), assignee: 'c2', notes: '', estimate: 0 },
      { id: 't11', cat: 'invites', title: 'Send printed & digital invitations', done: false, deadline: addDays(200), assignee: 'c3', notes: '', estimate: 2400 },
      { id: 't12', cat: 'invites', title: 'Arrange henna night', done: false, deadline: addDays(270), assignee: 'c1', notes: '', estimate: 2500 },
      { id: 't13', cat: 'finance', title: 'Agree contributions with family', done: true, deadline: addDays(-10), assignee: 'me', notes: '', estimate: 0 },
      { id: 't14', cat: 'finance', title: 'Review monthly savings plan', done: false, deadline: addDays(25), assignee: 'me', notes: '', estimate: 0 },
      { id: 't15', cat: 'day', title: 'Confirm vendor arrival times', done: false, deadline: addDays(290), assignee: 'c3', notes: '', estimate: 0 },
      { id: 't16', cat: 'day', title: 'Final wedding-day checklist', done: false, deadline: addDays(298), assignee: 'me', notes: '', estimate: 0 },
    ],
    expenses: [
      { id: 'e1', cat: 'mahr', description: 'Engagement rings', amount: 6000, paidAmount: 6000, date: addDays(-6), status: 'paid', vendor: 'Dhahab Al Khaleej Jewellers' },
      { id: 'e2', cat: 'mahr', description: 'Mahr first stage', amount: 5000, paidAmount: 5000, date: addDays(-15), status: 'paid', vendor: '' },
      { id: 'e3', cat: 'venue', description: 'Venue deposit', amount: 15000, paidAmount: 5000, date: addDays(12), status: 'partial', vendor: 'Lulu Bay Grand Ballroom' },
      { id: 'e4', cat: 'prep', description: 'Photographer booking fee', amount: 2000, paidAmount: 0, date: addDays(30), status: 'unpaid', vendor: 'Noor Frames Studio' },
      { id: 'e5', cat: 'prep', description: 'Dress deposit', amount: 5000, paidAmount: 0, date: addDays(55), status: 'unpaid', vendor: 'Maison Yasmeen Couture' },
      { id: 'e6', cat: 'invites', description: 'Invitation design proof', amount: 800, paidAmount: 800, date: addDays(-1), status: 'paid', vendor: 'Qalam Invitations' },
    ],
    contributions: [
      { id: 'k1', source: 'self', name: 'Ahmed', amount: 25000, received: true, note: 'Current savings' },
      { id: 'k2', source: 'parents', name: 'Ahmed\u2019s parents', amount: 20000, received: false, note: 'Before the venue final payment' },
      { id: 'k3', source: 'fiance', name: 'Mariam', amount: 10000, received: false, note: 'Toward dress and preparation' },
    ],
    guests: [
      { id: 'g1', name: 'Khalid Al Mansoori family', side: 'family-a', party: 6, rsvp: 'yes', phone: '' },
      { id: 'g2', name: 'Fatima Al Suwaidi', side: 'family-b', party: 2, rsvp: 'pending', phone: '' },
      { id: 'g3', name: 'Saeed Al Ketbi family', side: 'family-a', party: 5, rsvp: 'pending', phone: '' },
      { id: 'g4', name: 'Noura Al Hammadi', side: 'friends', party: 1, rsvp: 'no', phone: '' },
      { id: 'g5', name: 'Rashid Al Nuaimi family', side: 'family-b', party: 4, rsvp: 'yes', phone: '' },
    ],
    schedule: [
      { id: 's1', time: '13:00', title: 'Decoration team setup', owner: 'Ward Al Reef Decor', contact: '050 000 0001 (sample)', kind: 'setup' },
      { id: 's2', time: '15:00', title: 'Photographer arrives', owner: 'Noor Frames Studio', contact: '050 000 0002 (sample)', kind: 'photo' },
      { id: 's3', time: '17:30', title: 'Catering arrival & setup', owner: 'Bayt Al Ghadeer', contact: '050 000 0003 (sample)', kind: 'catering' },
      { id: 's4', time: '19:30', title: 'Guests welcomed with coffee & dates', owner: 'Family', contact: '', kind: 'ceremony' },
      { id: 's5', time: '21:00', title: 'Zaffa & bride entrance', owner: 'Coordinator', contact: '', kind: 'ceremony' },
      { id: 's6', time: '22:00', title: 'Dinner served', owner: 'Bayt Al Ghadeer', contact: '', kind: 'catering' },
    ],
    collaborators: [
      { id: 'c1', name: 'Mariam', contact: 'mariam@example.com', role: 'fiance', status: 'accepted', sharedCats: ['prep', 'invites', 'catering'], shareGuests: true, shareTasks: true },
      { id: 'c2', name: 'Umm Ahmed', contact: 'family@example.com', role: 'parent', status: 'accepted', sharedCats: ['catering'], shareGuests: true, shareTasks: true },
      { id: 'c3', name: 'Hessa (coordinator)', contact: 'hessa@example.com', role: 'coordinator', status: 'invited', sharedCats: [], shareGuests: false, shareTasks: true },
    ],
    comments: [
      { id: 'm1', author: 'Mariam', text: 'Can we visit the hotel ballroom on Thursday evening?', date: addDays(-1), taskId: 't4' },
      { id: 'm2', author: 'Umm Ahmed', text: 'I added my side of the family to the guest list.', date: addDays(-3) },
    ],
    chat: [],
    favorites: ['v3', 'v5'],
    compare: [],
    plan: [],
    assumptions: {
      cateringPerGuest: 140,
      linkCatering: true,
      venue: { home: 12000, hall: 28000, hotel: 45000 },
      catering: { basic: 95, standard: 140, premium: 210 },
      decoration: { basic: 6000, standard: 15000, premium: 32000 },
      photo: { basic: 4500, standard: 7800, premium: 14000 },
      sim: { guests: 250, venue: 'hotel', catering: 'standard', decoration: 'standard', photo: 'standard', months: 10 },
      priorities: ['catering'],
    },
    support: { age: '25-30', income: '15-30', employment: 'employed', national: 'yes', firstMarriage: 'yes', workshop: false },
    readNotifs: [],
  };
}
