import type { AppState, BudgetCatId, Expense } from './types';

export function daysUntil(iso: string) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(iso + 'T00:00:00');
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

/** Committed cost of an expense: actual when known, otherwise the estimate. */
export const committed = (e: Expense) => (e.actual ?? e.estimated);
export const outstandingOf = (e: Expense) => Math.max(0, committed(e) - e.paid);

/**
 * Budget maths. Allocations are plans, never spending. Paid is a subset of committed cost,
 * so it is never added on top of actual or estimated totals.
 */
export function finance(s: AppState) {
  const budget = s.profile.budget;
  const allocated = s.cats.reduce((a, c) => a + c.allocated, 0);
  const estimated = s.expenses.reduce((a, e) => a + e.estimated, 0);
  const actual = s.expenses.reduce((a, e) => a + (e.actual ?? 0), 0);
  const committedTotal = s.expenses.reduce((a, e) => a + committed(e), 0);
  const paid = s.expenses.reduce((a, e) => a + e.paid, 0);
  const outstanding = s.expenses.reduce((a, e) => a + outstandingOf(e), 0);
  const remaining = budget - committedTotal;
  const byCat = {} as Record<BudgetCatId, { allocated: number; estimated: number; actual: number; committed: number; paid: number }>;
  s.cats.forEach((c) => { byCat[c.id] = { allocated: c.allocated, estimated: 0, actual: 0, committed: 0, paid: 0 }; });
  s.expenses.forEach((e) => {
    const r = byCat[e.cat] ?? (byCat[e.cat] = { allocated: 0, estimated: 0, actual: 0, committed: 0, paid: 0 });
    r.estimated += e.estimated; r.actual += e.actual ?? 0; r.committed += committed(e); r.paid += e.paid;
  });
  const done = s.tasks.filter((t) => t.done).length;
  const progress = s.tasks.length ? Math.round((done / s.tasks.length) * 100) : 0;
  const contribReceived = s.contributions.filter((c) => c.received).reduce((a, c) => a + c.amount, 0);
  const contribPledged = s.contributions.filter((c) => !c.received).reduce((a, c) => a + c.amount, 0);
  return { budget, allocated, estimated, actual, committedTotal, paid, outstanding, remaining, byCat, done, progress, contribReceived, contribPledged };
}
