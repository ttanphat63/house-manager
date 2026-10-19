"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
} from "lucide-react";
import { type Bill } from "@/types/database";
import { ChartCard } from "./chart-card";

interface ReportsClientProps {
  bills: Bill[];
}

function formatMoneyFull(amount: number): string {
  return Number(amount || 0).toLocaleString("vi-VN") + " ₫";
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value.toString();
};

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  return `T${parseInt(month, 10)}/${year}`;
}

export function ReportsClient({ bills }: ReportsClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const last6Months = useMemo(() => getLast6Months(), []);

  // 1. Monthly data for Line and Bar charts
  const monthlyChartData = useMemo(() => {
    const monthlyMap: Record<string, { total: number; count: number }> = {};
    last6Months.forEach((m) => {
      monthlyMap[m] = { total: 0, count: 0 };
    });

    bills.forEach((bill) => {
      const ym = bill.due_date?.slice(0, 7);
      if (ym && monthlyMap[ym]) {
        monthlyMap[ym].total += Number(bill.amount || 0);
        monthlyMap[ym].count += 1;
      }
    });

    return last6Months.map((ym) => ({
      monthKey: ym,
      month: formatMonthLabel(ym),
      total: monthlyMap[ym].total,
      count: monthlyMap[ym].count,
    }));
  }, [bills, last6Months]);

  // 2. Type breakdown data for Pie chart
  const typeData = useMemo(() => {
    const sums: Record<string, number> = {
      electric: 0,
      water: 0,
      net: 0,
      other: 0,
    };

    bills.forEach((b) => {
      if (sums[b.type] !== undefined) {
        sums[b.type] += Number(b.amount || 0);
      }
    });

    return [
      { name: "Điện", value: sums.electric, color: "#f59e0b" },
      { name: "Nước", value: sums.water, color: "#0ea5e9" },
      { name: "Internet", value: sums.net, color: "#a855f7" },
      { name: "Khác", value: sums.other, color: "#64748b" },
    ].filter((t) => t.value > 0);
  }, [bills]);

  if (bills.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">
          Chưa có dữ liệu báo cáo
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
          Thêm hóa đơn đầu tiên để xem biểu đồ phân tích chi tiêu
        </p>
        <Link
          href="/protected/bills/new"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hóa đơn mới</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CHART 1: LINE CHART — FULL WIDTH */}
      <ChartCard
        title="Xu hướng chi tiêu 6 tháng gần nhất"
        subtitle="Tổng chi phí hóa đơn sinh hoạt qua các tháng gần đây"
        icon={TrendingUp}
      >
        <div className="h-[300px] w-full">
          {!mounted ? (
            <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyChartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-slate-200 dark:stroke-slate-800"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "#cbd5e1" }}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [
                    formatMoneyFull(Number(value)),
                    "Tổng tiền",
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    color: "#f8fafc",
                    fontSize: "0.75rem",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                  }}
                  itemStyle={{ color: "#f8fafc", fontWeight: 600 }}
                  labelStyle={{
                    color: "#94a3b8",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#4f46e5" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </ChartCard>

      {/* 2-COLUMN GRID: PIE + BAR CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 2: PIE / DONUT CHART */}
        <ChartCard
          title="Cơ cấu chi phí theo loại"
          subtitle="Tỷ lệ phân bổ tiền điện, nước, internet và chi phí khác"
          icon={PieChartIcon}
        >
          <div className="h-[300px] w-full">
            {!mounted ? (
              <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : typeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu danh mục
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatMoneyFull(Number(value)),
                      "Chi phí",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#f8fafc",
                      fontSize: "0.75rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                    }}
                    itemStyle={{ color: "#f8fafc", fontWeight: 600 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium ml-1">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* CHART 3: BAR CHART */}
        <ChartCard
          title="So sánh chi tiêu qua các tháng"
          subtitle="Đối chiếu tổng chi phí hàng tháng"
          icon={BarChart3}
        >
          <div className="h-[300px] w-full">
            {!mounted ? (
              <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-slate-200 dark:stroke-slate-800"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      formatMoneyFull(Number(value)),
                      "Tổng chi",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      color: "#f8fafc",
                      fontSize: "0.75rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                    }}
                    itemStyle={{ color: "#f8fafc", fontWeight: 600 }}
                    labelStyle={{
                      color: "#94a3b8",
                      fontWeight: 600,
                      marginBottom: "0.25rem",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
