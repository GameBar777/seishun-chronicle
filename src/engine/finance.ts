import type { GameState, LedgerRow } from './types';
import { Ctx } from './ctx';
import { regionById } from '../data/regions';

// Progressive "tax + social insurance" on household earned income (fictional rates).
export function taxOf(income: number) {
  const br: [number, number][] = [[195, 0.15], [330, 0.2], [695, 0.28], [900, 0.33], [1800, 0.4], [Infinity, 0.48]];
  let t = 0, prev = 0; for (const [lim, r] of br) { if (income > prev) t += (Math.min(income, lim) - prev) * r; prev = lim; } return t;
}
export const EDU_SPEND = [15, 45, 110]; // per-child yearly spend levels (万円, before price level)

// Settles the year's household budget. Every cash/debt movement is recorded so the ledger identity always holds:
// cashEnd = cashStart + oneoff + loans + income + spouseIncome - tax - living - housing - education - debtRepay + borrowed - invDeposit + invWithdraw
export function settleYear(s: GameState): LedgerRow {
  const c = new Ctx(s); const p = s.p, w = s.world; const cur = s.cur;
  const reg = regionById(p.regionId); const pl = w.priceLevel;
  const cashStart = p.cash - cur.oneoff - cur.loans + cur.invDeposit - cur.invWithdraw; // cash at start of year (before events)
  const debtStart0 = p.debt - cur.loans + cur.forgiven; const investStart = p.invest - cur.invDeposit + cur.invWithdraw;
  // income
  let income = 0;
  if (p.studying) income += Math.round(60 * pl);
  else if (p.jobId) income += c.salary();
  else if (p.retired) income += (150 + Math.min(p.rep, 50)) * pl + (s.flags['career_avg'] ?? 300) * 0.25;
  else if (!p.business && s.flags['lost_job'] !== undefined && w.year - s.flags['lost_job'] <= 1) income += (s.flags['last_salary'] ?? 250) * 0.5 * (w.welfare / 60);
  if (p.business) {
    const b = p.business; const econ = { boom: 1.4, normal: 1, recession: 0.5, crisis: -0.3 }[w.phase];
    const profit = b.value * b.profitRate * econ + c.rng.normal(0, b.value * 0.04);
    income += Math.max(-b.value * 0.3, profit);
    b.value = Math.max(0, b.value * (1 + (econ - 0.7) * 0.08 + c.rng.normal(0, 0.05)));
  }
  const sp = c.spouse; const spouseIncome = sp && sp.jobId ? sp.income * Math.pow(pl, 0.9) : 0;
  const earned = Math.max(0, income);
  const tax = taxOf(earned) + taxOf(spouseIncome);
  // spending
  const kids = c.children.filter(k => c.npcAge(k) < 22);
  const withParents = p.regionId === p.homeRegionId && p.age <= 24 && !sp && c.parents.length > 0 && !s.flags['left_home_house'];
  const living = (withParents ? 70 : 140) * pl * reg.price * (1 + (sp ? 0.6 : 0) + kids.length * 0.3) + (s.flags['lifestyle_high'] !== undefined ? 80 * pl : 0);
  let housing = 0;
  if (p.house) { const h = p.house; const intr = h.mortgage * h.rate; const pay = Math.min(h.payment, h.mortgage + intr); h.mortgage = Math.max(0, h.mortgage + intr - pay); housing = pay; h.value *= 1 + w.inflation * 0.8 + (w.regions[p.regionId].dev - 50) / 2500; }
  else if (!withParents) housing = 75 * pl * reg.price * (sp || kids.length ? 1.5 : 1);
  let education = p.studying ? p.studying.cost * pl : 0;
  for (const k of kids) { const lvl = (k as any).eduLevel ?? 1; education += EDU_SPEND[lvl] * pl * (c.npcAge(k) >= 18 ? 1.5 : 1); k.eduPts = (k.eduPts ?? 0) + lvl + 1; }
  education += cur.education; // already deducted in events? no: cur.education is planned spend added here
  // debt
  const debtInterest = p.debt * p.debtRate;
  p.debt += debtInterest;
  let cash = p.cash + income + spouseIncome - tax - living - housing - education;
  let debtRepay = 0, borrowed = 0;
  if (p.debt > 0 && cash > 0) { debtRepay = Math.min(p.debt, cash, Math.max(debtInterest * 1.2, p.debt * 0.25)); p.debt -= debtRepay; cash -= debtRepay; }
  if (cash < 0) { // shortfall: liquidate investments first, then borrow
    const take = Math.min(-cash, p.invest); p.invest -= take; cash += take; cur.invWithdraw += take;
    if (cash < 0) { borrowed = -cash; const tot = p.debt + borrowed; p.debtRate = (p.debt * p.debtRate + borrowed * 0.12) / tot; p.debt = tot; cash = 0; }
  }
  // auto-invest a share of the surplus
  const surplus = cash - cashStart - cur.oneoff - cur.loans;
  if (surplus > 0 && p.investRate > 0) { const d = Math.min(surplus * p.investRate, Math.max(0, cash)); cash -= d; p.invest += d; cur.invDeposit += d; }
  const rmean = { boom: 0.11, normal: 0.045, recession: -0.06, crisis: -0.2 }[w.phase];
  const invReturn = p.invest * (rmean + c.rng.normal(0, 0.05));
  p.invest = Math.max(0, p.invest + invReturn);
  if (p.debt < 0.01) { p.debt = 0; }
  // Personal bankruptcy when debt becomes unpayable: debt is discharged (recorded as forgiven), credit is damaged.
  const cap = Math.max(1500 * pl, 6 * (income + spouseIncome));
  if (p.debt > cap) { const f = p.debt; cur.forgiven += f; p.debt = 0; p.debtRate = 0.05; s.flags['bankrupt'] = w.year; p.rep = Math.max(0, p.rep - 10);
    s.log.push({ year: w.year, age: p.age, kind: 'money', text: `返済不能となり自己破産した（免責額 ${Math.round(f)}万円）。`, important: true }); }
  p.cash = cash;
  if (p.jobId) s.flags['career_avg'] = Math.round(((s.flags['career_avg'] ?? income) * 0.9 + income * 0.1));
  const row: LedgerRow = { year: w.year, age: p.age, cashStart, oneoff: cur.oneoff, income, spouseIncome, tax, living, housing, education, debtInterest, debtRepay, borrowed, loans: cur.loans,
    invDeposit: cur.invDeposit, invWithdraw: cur.invWithdraw, invReturn, cashEnd: p.cash, debtStart: debtStart0, debtEnd: p.debt, forgiven: cur.forgiven, investStart, investEnd: p.invest, netWorth: c.netWorth };
  s.ledger.push(row); if (s.ledger.length > 140) s.ledger.shift();
  s.cur = { oneoff: 0, loans: 0, invDeposit: 0, invWithdraw: 0, education: 0, forgiven: 0 };
  return row;
}
export function ledgerError(r: LedgerRow) {
  const cashCalc = r.cashStart + r.oneoff + r.loans + r.income + r.spouseIncome - r.tax - r.living - r.housing - r.education - r.debtRepay + r.borrowed - r.invDeposit + r.invWithdraw;
  const debtCalc = r.debtStart + r.loans + r.debtInterest + r.borrowed - r.debtRepay - r.forgiven;
  const invCalc = r.investStart + r.invDeposit - r.invWithdraw + r.invReturn;
  return { cash: Math.abs(cashCalc - r.cashEnd), debt: r.debtEnd === 0 ? 0 : Math.abs(debtCalc - r.debtEnd), inv: r.investEnd === 0 && invCalc < 0 ? 0 : Math.abs(invCalc - r.investEnd) };
}
