import { AskMizanBody } from "@workspace/api-zod";

type Input = ReturnType<typeof AskMizanBody.parse>;

/** A transparent rules engine: illustrative arithmetic, not an LLM or financial advice. */
export function analyseWedding(input: Input) {
  const ar = input.language === "ar";
  const text = input.message.toLowerCase().replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  let context: Record<string, unknown> = {};
  if (input.context) {
    try {
      const parsed: unknown = JSON.parse(input.context);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) context = parsed as Record<string, unknown>;
    } catch { /* Free-text context is not interpreted as instructions. */ }
  }
  const number = (value: number) => Math.round(value).toLocaleString(ar ? "ar-AE" : "en-AE");
  const money = (value: number) => `${number(value)} ${ar ? "درهم" : "AED"}`;
  const need = Math.max(0, input.remainingExpenses - input.savings);
  const monthlyTarget = need === 0 ? 0 : input.monthsRemaining > 0 ? Math.ceil(need / input.monthsRemaining) : need;
  const projected = input.savings + input.monthlyCapacity * input.monthsRemaining;
  const shortfall = Math.max(0, input.remainingExpenses - projected);
  const surplus = Math.max(0, projected - input.remainingExpenses);
  const perGuest = input.cateringPerGuest ?? 140;
  const priorities = input.priorities ?? "";
  const protectedCatering = /cater|food|ضيافة|طعام|تموين/.test(priorities) || /(?:without|don't|do not|not|دون|بدون).*(?:cater|food|ضيافة|طعام)/.test(text);
  const intro = ar
    ? "تحليل توضيحي بمحرك قواعد، وليس نموذجاً لغوياً أو نصيحة مالية. جميع الأسعار والبرامج افتراضية."
    : "ILLUSTRATIVE rule-based analysis, not an LLM or financial advice. All prices and programs are fictional.";
  const summary = ar
    ? `المصروفات المتبقية: ${money(input.remainingExpenses)}. المدخرات المخصصة: ${money(input.savings)}. المطلوب ادخاره: ${money(need)}. هدف الادخار الشهري: ${money(monthlyTarget)}. ${shortfall > 0 ? `العجز المتوقع: ${money(shortfall)}.` : `الفائض المتوقع: ${money(surplus)}.`}`
    : `Remaining expenses: ${money(input.remainingExpenses)}. Allocated savings: ${money(input.savings)}. Still to save: ${money(need)}. Monthly savings target: ${money(monthlyTarget)}. ${shortfall > 0 ? `Projected shortfall: ${money(shortfall)}.` : `Projected surplus: ${money(surplus)}.`}`;
  const parts = [intro, summary];
  const estimatedTotal = typeof context.estimatedTotal === "number" ? context.estimatedTotal : input.remainingExpenses;
  parts.push(ar
    ? `التكلفة الإجمالية المقدرة: ${money(estimatedTotal)}. ${estimatedTotal > input.budget ? `تتجاوز ميزانيتك بمقدار ${money(estimatedTotal - input.budget)}.` : `ضمن ميزانيتك مع هامش ${money(input.budget - estimatedTotal)}.`}`
    : `Estimated total cost: ${money(estimatedTotal)}. ${estimatedTotal > input.budget ? `This exceeds your budget by ${money(estimatedTotal - input.budget)}.` : `Within your budget with ${money(input.budget - estimatedTotal)} headroom.`}`);
  if (input.monthsRemaining === 0 && need > 0) {
    parts.push(ar ? "الموعد اليوم أو مضى؛ المبلغ مطلوب الآن. اختر موعداً مستقبلياً لحساب خطة شهرية." : "The wedding date is today or has passed: the outstanding amount is due now. Choose a future date for a monthly plan.");
  }
  if (/guest|invite|ضيف|ضيوف|مدعو/.test(text)) {
    const match = text.match(/(\d+)\s*(?:more|extra|additional|guests?|ضيف|ضيوف|إضاف)/);
    const extra = match ? Math.min(10000, Number(match[1])) : 50;
    const delta = extra * perGuest;
    const nextMonthly = input.monthsRemaining > 0 ? Math.ceil((need + delta) / input.monthsRemaining) : need + delta;
    parts.push(ar
      ? `إضافة ${number(extra)} ضيفاً إلى ${number(input.guestCount)} ضيفاً تضيف ${money(delta)}، بافتراض ${money(perGuest)} للضيف. الهدف الشهري الجديد: ${money(nextMonthly)}. لا يشمل ذلك أي زيادة في سعة القاعة.`
      : `Adding ${number(extra)} guests to your ${number(input.guestCount)} guests adds ${money(delta)} at the editable assumption of ${money(perGuest)} per guest. New monthly target: ${money(nextMonthly)}. Venue capacity upgrades are not included.`);
  }
  if (/optim|reduc|save|budget|compromis|توفير|خفض|ميزانية/.test(text)) {
    if (protectedCatering) parts.push(ar ? "سنحافظ على أولوية الضيافة ولا نوصي بخفض جودتها." : "Catering is protected as a stated priority; its quality will not be reduced.");
    const recommendations = Array.isArray(context.recommendations) ? context.recommendations as Record<string, unknown>[] : [];
    const safe = recommendations.filter(r => !(protectedCatering && r.key === "catering") && !priorities.split(",").map(p => p.trim()).includes(String(r.key)));
    if (safe.length) {
      parts.push(`${ar ? "بدائل وفق افتراضاتك القابلة للتعديل" : "Alternatives using your editable assumptions"}:\n${safe.map(r => `- ${r.label ?? r.text}`).join("\n")}`);
    } else {
      const options = [
        !/venue/.test(priorities) ? (ar ? "قارن باقات القاعات" : "Compare venue packages") : "",
        !/decoration/.test(priorities) ? (ar ? "قلّل الزينة الاختيارية" : "Reduce optional decoration") : "",
        !/photo/.test(priorities) ? (ar ? "قارن باقات التصوير" : "Compare photography packages") : "",
      ].filter(Boolean);
      parts.push(options.length ? options.join("; ") + "." : (ar ? "جميع الخيارات الرئيسية محمية؛ زد الادخار أو راجع الموعد بدلاً من المساس بأولوياتك." : "Your main choices are protected; increase savings or reconsider the date rather than compromising your priorities."));
    }
    if (shortfall > 0 && input.monthlyCapacity > 0) {
      const extraMonths = Math.ceil(shortfall / input.monthlyCapacity);
      parts.push(ar
        ? `بديل حسابي: تمديد الادخار ${number(extraMonths)} شهراً إضافياً يغطي العجز بالسعة الحالية، إذا لم تتغير التكاليف.`
        : `Alternative scenario: saving for ${number(extraMonths)} additional months covers the shortfall at your current capacity, assuming unchanged costs.`);
    }
  }
  if (/task|organis|organiz|remaining|مهام|تنظيم/.test(text)) {
    const tasks = Array.isArray(context.tasks) ? context.tasks as Record<string, unknown>[] : [];
    const pending = tasks.filter(task => !task.completed && !task.done).slice(0, 6);
    parts.push(pending.length
      ? `${ar ? "المهام التالية من خطتك" : "Next tasks from your plan"}: ${pending.map(task => `${task.title ?? task.name ?? ""}${task.deadline || task.dueDate ? ` (${task.deadline ?? task.dueDate})` : ""}`).join("; ")}.`
      : (ar ? "ابدأ بالمهام غير المكتملة الأقرب موعداً: تأكيد القاعة ثم الضيافة والدعوات. عيّن مسؤولاً وموعداً لكل مهمة في مخطط الزفاف." : "Prioritise your earliest incomplete deadlines: venue confirmation, catering and invitations. Assign an owner and due date in your Wedding Blueprint."));
  }
  if (/pay|deposit|دفع|دفعات/.test(text)) {
    const expenses = Array.isArray(context.expenses) ? context.expenses as Record<string, unknown>[] : [];
    const unpaid = expenses.filter(e => Number(e.amount ?? 0) > Number(e.paid ?? e.paidAmount ?? 0))
      .sort((a, b) => String(a.dueDate ?? a.date ?? "").localeCompare(String(b.dueDate ?? b.date ?? ""))).slice(0, 5);
    parts.push(unpaid.length
      ? `${ar ? "راجع الدفعات غير المسددة حسب الموعد" : "Review unpaid balances in date order"}: ${unpaid.map(e => `${e.description ?? e.name ?? "Expense"} — ${money(Math.max(0, Number(e.amount) - Number(e.paid ?? e.paidAmount ?? 0)))}`).join("; ")}.`
      : (ar ? "رتّب الدفعات حسب الموعد، بدءاً بالودائع المؤكدة ثم الأرصدة المتبقية. لا تدفع لأي مورد افتراضي." : "Prioritise confirmed deposits by deadline, followed by outstanding balances. Never send money to fictional demo vendors."));
  }
  if (/compar|venue|قارن|مقارنة|قاعة/.test(text)) {
    const vendors = Array.isArray(context.vendors) ? context.vendors as Record<string, unknown>[] : [];
    parts.push(vendors.length
      ? `${ar ? "مقارنة موردين افتراضيين من خطتك" : "Fictional vendor comparison from your plan"}:\n${vendors.map(v => {
        const packages = Array.isArray(v.packages) ? v.packages as Record<string, unknown>[] : [];
        const prices = packages.map(p => Number(p.price)).filter(Number.isFinite);
        return `- ${v.name}: ${prices.length ? `${money(Math.min(...prices))}–${money(Math.max(...prices))}` : ""} (${ar ? "تقييم تجريبي" : "sample rating"}: ${v.rating})`;
      }).join("\n")}`
      : (ar ? "أضف حتى ثلاثة موردين للمقارنة أو إلى المفضلة في دليل الخدمات أولاً. التقييمات الافتراضية لا تمثل جودة حقيقية." : "Add up to three vendors to compare or favourites in Services & Vendors first. Fictional ratings do not indicate real quality."));
  }
  if (input.context && /compar|venue|pay|task|قارن|مهام|دفع/.test(text) && !Object.keys(context).length) {
    parts.push(`${ar ? "سياق خطتك الحالي" : "Your current plan context"}: ${input.context.slice(0, 1800)}`);
  }
  return { answer: parts.join("\n\n"), monthlyTarget, shortfall, mode: "deterministic-demo" as const };
}
