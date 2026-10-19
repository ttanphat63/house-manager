"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingUp, ArrowRight } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface MonthlyDataPoint {
  /** Display label, e.g. "T10/2026" */
  month: string;
  /** Short label for x-axis, e.g. "T10" */
  shortMonth: string;
  /** Total amount (VND) */
  total: number;
}

export interface DashboardMiniChartProps {
  data: MonthlyDataPoint[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatMoneyFull(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ₫`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K ₫`;
  }
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

// ─────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900/95 dark:bg-slate-800/95 border border-slate-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="font-bold font-mono tabular-nums text-indigo-300">
        {formatMoneyFull(Number(payload[0].value))}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function DashboardMiniChart({ data }: DashboardMiniChartProps) {
  const [mounted, setMounted] = useState(false);

  // SSR hydration safety — same pattern as reports-client.tsx
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine trend: compare last month vs second-to-last
  const trendInfo = useMemo(() => {
    if (data.length < 2) return null;
    const last = data[data.length - 1].total;
    const prev = data[data.length - 2].total;
    if (prev === 0) return null;
    const delta = Math.round(((last - prev) / prev) * 100);
    return { delta, isUp: delta > 0 };
  }, [data]);

  const hasData = data.some((d) => d.total > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">

      {/* ── HEADER ── */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Chi tiêu 6 tháng gần nhất
            </h3>
            {trendInfo && (
              <p
                className={`text-[11px] font-semibold font-mono tabular-nums ${
                  trendInfo.isUp
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {trendInfo.isUp ? "↗" : "↘"}{" "}
                {trendInfo.isUp ? "+" : ""}
                {trendInfo.delta}% so với tháng trước
              </p>
            )}
          </div>
        </div>

        <Link
          href="/protected/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
        >
          <span>Báo cáo đầy đủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── CHART AREA ── */}
      <div className="px-2 pb-3">
        {!mounted ? (
          /* Skeleton while hydrating */
          <div className="h-[120px] rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse mx-3 mb-1" />
        ) : !hasData ? (
          /* Empty state */
          <div className="h-[120px] flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
            Chưa có dữ liệu chi tiêu
          </div>
        ) : (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="miniChartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>

                {/* Subtle X-axis showing month labels only */}
                <XAxis
                  dataKey="shortMonth"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#6366f1",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                    opacity: 0.4,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#miniChartGradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#6366f1",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
