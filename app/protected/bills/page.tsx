import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Receipt, CheckCircle2, Clock, Wallet } from "lucide-react";
import { MetricStrip, type Metric } from "@/components/metric-strip";
import { BillsListClient } from "@/components/bills-list-client";
import { type Bill } from "@/types/database";
import { type BillSplitWithMember } from "@/components/bill-split-display";
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

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function BillsPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  // Fetch song song bills và bill_splits kèm members theo active group_id
  const [{ data: billsData }, { data: allSplitsData }] = await Promise.all([
    supabase
      .from("bills")
      .select("*")
      .eq("group_id", groupId)
      .order("due_date", { ascending: false }),
    supabase
      .from("bill_splits")
      .select("*, member:members(id, name, color, role)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true }),
  ]);

  const allBills = (billsData || []) as Bill[];

  // Group splits by bill_id
  const splitsByBill: Record<string, BillSplitWithMember[]> = {};
  (allSplitsData || []).forEach((split: any) => {
    if (!splitsByBill[split.bill_id]) splitsByBill[split.bill_id] = [];
    splitsByBill[split.bill_id].push(split as BillSplitWithMember);
  });

  // Tính 4 KPI metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthBills = allBills.filter((b) => {
    const d = new Date(b.due_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonth = thisMonthBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const paidCount = allBills.filter((b) => b.paid).length;
  const unpaidCount = allBills.filter((b) => !b.paid).length;
  const overdueCount = allBills.filter(
    (b) => !b.paid && daysUntil(b.due_date) < 0
  ).length;

  const kpiMetrics: Metric[] = [
    {
      id: "total-bills",
      label: "Tổng hóa đơn",
      value: `${allBills.length} hóa đơn`,
      subtext: "Toàn bộ lịch sử",
      icon: Receipt,
      color: "indigo",
    },
    {
      id: "paid-bills",
      label: "Đã đóng",
      value: `${paidCount} hóa đơn`,
      subtext: `${allBills.length > 0
          ? Math.round((paidCount / allBills.length) * 100)
          : 0
        }% hoàn thành`,
      icon: CheckCircle2,
      color: "sky",
    },
    {
      id: "unpaid-bills",
      label: "Chưa đóng",
      value: `${unpaidCount} hóa đơn`,
      subtext: `${overdueCount} hóa đơn quá hạn`,
      icon: Clock,
      color: unpaidCount > 0 ? "amber" : "indigo",
    },
    {
      id: "month-expense",
      label: "Tổng chi tháng này",
      value: formatMoney(totalMonth),
      subtext: `${thisMonthBills.length} hóa đơn tháng ${currentMonth + 1}`,
      icon: Wallet,
      color: "sky",
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
              Hóa đơn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý tất cả hóa đơn sinh hoạt
            </p>
          </div>
        </div>

        <Link
          href="/protected/bills/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hóa đơn mới</span>
        </Link>
      </div>

      {/* 4 KPI METRICS STRIP */}
      <MetricStrip metrics={kpiMetrics} />

      {/* BILLS LIST WITH SEARCH AND FILTERS */}
      <BillsListClient
        initialBills={allBills}
        splitsByBill={splitsByBill}
      />
    </div>
  );
}
