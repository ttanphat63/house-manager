import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wallet, Receipt, TrendingUp, BarChart3 } from "lucide-react";
import { MetricStrip, type Metric } from "@/components/metric-strip";
import { ReportsClient } from "@/components/reports-client";
import { type Bill } from "@/types/database";
import { getActiveGroupId } from "@/lib/group-context";

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(".0", "") + "M ₫";
  }
  if (amount >= 1_000) {
    return Math.round(amount / 1_000) + "K ₫";
  }
  return amount.toString() + " ₫";
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  // Fetch tất cả hóa đơn theo active group_id
  const { data: billsData } = await supabase
    .from("bills")
    .select("*")
    .eq("group_id", groupId)
    .order("due_date", { ascending: true });

  const allBills = (billsData || []) as Bill[];

  // Tính toán số liệu thống kê
  const monthlySums: Record<string, number> = {};
  allBills.forEach((b) => {
    const ym = b.due_date?.slice(0, 7);
    if (ym) {
      monthlySums[ym] = (monthlySums[ym] || 0) + Number(b.amount || 0);
    }
  });

  const distinctMonths = Object.keys(monthlySums);
  const totalExpense = allBills.reduce(
    (sum, b) => sum + Number(b.amount || 0),
    0
  );
  const avgPerMonth =
    distinctMonths.length > 0
      ? Math.round(totalExpense / distinctMonths.length)
      : 0;

  // Tìm tháng có tổng chi lớn nhất
  let highestMonthText = "—";
  let highestMonthSubtext = "Chưa có dữ liệu";

  if (distinctMonths.length > 0) {
    let maxYM = distinctMonths[0];
    let maxTotal = monthlySums[maxYM];

    distinctMonths.forEach((ym) => {
      if (monthlySums[ym] > maxTotal) {
        maxTotal = monthlySums[ym];
        maxYM = ym;
      }
    });

    const [y, m] = maxYM.split("-");
    highestMonthText = formatMoney(maxTotal);
    highestMonthSubtext = `Tháng ${parseInt(m, 10)}/${y}`;
  }

  const kpiMetrics: Metric[] = [
    {
      id: "total-expense",
      label: "Tổng chi tiêu",
      value: formatMoney(totalExpense),
      subtext: `${allBills.length} hóa đơn đã ghi nhận`,
      icon: Wallet,
      color: "indigo",
    },
    {
      id: "avg-month",
      label: "Trung bình / tháng",
      value: formatMoney(avgPerMonth),
      subtext:
        distinctMonths.length > 0
          ? `Tính trên ${distinctMonths.length} tháng phát sinh`
          : "Chưa có dữ liệu",
      icon: Receipt,
      color: "sky",
    },
    {
      id: "highest-month",
      label: "Tháng cao nhất",
      value: highestMonthText,
      subtext: highestMonthSubtext,
      icon: TrendingUp,
      color: "amber",
    },
    {
      id: "total-bills-count",
      label: "Số hóa đơn",
      value: `${allBills.length} hóa đơn`,
      subtext: "Toàn bộ lịch sử",
      icon: BarChart3,
      color: "indigo",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* BREADCRUMB HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/protected"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press shrink-0"
            title="Quay lại Dashboard"
            aria-label="Quay lại Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Báo cáo & Thống kê
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Phân tích xu hướng chi tiêu sinh hoạt và cơ cấu tài chính gia đình
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI METRICS STRIP */}
      <MetricStrip metrics={kpiMetrics} />

      {/* RECHARTS VISUALIZATION */}
      <ReportsClient bills={allBills} />
    </div>
  );
}
