import { AppState, DEFAULT_STATE, DiscretionaryCategory } from "./types";

const KEY = "retirement_dashboard_state_v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceNumber(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function coerceString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function coerceBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function coerceTraffic(value: unknown, fallback: AppState["risk"]["baselineSafeUnderCrash"]) {
  return value === "green" || value === "amber" || value === "red"
    ? value
    : fallback;
}

function coercePhase(value: unknown, fallback: AppState["phase"]["current"]) {
  return value === "phase1" || value === "phase2" || value === "phase3"
    ? value
    : fallback;
}

function coerceVariance(value: unknown, fallback: AppState["discretionary"]["varianceType"]) {
  return value === "intentional" || value === "drift" ? value : fallback;
}

function coerceRealSignal(
  value: unknown,
  fallback: AppState["inflation"]["realBaselineSignal"]
) {
  return value === "up" || value === "flat" || value === "down" ? value : fallback;
}

function coerceCapability<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function coerceDiscretionaryRecord(
  value: unknown,
  fallback: Record<DiscretionaryCategory, number>
) {
  if (!isRecord(value)) return fallback;
  return {
    travel: coerceNumber(value.travel, fallback.travel),
    flying: coerceNumber(value.flying, fallback.flying),
    other: coerceNumber(value.other, fallback.other),
  };
}

function coerceAppState(value: unknown): AppState {
  if (!isRecord(value)) return DEFAULT_STATE;

  const baseline = isRecord(value.baseline)
    ? {
        baselineSpendAnnual: coerceNumber(
          value.baseline.baselineSpendAnnual,
          DEFAULT_STATE.baseline.baselineSpendAnnual
        ),
      }
    : DEFAULT_STATE.baseline;

  const income = isRecord(value.income)
    ? {
        guaranteedIncomeAnnualNet: coerceNumber(
          value.income.guaranteedIncomeAnnualNet,
          DEFAULT_STATE.income.guaranteedIncomeAnnualNet
        ),
      }
    : DEFAULT_STATE.income;

  const cash = isRecord(value.cash)
    ? {
        cashBalance: coerceNumber(
          value.cash.cashBalance,
          DEFAULT_STATE.cash.cashBalance
        ),
        contingencyAnnual: coerceNumber(
          value.cash.contingencyAnnual,
          DEFAULT_STATE.cash.contingencyAnnual
        ),
      }
    : DEFAULT_STATE.cash;

  const superState = isRecord(value.super)
    ? {
        superBalance: coerceNumber(
          value.super.superBalance,
          DEFAULT_STATE.super.superBalance
        ),
        drawdownAnnual: coerceNumber(
          value.super.drawdownAnnual,
          DEFAULT_STATE.super.drawdownAnnual
        ),
        minRequiredDrawdownRate: coerceNumber(
          value.super.minRequiredDrawdownRate,
          DEFAULT_STATE.super.minRequiredDrawdownRate
        ),
        excessDrawdownIntentional: coerceBoolean(
          value.super.excessDrawdownIntentional,
          DEFAULT_STATE.super.excessDrawdownIntentional
        ),
      }
    : DEFAULT_STATE.super;

  const discretionary = isRecord(value.discretionary)
    ? {
        planned: coerceDiscretionaryRecord(
          value.discretionary.planned,
          DEFAULT_STATE.discretionary.planned
        ),
        actual: coerceDiscretionaryRecord(
          value.discretionary.actual,
          DEFAULT_STATE.discretionary.actual
        ),
        varianceType: coerceVariance(
          value.discretionary.varianceType,
          DEFAULT_STATE.discretionary.varianceType
        ),
      }
    : DEFAULT_STATE.discretionary;

  const phase = isRecord(value.phase)
    ? {
        current: coercePhase(value.phase.current, DEFAULT_STATE.phase.current),
        yearsRemainingMin: coerceNumber(
          value.phase.yearsRemainingMin,
          DEFAULT_STATE.phase.yearsRemainingMin
        ),
        yearsRemainingMax: coerceNumber(
          value.phase.yearsRemainingMax,
          DEFAULT_STATE.phase.yearsRemainingMax
        ),
        nextTrigger: coerceString(
          value.phase.nextTrigger,
          DEFAULT_STATE.phase.nextTrigger
        ),
      }
    : DEFAULT_STATE.phase;

  const inflation = isRecord(value.inflation)
    ? {
        cpiYoY: coerceNumber(
          value.inflation.cpiYoY,
          DEFAULT_STATE.inflation.cpiYoY
        ),
        realBaselineSignal: coerceRealSignal(
          value.inflation.realBaselineSignal,
          DEFAULT_STATE.inflation.realBaselineSignal
        ),
        realDiscretionarySignal: coerceRealSignal(
          value.inflation.realDiscretionarySignal,
          DEFAULT_STATE.inflation.realDiscretionarySignal
        ),
      }
    : DEFAULT_STATE.inflation;

  const risk = isRecord(value.risk)
    ? {
        baselineSafeUnderCrash: coerceTraffic(
          value.risk.baselineSafeUnderCrash,
          DEFAULT_STATE.risk.baselineSafeUnderCrash
        ),
        discTolerableUnderBadRun: coerceTraffic(
          value.risk.discTolerableUnderBadRun,
          DEFAULT_STATE.risk.discTolerableUnderBadRun
        ),
        cashRunwayImproving: coerceTraffic(
          value.risk.cashRunwayImproving,
          DEFAULT_STATE.risk.cashRunwayImproving
        ),
      }
    : DEFAULT_STATE.risk;

  const capability = isRecord(value.capability)
    ? {
        longHaulTravel: coerceCapability(
          value.capability.longHaulTravel,
          ["energising", "neutral", "taxing"],
          DEFAULT_STATE.capability.longHaulTravel
        ),
        flying: coerceCapability(
          value.capability.flying,
          ["worthIt", "marginal", "sunset"],
          DEFAULT_STATE.capability.flying
        ),
        complexityTolerance: coerceCapability(
          value.capability.complexityTolerance,
          ["high", "medium", "low"],
          DEFAULT_STATE.capability.complexityTolerance
        ),
      }
    : DEFAULT_STATE.capability;

  const spouse = isRecord(value.spouse)
    ? {
        confidence: coerceTraffic(
          value.spouse.confidence,
          DEFAULT_STATE.spouse.confidence
        ),
        notes: coerceString(value.spouse.notes, DEFAULT_STATE.spouse.notes),
      }
    : DEFAULT_STATE.spouse;

  const verdict = isRecord(value.verdict)
    ? {
        worked: coerceString(value.verdict.worked, DEFAULT_STATE.verdict.worked),
        off: coerceString(value.verdict.off, DEFAULT_STATE.verdict.off),
        change: coerceString(value.verdict.change, DEFAULT_STATE.verdict.change),
      }
    : DEFAULT_STATE.verdict;

  return {
    baseline,
    income,
    cash,
    super: superState,
    discretionary,
    phase,
    inflation,
    risk,
    capability,
    spouse,
    verdict,
  };
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return coerceAppState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}
