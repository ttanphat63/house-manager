import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface Delta {
  value: string;
  direction: "up" | "down" | "neutral";
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  subtext?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: "indigo" | "amber" | "sky" | "red";
  delta?: Delta;
}

export interface MetricStripProps {
  metrics: Metric[];
  className?: string;
}

const colorStyles = {
  indigo: {
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-600 dark:text-amber-400",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/60",
    text: "text-sky-600 dark:text-sky-400",
  },
  red: {
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-600 dark:text-rose-400",
  },
};

export function MetricStrip({ metrics, className = "" }: MetricStripProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 ${className}`}
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const color = metric.color ? colorStyles[metric.color] : colorStyles.indigo;

        return (
          <div
            key={metric.id}
            className="flex-1 p-5 md:p-6 flex items-start gap-4 min-w-0"
          >
            {/* LEFT: ICON */}
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color.bg} ${color.text}`}
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* RIGHT: CONTENT */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.6875rem] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
                  {metric.label}
                </span>

                {metric.delta && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                      metric.delta.direction === "up"
                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900"
                        : metric.delta.direction === "down"
                          ? "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900"
                          : "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {metric.delta.direction === "up" && (
                      <TrendingUp className="w-3 h-3" />
                    )}
                    {metric.delta.direction === "down" && (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {metric.delta.direction === "neutral" && (
                      <Minus className="w-3 h-3" />
                    )}
                    <span>{metric.delta.value}</span>
                  </span>
                )}
              </div>

              {/* VALUE */}
              <div className="text-2xl md:text-[1.75rem] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 tracking-tight mt-1 leading-tight truncate">
                {metric.value}
              </div>

              {/* SUBTEXT */}
              {metric.subtext && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {metric.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
