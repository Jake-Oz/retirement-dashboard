"use client";

import { ReactNode } from "react";
import { Traffic } from "@/lib/types";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {children}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle ? (
            <p className="text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function Divider() {
  return <div className="my-3 h-px bg-slate-200" />;
}

export function Small({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-slate-600">{children}</p>;
}

export function StatTile({
  title,
  value,
  target,
  traffic,
  detail,
}: {
  title: string;
  value: string;
  target: string;
  traffic: Traffic;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {value}
          </div>
          <div className="mt-1 text-xs text-slate-600">Target: {target}</div>
        </div>
        <TrafficPill traffic={traffic} label={traffic.toUpperCase()} />
      </div>
      {detail ? (
        <div className="mt-2 text-xs text-slate-600">{detail}</div>
      ) : null}
    </div>
  );
}

export function TrafficPill({
  traffic,
  label,
  active,
  onClick,
}: {
  traffic: Traffic;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold select-none";
  const colors =
    traffic === "green"
      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
      : traffic === "amber"
      ? "bg-amber-100 text-amber-900 border border-amber-200"
      : "bg-red-100 text-red-900 border border-red-200";

  const clickable = onClick ? "cursor-pointer hover:opacity-90" : "";
  const ring = active ? "ring-2 ring-slate-400" : "";

  return (
    <span
      className={`${base} ${colors} ${clickable} ${ring}`}
      onClick={onClick}
    >
      {label}
    </span>
  );
}

export function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  text,
  percent,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  prefix?: string;
  suffix?: string;
  text?: boolean;
  percent?: boolean;
}) {
  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400";
  const wrapper = "grid grid-cols-1 gap-1";

  if (text) {
    return (
      <div className={wrapper}>
        <div className="text-sm font-medium">{label}</div>
        <textarea
          className={`${inputClass} min-h-[90px] resize-y`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const displayed =
    percent && typeof value === "number"
      ? (value * 100).toString()
      : String(value ?? "");

  return (
    <div className={wrapper}>
      <div className="text-sm font-medium">{label}</div>
      <div className="flex items-center gap-2">
        {prefix ? (
          <span className="text-sm text-slate-600">{prefix}</span>
        ) : null}
        <input
          className={inputClass}
          type="number"
          inputMode="decimal"
          value={displayed}
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : Number(raw);
            onChange(percent ? n / 100 : n);
          }}
        />
        {suffix ? (
          <span className="text-sm text-slate-600">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
      : "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50";
  return (
    <button type="button" className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
