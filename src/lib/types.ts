export type Traffic = "green" | "amber" | "red";
export type Phase = "phase1" | "phase2" | "phase3";
export type SpouseConfidence = Traffic;

export type DiscretionaryCategory = "travel" | "flying" | "other";

export interface AppState {
  baseline: {
    baselineSpendAnnual: number;
  };
  income: {
    guaranteedIncomeAnnualNet: number;
  };
  cash: {
    cashBalance: number;
    contingencyAnnual: number;
  };
  super: {
    superBalance: number;
    drawdownAnnual: number;
    minRequiredDrawdownRate: number; // e.g. 0.04 = 4%
    excessDrawdownIntentional: boolean;
  };
  discretionary: {
    planned: Record<DiscretionaryCategory, number>;
    actual: Record<DiscretionaryCategory, number>;
    varianceType: "intentional" | "drift";
  };
  phase: {
    current: Phase;
    yearsRemainingMin: number;
    yearsRemainingMax: number;
    nextTrigger: string;
  };
  inflation: {
    cpiYoY: number; // e.g. 0.03 = 3%
    realBaselineSignal: "up" | "flat" | "down";
    realDiscretionarySignal: "up" | "flat" | "down";
  };
  risk: {
    baselineSafeUnderCrash: Traffic;
    discTolerableUnderBadRun: Traffic;
    cashRunwayImproving: Traffic;
  };
  capability: {
    longHaulTravel: "energising" | "neutral" | "taxing";
    flying: "worthIt" | "marginal" | "sunset";
    complexityTolerance: "high" | "medium" | "low";
  };
  spouse: {
    confidence: SpouseConfidence;
    notes: string;
  };
  verdict: {
    worked: string;
    off: string;
    change: string;
  };
}

export const DEFAULT_STATE: AppState = {
  baseline: {
    baselineSpendAnnual: 75000,
  },
  income: {
    guaranteedIncomeAnnualNet: 92000, // set net if you want; change anytime
  },
  cash: {
    cashBalance: 660000,
    contingencyAnnual: 15000,
  },
  super: {
    superBalance: 2060000,
    drawdownAnnual: 0,
    minRequiredDrawdownRate: 0.04,
    excessDrawdownIntentional: true,
  },
  discretionary: {
    planned: {
      travel: 40000,
      flying: 30000,
      other: 20000,
    },
    actual: {
      travel: 0,
      flying: 0,
      other: 0,
    },
    varianceType: "intentional",
  },
  phase: {
    current: "phase1",
    yearsRemainingMin: 6,
    yearsRemainingMax: 9,
    nextTrigger: "Flying ends ~8 years; overseas continues ~5",
  },
  inflation: {
    cpiYoY: 0.03,
    realBaselineSignal: "flat",
    realDiscretionarySignal: "flat",
  },
  risk: {
    baselineSafeUnderCrash: "green",
    discTolerableUnderBadRun: "amber",
    cashRunwayImproving: "amber",
  },
  capability: {
    longHaulTravel: "energising",
    flying: "worthIt",
    complexityTolerance: "medium",
  },
  spouse: {
    confidence: "green",
    notes: "",
  },
  verdict: {
    worked: "",
    off: "",
    change: "",
  },
};
