import { AppState, Traffic } from "./types";

export function safeNumber(x: unknown): number {
  const n = typeof x === "number" ? x : parseFloat(String(x));
  return Number.isFinite(n) ? n : 0;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function nowYear() {
  return new Date().getFullYear();
}

export function computeInflationAdjusted(amount: number, cpiYoY: number) {
  return safeNumber(amount) * (1 + safeNumber(cpiYoY));
}

export function computeBaselineCoverageRatio(
  guaranteedIncomeAnnualNet: number,
  baselineAnnualIndexed: number
) {
  const denom = Math.max(1, safeNumber(baselineAnnualIndexed));
  return safeNumber(guaranteedIncomeAnnualNet) / denom;
}

export function computeCashRunwayMonths(
  cashBalance: number,
  baselineAnnualIndexed: number,
  contingencyAnnual: number
) {
  const annualNeed = Math.max(
    1,
    safeNumber(baselineAnnualIndexed) + safeNumber(contingencyAnnual)
  );
  const months = (safeNumber(cashBalance) / annualNeed) * 12;
  return months;
}

export function computeDrawdownCompliance(
  superBalance: number,
  drawdownAnnual: number,
  minRequiredDrawdownRate: number
) {
  const minRequiredAmount =
    Math.max(0, safeNumber(superBalance)) *
    Math.max(0, safeNumber(minRequiredDrawdownRate));
  const minMet = safeNumber(drawdownAnnual) >= minRequiredAmount - 1e-6;

  return {
    minRequiredAmount,
    minMet,
  };
}

export function computeDiscretionaryTotals(
  discretionary: AppState["discretionary"]
) {
  const planned = discretionary.planned;
  const actual = discretionary.actual;

  const totalPlanned = planned.travel + planned.flying + planned.other;
  const totalActual = actual.travel + actual.flying + actual.other;

  // indexed total depends on CPI; we apply CPI elsewhere and pass indexedFactor in UI
  // so here we just keep the non-indexed sum for convenience
  return {
    totalPlanned,
    totalActual,
    // placeholder; computed in UI with factor
    totalPlannedIndexed: 0,
  };
}

export function computeTrafficForBaselineCoverage(ratio: number): Traffic {
  if (ratio >= 1.2) return "green";
  if (ratio >= 1.0) return "amber";
  return "red";
}

export function computeTrafficForCashRunway(months: number): Traffic {
  if (months >= 36) return "green";
  if (months >= 18) return "amber";
  return "red";
}

export function computeTrafficForDrawdownCompliance(drawdown: {
  minMet: boolean;
}): Traffic {
  return drawdown.minMet ? "green" : "red";
}

export function computeDiscretionarySlowFlag(risk: AppState["risk"]) {
  // Two ambers (or worse) => ON
  const vals: Traffic[] = [
    risk.baselineSafeUnderCrash,
    risk.discTolerableUnderBadRun,
    risk.cashRunwayImproving,
  ];
  const amberOrWorse = vals.filter((v) => v === "amber" || v === "red").length;
  return amberOrWorse >= 2;
}

export function formatCurrency(n: number) {
  const x = safeNumber(n);
  return x.toLocaleString(undefined, {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

export function formatMonths(n: number) {
  const m = Math.round(safeNumber(n));
  return `${m.toLocaleString()} mo`;
}
