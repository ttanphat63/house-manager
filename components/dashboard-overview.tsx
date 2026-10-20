"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Receipt, Zap, Droplets, ArrowRight, Eye } from "lucide-react";
import { type Bill } from "@/types/database";
import { MonthExpenseDetailModal } from "./month-expense-detail-modal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DashboardOverviewProps {
  /** Tổng chi tháng này (tất cả bills theo due_date) */
  totalMonth: number;
  /** Tiền điện tháng này */
  totalElectric: number;
  /** Tiền nước tháng này */
  totalWater: number;
  /** Delta % so tháng trước — null nếu tháng trước không có data */
  deltaTotal: number | null;
  deltaElectric: number | null;
  deltaWater: number | null;
  /** Số hóa đơn đã đóng trong tháng */
  paidCount: number;
  /** Tổng số hóa đơn trong tháng */
  totalCount: number;
  /** Tháng hiện tại dạng "T10/2026" */
  monthLabel: string;
  /** Danh sách hóa đơn tháng này */
  thisMonthBills: Bill[];
  /** Tổng số hóa đơn toàn bộ lịch sử */
  allBillsCount: number;
  /** Tháng hiện tại (0-11) */
  currentMonth: number;
  /** Năm hiện tại */
  currentYear: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return val % 1 === 0 ? `${val.toFixed(0)}M ₫` : `${val.toFixed(1)}M ₫`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}K ₫`;
  }
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Chào buổi sáng", emoji: "🌅" };
  if (hour < 18) return { text: "Chào buổi chiều", emoji: "☀️" };
  return { text: "Chào buổi tối", emoji: "🌙" };
}

function formatTodayLabel(): string {
  const d = new Date();
  const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const day = weekdays[d.getDay()];
  const date = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}, ${date}/${month}/${year}`;
}

// ─────────────────────────────────────────────
// Sub-component: Delta Badge
// ─────────────────────────────────────────────

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === undefined) return null;

  const isUp = delta > 0;
  const isNeutral = delta === 0;

  if (isNeutral) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md font-mono tabular-nums ${
        isUp
          ? "text-rose-700 bg-rose-100/80 dark:bg-rose-950/50 dark:text-rose-400"
          : "text-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/50 dark:text-emerald-400"
      }`}
    >
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? "+" : ""}
      {delta.toFixed(0)}%
    </span>
  );
}

// ─────────────────────────────────────────────
// Sub-component: Metric Block
// ─────────────────────────────────────────────

interface MetricBlockProps {
  label: string;
  value: React.ReactNode;
  delta: number | null;
  icon: React.ReactNode;
  iconBg: string;
  isFirst?: boolean;
  subtext?: string;
  tooltip?: string;
}

function MetricBlock({ label, value, delta, icon, iconBg, isFirst, subtext, tooltip }: MetricBlockProps) {
  return (
    <div
      className={`flex flex-col gap-2 pt-4 sm:pt-0 ${
        !isFirst
          ? "sm:pl-6 sm:border-l border-indigo-100/60 dark:border-indigo-900/30 border-t sm:border-t-0 border-indigo-100/60 dark:border-indigo-900/30"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <DeltaBadge delta={delta} />
      </div>
      <div>
        <div className="text-[0.6875rem] font-semibold tracking-wider uppercase text-indigo-400 dark:text-indigo-500">
          {label}
        </div>
        <div
          title={tooltip}
          className={`mt-0.5 leading-tight ${tooltip ? "cursor-help" : ""}`}
        >
          {value}
        </div>
        {subtext ? (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {subtext}
          </div>
        ) : delta !== null ? (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            so với tháng trước
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function DashboardOverview({
  totalMonth,
  totalElectric,
  totalWater,
  deltaTotal,
  deltaElectric,
  deltaWater,
  paidCount,
  totalCount,
  monthLabel,
  thisMonthBills,
  allBillsCount,
  currentMonth,
  currentYear,
}: DashboardOverviewProps) {
  const [greeting, setGreeting] = useState<{ text: string; emoji: string } | null>(null);
  const [todayLabel, setTodayLabel] = useState<string>("");
  const [showDetail, setShowDetail] = useState(false);

  // Hydration-safe: set greeting on client only
  useEffect(() => {
    setGreeting(getGreeting());
    setTodayLabel(formatTodayLabel());
  }, []);

  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;
  const allPaid = totalCount > 0 && paidCount === totalCount;

  const tooltipTotal = `Tổng chi phí các hóa đơn có hạn đóng trong tháng ${
    currentMonth + 1
  }/${currentYear}. Không bao gồm hóa đơn có hạn ở tháng khác (dù đã thanh toán sớm).`;
  const tooltipElectric = `Tổng tiền điện các hóa đơn có hạn đóng trong tháng ${
    currentMonth + 1
  }/${currentYear}`;
  const tooltipWater = `Tổng tiền nước các hóa đơn có hạn đóng trong tháng ${
    currentMonth + 1
  }/${currentYear}`;

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-lg shadow-indigo-100/40 dark:shadow-none border border-indigo-100/50 dark:border-indigo-900/30"
    >
      {/* ── GRADIENT HERO WRAPPER ── */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-amber-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-amber-950/20 p-6 sm:p-8">

        {/* ── HEADER ROW: Greeting + Month label + Link ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            {/* Greeting — client-rendered to avoid hydration mismatch */}
            <div className="flex items-center gap-2 mb-1">
              {greeting ? (
                <>
                  <span className="text-xl">{greeting.emoji}</span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                    {greeting.text}!
                  </h1>
                </>
              ) : (
                <div className="h-8 w-48 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              )}
            </div>
            {todayLabel ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{todayLabel}</p>
            ) : (
              <div className="h-4 w-36 rounded bg-slate-200/40 dark:bg-slate-800/40 animate-pulse mt-1" />
            )}
          </div>

          <div className="flex items-center gap-3 sm:text-right">
            <div>
              <div className="text-[0.6875rem] font-semibold tracking-widest uppercase text-indigo-400 dark:text-indigo-500 sm:text-right">
                Tổng quan tháng
              </div>
              <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                {monthLabel}
              </div>
            </div>
            <Link
              href="/protected/reports"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
            >
              <span>Xem báo cáo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* ── 3 METRICS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          <MetricBlock
            label="Tổng chi"
            value={
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                title={tooltipTotal}
                className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-baseline gap-1 group text-left"
              >
                <span>{formatMoney(totalMonth)}</span>
                <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
              </button>
            }
            subtext={`${thisMonthBills.length}/${allBillsCount} hóa đơn có hạn trong tháng`}
            tooltip={tooltipTotal}
            delta={deltaTotal}
            isFirst
            iconBg="bg-indigo-100 dark:bg-indigo-950/60"
            icon={<Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          />
          <MetricBlock
            label="Tiền điện"
            value={
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {formatMoney(totalElectric)}
              </div>
            }
            tooltip={tooltipElectric}
            delta={deltaElectric}
            iconBg="bg-amber-100 dark:bg-amber-950/60"
            icon={<Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
          />
          <MetricBlock
            label="Tiền nước"
            value={
              <div className="text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
                {formatMoney(totalWater)}
              </div>
            }
            tooltip={tooltipWater}
            delta={deltaWater}
            iconBg="bg-sky-100 dark:bg-sky-950/60"
            icon={<Droplets className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
          />
        </div>

        {/* ── PROGRESS BAR: Hóa đơn đã đóng ── */}
        {totalCount > 0 && (
          <div className="mt-6 pt-5 border-t border-indigo-100/60 dark:border-indigo-900/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {allPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    🎉 Tuyệt vời — tất cả hóa đơn tháng này đã đóng!
                  </span>
                ) : (
                  "Tiến độ đóng hóa đơn tháng này"
                )}
              </span>
              <span className="text-xs font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {paidCount}/{totalCount} ({paidPercent}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-indigo-100/70 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  allPaid
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : "bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600"
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <MonthExpenseDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        totalMonth={totalMonth}
        thisMonthBills={thisMonthBills}
        month={currentMonth + 1}
        year={currentYear}
      />
    </div>
  );
}
