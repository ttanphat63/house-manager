"use client";

import { useState, useEffect, useMemo } from "react";
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
  Download,
  FileDown,
  Loader2,
} from "lucide-react";
import { exportToCsv } from "@/lib/export-csv";
import { type Bill } from "@/types/database";
import { ChartCard } from "./chart-card";
import { ReportPDF, type ReportPDFData, type ReportTypeBreakdown } from "./report-pdf";

interface ReportsClientProps {
  bills: Bill[];
  groupName?: string;
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

export function ReportsClient({ bills, groupName = "Gia đình" }: ReportsClientProps) {
  const [mounted, setMounted] = useState(false);
  const [PDFDownloadLink, setPDFDownloadLink] = useState<any>(null);

  // Mặc định chọn tháng hiện tại (YYYY-MM)
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);

  useEffect(() => {
    setMounted(true);
    // Dynamic import để tránh lỗi SSR trong Next.js
    import("@react-pdf/renderer").then((mod) => {
      setPDFDownloadLink(() => mod.PDFDownloadLink);
    });
  }, []);

  const last6Months = useMemo(() => getLast6Months(), []);

  // Danh sách các tháng có dữ liệu hoặc tháng hiện tại để chọn xuất báo cáo
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentYM);
    bills.forEach((b) => {
      const ym = b.due_date?.slice(0, 7);
      if (ym) set.add(ym);
    });
    return Array.from(set).sort().reverse();
  }, [bills, currentYM]);

  // Chuẩn bị dữ liệu PDF cho tháng được chọn
  const reportData = useMemo<ReportPDFData>(() => {
    const [yearStr, monthStr] = selectedMonth.split("-");
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);

    const monthBills = bills.filter((b) => b.due_date?.startsWith(selectedMonth));
    const totalMonth = monthBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const paidCount = monthBills.filter((b) => b.paid).length;
    const unpaidCount = monthBills.filter((b) => !b.paid).length;

    // Đảm bảo typeBreakdown có đủ 4 loại (kể cả khi value = 0)
    const sums: Record<string, number> = {
      electric: 0,
      water: 0,
      net: 0,
      other: 0,
    };

    monthBills.forEach((b) => {
      if (sums[b.type] !== undefined) {
        sums[b.type] += Number(b.amount || 0);
      } else {
        sums.other += Number(b.amount || 0);
      }
    });

    const typeBreakdown: ReportTypeBreakdown[] = [
      {
        name: "Tiền điện",
        value: sums.electric,
        percent: totalMonth > 0 ? (sums.electric / totalMonth) * 100 : 0,
      },
      {
        name: "Tiền nước",
        value: sums.water,
        percent: totalMonth > 0 ? (sums.water / totalMonth) * 100 : 0,
      },
      {
        name: "Internet",
        value: sums.net,
        percent: totalMonth > 0 ? (sums.net / totalMonth) * 100 : 0,
      },
      {
        name: "Chi phí khác",
        value: sums.other,
        percent: totalMonth > 0 ? (sums.other / totalMonth) * 100 : 0,
      },
    ];

    const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date());

    return {
      groupName,
      month: m,
      year: y,
      exportDate: todayFormatted,
      bills: monthBills.map((b) => ({
        id: b.id,
        title: b.title,
        type: b.type,
        amount: Number(b.amount || 0),
        due_date: b.due_date,
        paid: b.paid,
      })),
      totalMonth,
      paidCount,
      unpaidCount,
      typeBreakdown,
    };
  }, [bills, selectedMonth, groupName]);

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

  function handleExportMonthly() {
    exportToCsv(
      monthlyChartData,
      [
        { key: "month", header: "Tháng" },
        { key: "total", header: "Tổng chi (VNĐ)" },
        { key: "count", header: "Số hóa đơn" },
      ],
      "bao-cao-6-thang.csv"
    );
  }

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
      {/* EXPORT ACTION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 sm:px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Tháng báo cáo:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {availableMonths.map((ym) => {
              const [y, m] = ym.split("-");
              return (
                <option key={ym} value={ym}>
                  Tháng {parseInt(m, 10)}/{y}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* NÚT XUẤT PDF */}
          {mounted && PDFDownloadLink ? (
            <PDFDownloadLink
              document={<ReportPDF data={reportData} />}
              fileName={`bao-cao-thang-${reportData.month}-${reportData.year}.pdf`}
            >
              {({ loading }: { loading: boolean }) => (
                <button
                  type="button"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-1.5 rounded-lg transition-spring shadow-xs btn-press cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Xuất PDF</span>
                    </>
                  )}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-lg opacity-60"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang tải...</span>
            </button>
          )}

          {/* NÚT XUẤT CSV */}
          <button
            type="button"
            onClick={handleExportMonthly}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

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
