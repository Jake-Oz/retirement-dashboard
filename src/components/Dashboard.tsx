"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppState,
  DEFAULT_STATE,
  DiscretionaryCategory,
  Phase,
  SpouseConfidence,
  Traffic,
} from "@/lib/types";
import {
  clamp,
  computeBaselineCoverageRatio,
  computeCashRunwayMonths,
  computeDrawdownCompliance,
  computeDiscretionaryTotals,
  computeInflationAdjusted,
  computeTrafficForBaselineCoverage,
  computeTrafficForCashRunway,
  computeTrafficForDrawdownCompliance,
  computeDiscretionarySlowFlag,
  formatCurrency,
  formatMonths,
  nowYear,
  safeNumber,
} from "@/lib/calc";
import { loadState, saveState } from "@/lib/storage";
import {
  Card,
  Section,
  StatTile,
  TrafficPill,
  TogglePill,
  Field,
  Small,
  Divider,
  Button,
} from "@/components/ui";

export default function Dashboard() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);

  // Load once
  useEffect(() => {
    const loaded = loadState();
    if (loaded) setState(loaded);
  }, []);

  // Persist
  useEffect(() => {
    saveState(state);
  }, [state]);

  const year = nowYear();

  const derived = useMemo(() => {
    const baselineIndexed = computeInflationAdjusted(
      state.baseline.baselineSpendAnnual,
      state.inflation.cpiYoY
    );

    const baselineCoverageRatio = computeBaselineCoverageRatio(
      state.income.guaranteedIncomeAnnualNet,
      baselineIndexed
    );

    const cashRunwayMonths = computeCashRunwayMonths(
      state.cash.cashBalance,
      baselineIndexed,
      state.cash.contingencyAnnual
    );

    const drawdown = computeDrawdownCompliance(
      state.super.superBalance,
      state.super.drawdownAnnual,
      state.super.minRequiredDrawdownRate
    );

    const discRaw = computeDiscretionaryTotals(state.discretionary);
    const indexedFactor = 1 + state.inflation.cpiYoY;
    const totalPlannedIndexed = discRaw.totalPlanned * indexedFactor;
    const disc = { ...discRaw, totalPlannedIndexed };

    const trafficBaseline = computeTrafficForBaselineCoverage(
      baselineCoverageRatio
    );
    const trafficCash = computeTrafficForCashRunway(cashRunwayMonths);
    const trafficDrawdown = computeTrafficForDrawdownCompliance(drawdown);

    const slowFlag = computeDiscretionarySlowFlag(state.risk);

    // hard rule: any red => discretionary expansion not allowed
    const anyRed =
      trafficBaseline === "red" ||
      trafficCash === "red" ||
      trafficDrawdown === "red" ||
      state.spouse.confidence === "red";

    return {
      baselineIndexed,
      baselineCoverageRatio,
      cashRunwayMonths,
      drawdown,
      disc,
      trafficBaseline,
      trafficCash,
      trafficDrawdown,
      slowFlag,
      anyRed,
    };
  }, [state]);

  const set = <K extends keyof AppState>(key: K, value: AppState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const setNested = <K extends keyof AppState, NK extends string>(
    key: K,
    nested: NK,
    value: any
  ) =>
    setState((s) => ({
      ...s,
      [key]: { ...(s[key] as any), [nested]: value },
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Retirement Spending Command Dashboard — v1.0
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {year} • Quarterly glance, annual decision • Stored locally in your
          browser
        </p>
        {derived.anyRed ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            <strong>LOCK:</strong> Discretionary expansion is disabled because a
            critical gate is red (system health or spouse confidence).
          </div>
        ) : null}
      </header>

      {/* SECTION A — SYSTEM HEALTH */}
      <Section
        title="A — System Health (Top Strip)"
        subtitle="If this row isn’t green, nothing else matters."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatTile
            title="Baseline Coverage Ratio"
            value={`${derived.baselineCoverageRatio.toFixed(2)}×`}
            target="≥ 1.20×"
            traffic={derived.trafficBaseline}
            detail={`${formatCurrency(
              state.income.guaranteedIncomeAnnualNet
            )} ÷ ${formatCurrency(derived.baselineIndexed)} (baseline indexed)`}
          />
          <StatTile
            title="Cash Runway"
            value={formatMonths(derived.cashRunwayMonths)}
            target="36–60 months"
            traffic={derived.trafficCash}
            detail={`${formatCurrency(
              state.cash.cashBalance
            )} cash vs baseline+contingency`}
          />
          <StatTile
            title="Super Drawdown Compliance"
            value={
              derived.drawdown.minMet
                ? derived.drawdown.excessIntentional
                  ? "Yes / Yes"
                  : "Yes / No"
                : "No"
            }
            target="Min met + excess intentional"
            traffic={derived.trafficDrawdown}
            detail={`Min required: ${(
              state.super.minRequiredDrawdownRate * 100
            ).toFixed(1)}% • Drawdown: ${formatCurrency(
              state.super.drawdownAnnual
            )}`}
          />
        </div>
      </Section>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* SECTION B — BASELINE LOCK */}
        <Card>
          <h2 className="text-base font-semibold">B — Baseline Lock</h2>
          <Small>
            Baseline must remain pension-funded under all market conditions.
          </Small>

          <Divider />

          <div className="space-y-3">
            <Field
              label="Baseline spend (annual, current $)"
              value={state.baseline.baselineSpendAnnual}
              onChange={(v) => setNested("baseline", "baselineSpendAnnual", v)}
              prefix="$"
            />
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  Baseline indexed (CPI YoY)
                </span>
                <span className="font-medium">
                  {formatCurrency(derived.baselineIndexed)}
                </span>
              </div>
            </div>
            <Field
              label="Guaranteed income (net annual)"
              value={state.income.guaranteedIncomeAnnualNet}
              onChange={(v) =>
                setNested("income", "guaranteedIncomeAnnualNet", v)
              }
              prefix="$"
            />
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Baseline margin (net)</span>
                <span className="font-medium">
                  {formatCurrency(
                    state.income.guaranteedIncomeAnnualNet -
                      derived.baselineIndexed
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION C — DISCRETIONARY REALITY */}
        <Card>
          <h2 className="text-base font-semibold">C — Discretionary Reality</h2>
          <Small>
            Planned (indexed) vs Actual. Variance must be classified.
          </Small>

          <Divider />

          <div className="space-y-3">
            <div>
              <div className="mb-1 text-sm font-medium">Current Phase</div>
              <div className="flex flex-wrap gap-2">
                {(["phase1", "phase2", "phase3"] as Phase[]).map((p) => (
                  <TogglePill
                    key={p}
                    label={
                      p === "phase1"
                        ? "Phase-1 Active"
                        : p === "phase2"
                        ? "Phase-2 Step-down"
                        : "Phase-3 Home-centred"
                    }
                    active={state.phase.current === p}
                    onClick={() => setNested("phase", "current", p)}
                  />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Field
                  label="Years remaining (min)"
                  value={state.phase.yearsRemainingMin}
                  onChange={(v) => setNested("phase", "yearsRemainingMin", v)}
                />
                <Field
                  label="Years remaining (max)"
                  value={state.phase.yearsRemainingMax}
                  onChange={(v) => setNested("phase", "yearsRemainingMax", v)}
                />
              </div>
              <Field
                label="Next trigger (plain words)"
                value={state.phase.nextTrigger}
                onChange={(v) => setNested("phase", "nextTrigger", v)}
                text
              />
            </div>

            <Divider />

            <DiscretionaryTable
              state={state}
              setState={setState}
              indexedFactor={1 + state.inflation.cpiYoY}
              lock={derived.anyRed}
            />

            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total planned (indexed)</span>
                <span className="font-medium">
                  {formatCurrency(derived.disc.totalPlannedIndexed)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600">Total actual</span>
                <span className="font-medium">
                  {formatCurrency(derived.disc.totalActual)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600">Variance</span>
                <span className="font-medium">
                  {formatCurrency(
                    derived.disc.totalActual - derived.disc.totalPlannedIndexed
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 p-3 text-sm">
              <div className="mb-2 font-medium">Variance classification</div>
              <div className="flex flex-wrap gap-2">
                <TogglePill
                  label="Intentional ✓"
                  active={state.discretionary.varianceType === "intentional"}
                  onClick={() =>
                    setNested("discretionary", "varianceType", "intentional")
                  }
                />
                <TogglePill
                  label="Drift ⚠"
                  active={state.discretionary.varianceType === "drift"}
                  onClick={() =>
                    setNested("discretionary", "varianceType", "drift")
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        {/* SECTION D — CASH VS SUPER */}
        <Card>
          <h2 className="text-base font-semibold">D — Cash vs Super Engine</h2>
          <Small>Cash absorbs volatility. Super buys time.</Small>

          <Divider />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Cash</h3>
            <Field
              label="Cash balance"
              value={state.cash.cashBalance}
              onChange={(v) => setNested("cash", "cashBalance", v)}
              prefix="$"
            />
            <Field
              label="Contingency budget (annual)"
              value={state.cash.contingencyAnnual}
              onChange={(v) => setNested("cash", "contingencyAnnual", v)}
              prefix="$"
            />

            <Divider />

            <h3 className="text-sm font-semibold">Super</h3>
            <Field
              label="Super balance"
              value={state.super.superBalance}
              onChange={(v) => setNested("super", "superBalance", v)}
              prefix="$"
            />
            <Field
              label="Annual drawdown ($)"
              value={state.super.drawdownAnnual}
              onChange={(v) => setNested("super", "drawdownAnnual", v)}
              prefix="$"
            />
            <Field
              label="Minimum required drawdown rate"
              value={state.super.minRequiredDrawdownRate}
              onChange={(v) => setNested("super", "minRequiredDrawdownRate", v)}
              suffix="%"
              percent
            />
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Minimum required ($)</span>
                <span className="font-medium">
                  {formatCurrency(derived.drawdown.minRequiredAmount)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-slate-600">Min met</span>
                <span className="font-medium">
                  {derived.drawdown.minMet ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <Divider />

            <h3 className="text-sm font-semibold">Excess drawdown</h3>
            <div className="flex flex-wrap gap-2">
              <TogglePill
                label="Intentional"
                active={state.super.excessDrawdownIntentional === true}
                onClick={() =>
                  setNested("super", "excessDrawdownIntentional", true)
                }
              />
              <TogglePill
                label="Accidental"
                active={state.super.excessDrawdownIntentional === false}
                onClick={() =>
                  setNested("super", "excessDrawdownIntentional", false)
                }
              />
            </div>
          </div>
        </Card>
      </div>

      {/* SECTION E */}
      <Section
        title="E — Inflation & Reality"
        subtitle="Nominal stability ≠ real stability."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">CPI (YoY)</div>
                <Small>Used to index baseline and planned discretionary.</Small>
              </div>
              <TrafficPill
                traffic="green"
                label={`${(state.inflation.cpiYoY * 100).toFixed(1)}%`}
              />
            </div>
            <Divider />
            <Field
              label="CPI YoY"
              value={state.inflation.cpiYoY}
              onChange={(v) => setNested("inflation", "cpiYoY", v)}
              suffix="%"
              percent
            />
          </Card>

          <Card>
            <div className="text-sm font-semibold">Real baseline change</div>
            <Small>
              Manual judgement: did baseline purchasing power rise, fall, or
              hold?
            </Small>
            <Divider />
            <div className="flex flex-wrap gap-2">
              {(["up", "flat", "down"] as const).map((x) => (
                <TogglePill
                  key={x}
                  label={x === "up" ? "↑" : x === "down" ? "↓" : "→"}
                  active={state.inflation.realBaselineSignal === x}
                  onClick={() =>
                    setNested("inflation", "realBaselineSignal", x)
                  }
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">
              Real discretionary change
            </div>
            <Small>
              Manual judgement: did discretionary life feel richer, poorer, or
              steady?
            </Small>
            <Divider />
            <div className="flex flex-wrap gap-2">
              {(["up", "flat", "down"] as const).map((x) => (
                <TogglePill
                  key={x}
                  label={x === "up" ? "↑" : x === "down" ? "↓" : "→"}
                  active={state.inflation.realDiscretionarySignal === x}
                  onClick={() =>
                    setNested("inflation", "realDiscretionarySignal", x)
                  }
                />
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* SECTION F/G/H */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-base font-semibold">F — Risk & Resilience</h2>
          <Small>
            Sequence risk sanity check. Two ambers = slow discretionary.
          </Small>
          <Divider />
          <RiskRow
            label="30% market fall tomorrow → baseline intact?"
            value={state.risk.baselineSafeUnderCrash}
            onChange={(v) => setNested("risk", "baselineSafeUnderCrash", v)}
          />
          <RiskRow
            label="3 bad years → discretionary tolerable?"
            value={state.risk.discTolerableUnderBadRun}
            onChange={(v) => setNested("risk", "discTolerableUnderBadRun", v)}
          />
          <RiskRow
            label="Cash runway improving?"
            value={state.risk.cashRunwayImproving}
            onChange={(v) => setNested("risk", "cashRunwayImproving", v)}
          />
          <Divider />
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Discretionary Slow Flag</div>
            <TrafficPill
              traffic={derived.slowFlag ? "amber" : "green"}
              label={derived.slowFlag ? "ON" : "OFF"}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">
            G — Capability Signals (Annual)
          </h2>
          <Small>
            Used to recommend pull-forward or stand-down. Not optimisation.
          </Small>
          <Divider />
          <SelectRow
            label="Long-haul travel"
            value={state.capability.longHaulTravel}
            options={["energising", "neutral", "taxing"]}
            onChange={(v) => setNested("capability", "longHaulTravel", v)}
          />
          <SelectRow
            label="Flying"
            value={state.capability.flying}
            options={["worthIt", "marginal", "sunset"]}
            onChange={(v) => setNested("capability", "flying", v)}
          />
          <SelectRow
            label="Complexity tolerance"
            value={state.capability.complexityTolerance}
            options={["high", "medium", "low"]}
            onChange={(v) => setNested("capability", "complexityTolerance", v)}
          />
        </Card>

        <Card>
          <h2 className="text-base font-semibold">
            H — Spouse Confidence (Gate)
          </h2>
          <Small>Red locks discretionary increases. Non-negotiable.</Small>
          <Divider />
          <div className="flex flex-wrap gap-2">
            {(["green", "amber", "red"] as SpouseConfidence[]).map((t) => (
              <TrafficPill
                key={t}
                traffic={t}
                label={
                  t === "green"
                    ? "Confident"
                    : t === "amber"
                    ? "Uneasy"
                    : "Stop & simplify"
                }
                active={state.spouse.confidence === t}
                onClick={() => setNested("spouse", "confidence", t)}
              />
            ))}
          </div>
          <Divider />
          <Field
            label="Notes (optional)"
            value={state.spouse.notes}
            onChange={(v) => setNested("spouse", "notes", v)}
            text
          />
        </Card>
      </div>

      {/* SECTION I */}
      <Section title="I — Annual Verdict" subtitle="Three sentences. No more.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card>
            <Field
              label="1) What worked"
              value={state.verdict.worked}
              onChange={(v) => setNested("verdict", "worked", v)}
              text
            />
          </Card>
          <Card>
            <Field
              label="2) What felt off"
              value={state.verdict.off}
              onChange={(v) => setNested("verdict", "off", v)}
              text
            />
          </Card>
          <Card>
            <Field
              label="3) One change for next year"
              value={state.verdict.change}
              onChange={(v) => setNested("verdict", "change", v)}
              text
            />
          </Card>
        </div>
      </Section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <div>
          <span className="font-medium text-slate-800">Published v1.0</span> •
          data stored in localStorage • no backend
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setState(DEFAULT_STATE);
              saveState(DEFAULT_STATE);
            }}
            variant="secondary"
          >
            Reset to defaults
          </Button>
          <Button
            onClick={() => {
              const json = JSON.stringify(state, null, 2);
              navigator.clipboard.writeText(json);
              alert("Copied state JSON to clipboard");
            }}
          >
            Copy JSON
          </Button>
        </div>
      </footer>
    </div>
  );
}

/** ---- Components inside file (small helpers) ---- */

function RiskRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Traffic;
  onChange: (v: Traffic) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="text-sm">{label}</div>
      <div className="flex gap-2">
        {(["green", "amber", "red"] as Traffic[]).map((t) => (
          <TrafficPill
            key={t}
            traffic={t}
            label={t === "green" ? "Yes" : t === "amber" ? "Maybe" : "No"}
            active={value === t}
            onClick={() => onChange(t)}
          />
        ))}
      </div>
    </div>
  );
}

function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="py-2">
      <div className="mb-1 text-sm font-medium">{label}</div>
      <select
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {humanize(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function humanize(x: string) {
  return x
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function DiscretionaryTable({
  state,
  setState,
  indexedFactor,
  lock,
}: {
  state: AppState;
  setState: (s: AppState) => void;
  indexedFactor: number;
  lock: boolean;
}) {
  const rows: { key: DiscretionaryCategory; label: string }[] = [
    { key: "travel", label: "Travel" },
    { key: "flying", label: "Flying" },
    { key: "other", label: "Other" },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <div className="grid grid-cols-4 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
        <div>Category</div>
        <div className="text-right">Planned</div>
        <div className="text-right">Planned (Indexed)</div>
        <div className="text-right">Actual</div>
      </div>

      {rows.map((r) => {
        const planned = state.discretionary.planned[r.key];
        const plannedIndexed = planned * indexedFactor;
        const actual = state.discretionary.actual[r.key];

        return (
          <div
            key={r.key}
            className="grid grid-cols-4 items-center gap-2 px-3 py-2 text-sm"
          >
            <div className="font-medium">{r.label}</div>

            <MoneyInput
              value={planned}
              disabled={lock}
              onChange={(v) =>
                setState({
                  ...state,
                  discretionary: {
                    ...state.discretionary,
                    planned: { ...state.discretionary.planned, [r.key]: v },
                  },
                })
              }
            />

            <div className="text-right tabular-nums">
              {formatCurrency(plannedIndexed)}
            </div>

            <MoneyInput
              value={actual}
              onChange={(v) =>
                setState({
                  ...state,
                  discretionary: {
                    ...state.discretionary,
                    actual: { ...state.discretionary.actual, [r.key]: v },
                  },
                })
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="text-right">
      <input
        type="number"
        inputMode="numeric"
        className={`w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-slate-400 ${
          disabled ? "opacity-60" : ""
        }`}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(safeNumber(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
