import type { AppState, Bi, BudgetCatId, InvitationDraft, Priority, Service, WeddingStyle } from './types';

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
  venue: '#173B35', catering: '#B99A62', decoration: '#5d8a7f', photo: '#2f5f57', clothing: '#cbb994', jewellery: '#8a6a3a', invitations: '#9fb5ad', other: '#a5553f',
};

/* ---------------- Vendors (fictional DEMO DATA) ---------------- */
export type VendorCat = 'venues' | 'catering' | 'photo' | 'video' | 'decor' | 'beauty' | 'clothing' | 'jewellery';
export const VENDOR_CATS: Record<VendorCat, Bi & { budget: BudgetCatId; service: Service; priority?: Priority }> = {
  venues: { en: 'Venues', ar: 'القاعات والأماكن', budget: 'venue', service: 'venue', priority: 'venue' },
  catering: { en: 'Catering', ar: 'الضيافة', budget: 'catering', service: 'catering', priority: 'food' },
  photo: { en: 'Photography', ar: 'التصوير الفوتوغرافي', budget: 'photo', service: 'photo', priority: 'photo' },
  video: { en: 'Videography', ar: 'التصوير المرئي', budget: 'photo', service: 'video', priority: 'photo' },
  decor: { en: 'Decoration', ar: 'الديكور', budget: 'decoration', service: 'decoration', priority: 'decoration' },
  beauty: { en: 'Makeup & beauty', ar: 'المكياج والتجميل', budget: 'clothing', service: 'beauty' },
  clothing: { en: 'Wedding clothing', ar: 'أزياء الزفاف', budget: 'clothing', service: 'clothing', priority: 'tradition' },
  jewellery: { en: 'Jewellery', ar: 'المجوهرات', budget: 'jewellery', service: 'jewellery', priority: 'tradition' },
};

export type PriceBand = 'value' | 'mid' | 'premium';
export interface Pkg { name: Bi; price: number; items: Bi[] }
export interface Vendor {
  id: string; name: string; nameAr: string; cat: VendorCat; city: Bi; desc: Bi; rating: number; reviews: number; img: string;
  band: PriceBand; styles: WeddingStyle[]; capacity?: number; packages: Pkg[];
}

const P = (en: string, ar: string): Bi => ({ en, ar });
const pk = (base: number, unit: Bi[], mult = [1, 1.6, 2.5]): Pkg[] => [
  { name: P('Essential', 'أساسية'), price: Math.round(base * mult[0]), items: unit.slice(0, 2) },
  { name: P('Signature', 'مميزة'), price: Math.round(base * mult[1]), items: unit.slice(0, 3) },
  { name: P('Grand', 'فاخرة'), price: Math.round(base * mult[2]), items: unit },
];
const C = { dxb: P('Dubai', 'دبي'), auh: P('Abu Dhabi', 'أبوظبي'), shj: P('Sharjah', 'الشارقة'), ain: P('Al Ain', 'العين'), rak: P('Ras Al Khaimah', 'رأس الخيمة'), fuj: P('Fujairah', 'الفجيرة'), ajm: P('Ajman', 'عجمان') };

export const VENDORS: Vendor[] = [
  { id: 'v1', name: 'Qasr Al Sarab Gardens', nameAr: 'حدائق قصر السراب', cat: 'venues', city: C.auh, img: 'venue', rating: 4.8, reviews: 126, band: 'premium', styles: ['traditional', 'classic', 'grand'], capacity: 700, desc: P('Open-air desert garden with a lantern-lit majlis and separate courtyards for men and women.', 'حديقة صحراوية مفتوحة مع مجلس مضاء بالفوانيس وساحات منفصلة للرجال والنساء.'), packages: pk(38000, [P('Venue hire, 6 hours', 'استئجار المكان ٦ ساعات'), P('Separate courtyards', 'ساحات منفصلة'), P('Valet and ushers', 'صف السيارات والمستقبلون'), P('Bridal suite overnight', 'جناح العروس لليلة')], [1, 1.45, 2]) },
  { id: 'v2', name: 'Al Waha Majlis Estate', nameAr: 'عزبة مجلس الواحة', cat: 'venues', city: C.ain, img: 'florals', rating: 4.5, reviews: 74, band: 'value', styles: ['traditional', 'intimate'], capacity: 220, desc: P('Heritage estate among date palms, made for warm family evenings.', 'عزبة تراثية بين النخيل، مهيأة للأمسيات العائلية الدافئة.'), packages: pk(14500, [P('Estate hire, evening', 'استئجار العزبة مساءً'), P('Majlis seating', 'جلسات مجلس'), P('Lighting package', 'باقة إضاءة'), P('Heritage welcome area', 'ركن استقبال تراثي')]) },
  { id: 'v3', name: 'Lulu Bay Grand Ballroom', nameAr: 'قاعة لؤلؤة الخليج الكبرى', cat: 'venues', city: C.dxb, img: 'hero-stage', rating: 4.9, reviews: 211, band: 'premium', styles: ['modern', 'grand', 'classic'], capacity: 900, desc: P('Five-star ballroom with an in-house stage team and two bridal suites.', 'قاعة فندقية فاخرة مع فريق كوشة داخلي وجناحين للعروس.'), packages: pk(52000, [P('Ballroom, 7 hours', 'القاعة ٧ ساعات'), P('Standard stage', 'كوشة قياسية'), P('AV and sound', 'الصوت والإضاءة'), P('Two hotel suites', 'جناحان فندقيان')], [1, 1.4, 1.9]) },
  { id: 'v4', name: 'Bayt Al Ghadeer Catering', nameAr: 'ضيافة بيت الغدير', cat: 'catering', city: C.auh, img: 'catering', rating: 4.7, reviews: 164, band: 'mid', styles: ['traditional', 'grand'], capacity: 800, desc: P('Machboos, harees and live luqaimat for large family celebrations.', 'مجبوس وهريس ولقيمات مباشرة للاحتفالات العائلية الكبيرة.'), packages: pk(26000, [P('Buffet for 250', 'بوفيه لـ ٢٥٠ ضيفاً'), P('Arabic coffee service', 'خدمة القهوة العربية'), P('Live luqaimat station', 'ركن لقيمات مباشر'), P('Whole lamb ouzi', 'أوزي خروف كامل')], [1, 1.4, 1.9]) },
  { id: 'v5', name: 'Saffron and Rose Kitchen', nameAr: 'مطبخ الزعفران والورد', cat: 'catering', city: C.dxb, img: 'catering', rating: 4.6, reviews: 88, band: 'premium', styles: ['modern', 'classic', 'intimate'], capacity: 400, desc: P('Contemporary Emirati menus with plated service and a dessert atelier.', 'قوائم إماراتية معاصرة مع تقديم فردي وركن حلويات.'), packages: pk(31000, [P('Fusion buffet', 'بوفيه معاصر'), P('Dessert table', 'طاولة حلويات'), P('Plated service', 'تقديم فردي'), P('Mocktail bar', 'ركن مشروبات')], [1, 1.35, 1.8]) },
  { id: 'v6', name: 'Noor Frames Studio', nameAr: 'استوديو إطارات النور', cat: 'photo', city: C.dxb, img: 'photo', rating: 4.8, reviews: 143, band: 'mid', styles: ['modern', 'classic', 'grand'], desc: P('Discreet, women-led photography team for ladies\u2019 celebrations.', 'فريق تصوير نسائي متكتم لحفلات السيدات.'), packages: pk(6800, [P('6 hours coverage', 'تغطية ٦ ساعات'), P('300 edited images', '٣٠٠ صورة معدلة'), P('Printed album', 'ألبوم مطبوع'), P('Second photographer', 'مصورة ثانية')]) },
  { id: 'v7', name: 'Sadu Light Photography', nameAr: 'تصوير ضوء السدو', cat: 'photo', city: C.rak, img: 'invitation', rating: 4.3, reviews: 52, band: 'value', styles: ['traditional', 'intimate'], desc: P('Documentary coverage of henna nights and quiet family moments.', 'تغطية توثيقية لليالي الحناء واللحظات العائلية الهادئة.'), packages: pk(4200, [P('Event coverage', 'تغطية الحفل'), P('Online gallery', 'معرض إلكتروني'), P('Henna night add-on', 'إضافة ليلة الحناء'), P('Same-day previews', 'معاينة في نفس اليوم')]) },
  { id: 'v8', name: 'Mirage Motion Films', nameAr: 'أفلام سراب', cat: 'video', city: C.auh, img: 'hero-stage', rating: 4.6, reviews: 67, band: 'mid', styles: ['modern', 'grand'], desc: P('Cinematic wedding films with aerial footage and 48-hour teasers.', 'أفلام أعراس سينمائية مع تصوير جوي ومقاطع تشويقية خلال ٤٨ ساعة.'), packages: pk(7900, [P('Highlight film', 'فيلم مختصر'), P('Full ceremony edit', 'مونتاج الحفل كاملاً'), P('Aerial footage', 'تصوير جوي'), P('Teaser in 48h', 'مقطع تشويقي خلال ٤٨ ساعة')]) },
  { id: 'v9', name: 'Dhow Reel Studio', nameAr: 'استوديو الداو', cat: 'video', city: C.shj, img: 'photo', rating: 4.4, reviews: 31, band: 'value', styles: ['traditional', 'classic', 'intimate'], desc: P('Gentle, story-led films that keep the family voice at the centre.', 'أفلام هادئة تروي القصة وتبقي صوت العائلة في المقدمة.'), packages: pk(4600, [P('Short film', 'فيلم قصير'), P('Family interviews', 'مقابلات عائلية'), P('Full edit', 'مونتاج كامل'), P('Archive drive', 'نسخة أرشيفية')]) },
  { id: 'v10', name: 'Ward Al Reef Decor', nameAr: 'ورد الريف للديكور', cat: 'decor', city: C.ajm, img: 'florals', rating: 4.4, reviews: 79, band: 'mid', styles: ['traditional', 'grand', 'classic'], desc: P('Kosha stages, fresh florals and lighting design for halls and homes.', 'كوشات وزهور طبيعية وتصميم إضاءة للقاعات والبيوت.'), packages: pk(11000, [P('Kosha stage', 'الكوشة'), P('Entrance florals', 'زهور المدخل'), P('Table centrepieces', 'تنسيقات الطاولات'), P('Lighting design', 'تصميم الإضاءة')], [1, 1.7, 2.6]) },
  { id: 'v11', name: 'Fanar Events Styling', nameAr: 'فنار لتنسيق الحفلات', cat: 'decor', city: C.fuj, img: 'venue', rating: 4.2, reviews: 38, band: 'value', styles: ['modern', 'intimate'], desc: P('Restrained modern styling with gold accents and seasonal florals.', 'تنسيق عصري هادئ بلمسات ذهبية وزهور موسمية.'), packages: pk(6200, [P('Stage backdrop', 'خلفية المسرح'), P('Aisle florals', 'زهور الممر'), P('Candle styling', 'تنسيق الشموع'), P('Majlis cushions', 'وسائد المجلس')]) },
  { id: 'v12', name: 'Hanan Glow Atelier', nameAr: 'أتيليه حنان للتجميل', cat: 'beauty', city: C.shj, img: 'jewellery', rating: 4.7, reviews: 119, band: 'mid', styles: ['traditional', 'modern', 'classic', 'intimate'], desc: P('Bridal makeup and hair, with home visits across the Northern Emirates.', 'مكياج وتسريح للعروس مع زيارات منزلية في الإمارات الشمالية.'), packages: pk(3600, [P('Bridal makeup', 'مكياج العروس'), P('Hairstyling', 'تسريح الشعر'), P('Trial session', 'جلسة تجريبية'), P('Mother and sisters', 'الأم والأخوات')]) },
  { id: 'v13', name: 'Maison Yasmeen Couture', nameAr: 'دار ياسمين للأزياء', cat: 'clothing', city: C.dxb, img: 'attire', rating: 4.9, reviews: 95, band: 'premium', styles: ['modern', 'classic', 'grand'], desc: P('Made-to-measure gowns and embroidered abayas with modest silhouettes.', 'فساتين مفصلة وعبايات مطرزة بتصاميم محتشمة.'), packages: pk(15000, [P('Bespoke gown', 'فستان مفصل'), P('Three fittings', 'ثلاث بروفات'), P('Matching abaya', 'عباية متناسقة'), P('Veil and accessories', 'الطرحة والإكسسوارات')]) },
  { id: 'v14', name: 'Kandura House Al Ain', nameAr: 'بيت الكندورة العين', cat: 'clothing', city: C.ain, img: 'attire', rating: 4.5, reviews: 61, band: 'value', styles: ['traditional', 'intimate', 'classic'], desc: P('Tailored groom kanduras, bisht and ghutra styling.', 'كندورة العريس المفصلة مع البشت وتنسيق الغترة.'), packages: pk(2600, [P('Two kanduras', 'كندورتان'), P('Bisht rental', 'استئجار البشت'), P('Perfume pairing', 'تنسيق العطور'), P('Same-week alterations', 'تعديلات خلال الأسبوع')]) },
  { id: 'v15', name: 'Dhahab Al Khaleej Jewellers', nameAr: 'ذهب الخليج للمجوهرات', cat: 'jewellery', city: C.dxb, img: 'jewellery', rating: 4.6, reviews: 132, band: 'premium', styles: ['traditional', 'grand', 'classic'], desc: P('Traditional mortaasha and contemporary bridal sets in 21k gold.', 'مرتعشة تقليدية وأطقم عروس عصرية من ذهب عيار ٢١.'), packages: pk(12000, [P('Engagement rings', 'خواتم الخطوبة'), P('Necklace set', 'طقم قلادة'), P('Full bridal set', 'طقم عروس كامل'), P('Custom engraving', 'نقش خاص')], [1, 2, 3.2]) },
];

export const BAND_LABEL: Record<PriceBand, Bi> = {
  value: P('Under AED 10k', 'أقل من ١٠ آلاف'),
  mid: P('AED 10k – 30k', '١٠ – ٣٠ ألف'),
  premium: P('AED 30k +', '٣٠ ألف فأكثر'),
};

export function sampleInvitation(): InvitationDraft {
  return {
    template: 'heritage', coupleNames: 'Ahmed & Mariam', eventName: 'Wedding Celebration', date: addMonths(10), time: '20:00',
    venue: 'Lulu Bay Grand Ballroom (sample)', location: 'Dubai, United Arab Emirates', language: 'en', allowPlusOnes: true, maxParty: 4,
    message: 'With joy and gratitude, our families invite you to share the evening of our wedding.',
  };
}

export function seedState(): AppState {
  const date = addMonths(10);
  return {
    version: 2,
    onboarded: false,
    profile: {
      name: 'Ahmed', partnerName: 'Mariam', lang: 'en', style: 'traditional', customStyle: '', guestRange: '200-350', guests: 280, budget: 185000,
      dateMode: 'date', weddingDate: date, timeframe: '12m',
      services: ['venue', 'catering', 'decoration', 'photo', 'video', 'beauty', 'clothing', 'jewellery', 'invitations'],
      priorities: ['food', 'tradition', 'budget'], isSample: true,
    },
    cats: [
      { id: 'venue', allocated: 46000 }, { id: 'catering', allocated: 48000 }, { id: 'decoration', allocated: 16000 }, { id: 'photo', allocated: 14000 },
      { id: 'clothing', allocated: 24000 }, { id: 'jewellery', allocated: 22000 }, { id: 'invitations', allocated: 4000 }, { id: 'other', allocated: 11000 },
    ],
    tasks: [
      { id: 't1', cat: 'venue', title: 'Shortlist three venues and visit together', done: true, deadline: addDays(-14), notes: '', source: 'sample' },
      { id: 't2', cat: 'venue', title: 'Confirm venue and pay deposit', done: false, deadline: addDays(12), notes: 'Ballroom vs garden estate.', source: 'sample' },
      { id: 't3', cat: 'catering', title: 'Book catering tasting', done: false, deadline: addDays(35), notes: '', source: 'sample' },
      { id: 't4', cat: 'clothing', title: 'Choose engagement rings', done: true, deadline: addDays(-5), notes: '', source: 'sample' },
      { id: 't5', cat: 'clothing', title: 'First dress fitting', done: false, deadline: addDays(55), notes: 'Bring abaya fabric samples.', source: 'sample' },
      { id: 't6', cat: 'photo', title: 'Book photographer', done: false, deadline: addDays(28), notes: '', source: 'sample' },
      { id: 't7', cat: 'invitations', title: 'Draft guest list with both families', done: true, deadline: addDays(-2), notes: '', source: 'sample' },
      { id: 't8', cat: 'invitations', title: 'Send digital invitation', done: false, deadline: addDays(200), notes: '', source: 'sample' },
      { id: 't9', cat: 'decoration', title: 'Agree kosha and stage concept', done: false, deadline: addDays(90), notes: '', source: 'sample' },
      { id: 't10', cat: 'decoration', title: 'Confirm vendor arrival times', done: false, deadline: addDays(290), notes: '', source: 'sample' },
    ],
    expenses: [
      { id: 'e1', cat: 'jewellery', description: 'Engagement rings', estimated: 6500, actual: 6000, paid: 6000, dueDate: addDays(-6), notes: '', vendor: 'Dhahab Al Khaleej Jewellers', sample: true },
      { id: 'e2', cat: 'venue', description: 'Venue deposit', estimated: 15000, actual: 15000, paid: 5000, dueDate: addDays(12), notes: 'Balance due before final walkthrough.', vendor: 'Lulu Bay Grand Ballroom', sample: true },
      { id: 'e3', cat: 'photo', description: 'Photographer booking fee', estimated: 2000, actual: null, paid: 0, dueDate: addDays(28), notes: '', vendor: 'Noor Frames Studio', sample: true },
      { id: 'e4', cat: 'clothing', description: 'Dress deposit', estimated: 5000, actual: null, paid: 0, dueDate: addDays(55), notes: '', vendor: 'Maison Yasmeen Couture', sample: true },
      { id: 'e5', cat: 'invitations', description: 'Invitation design proof', estimated: 900, actual: 800, paid: 800, dueDate: addDays(-1), notes: '', vendor: '', sample: true },
      { id: 'e6', cat: 'catering', description: 'Catering tasting', estimated: 1200, actual: null, paid: 0, dueDate: addDays(35), notes: '', vendor: 'Bayt Al Ghadeer Catering', sample: true },
    ],
    contributions: [
      { id: 'k1', source: 'self', name: 'Our savings', amount: 60000, received: true, note: '', sample: true },
    ],
    showContributions: false,
    favorites: ['v3', 'v4'],
    compare: [],
    enquiries: [],
    invitationDraft: sampleInvitation(),
    invitationSyncedId: null,
    sampleGuests: [
      { id: 'g1', name: 'Khalid Al Mansoori family', status: 'attending', attendees: 6, notes: 'Sample guest' },
      { id: 'g2', name: 'Fatima Al Suwaidi', status: 'pending', attendees: 2, notes: 'Sample guest' },
      { id: 'g3', name: 'Saeed Al Ketbi family', status: 'pending', attendees: 5, notes: 'Sample guest' },
      { id: 'g4', name: 'Noura Al Hammadi', status: 'declined', attendees: 0, notes: 'Sample guest' },
      { id: 'g5', name: 'Rashid Al Nuaimi family', status: 'attending', attendees: 4, notes: 'Sample guest' },
    ],
    guestsMigrated: false,
  };
}
