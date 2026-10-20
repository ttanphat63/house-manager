import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getActiveGroupId } from "@/lib/group-context";

import { DashboardOverview } from "@/components/dashboard-overview";
import { BillsActionableCard } from "@/components/bills-actionable-card";
import { DashboardMiniChart, type MonthlyDataPoint } from "@/components/dashboard-mini-chart";
import { ChoresCard } from "@/components/chores-card";
import { type BillSplitWithMember } from "@/components/bill-split-display";
import { type Bill, type Member, type Chore } from "@/types/database";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function calcDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function getLast6Months(): { key: string; label: string; shortLabel: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const monthNum = d.getMonth() + 1;
    result.push({
      key: `${yyyy}-${mm}`,
      label: `T${monthNum}/${yyyy}`,
      shortLabel: `T${monthNum}`,
    });
  }
  return result;
}

function formatMonthLabel(date: Date): string {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  const userEmail = authData.claims.email as string;
  const userName = userEmail.split("@")[0];

  // ── Fetch all data in parallel filtered by active group_id ──
  const [{ data: bills }, { data: allSplits }, { data: choresData }, { data: membersData }] =
    await Promise.all([
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
      supabase
        .from("chores")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false }),
      supabase
        .from("members")
        .select("id, name, color, role")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true }),
    ]);

  const allBills = (bills || []) as Bill[];
  const dashboardChores = (choresData || []) as Chore[];
  const dashboardMembers = (membersData || []) as Pick<Member, "id" | "name" | "color" | "role">[];

  // ── Build splitsByBill map ──
  const splitsByBill: Record<string, BillSplitWithMember[]> = {};
  (allSplits || []).forEach((split: any) => {
    if (!splitsByBill[split.bill_id]) splitsByBill[split.bill_id] = [];
    splitsByBill[split.bill_id].push(split as BillSplitWithMember);
  });

  // ── Date context ──
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  // ── Filter bills by month ──
  const thisMonthBills = allBills.filter((b) => {
    const d = new Date(b.due_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const prevMonthBills = allBills.filter((b) => {
    const d = new Date(b.due_date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  // ── This month totals ──
  const totalMonth = thisMonthBills.reduce((sum, b) => sum + b.amount, 0);
  const totalElectric = thisMonthBills
    .filter((b) => b.type === "electric")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalWater = thisMonthBills
    .filter((b) => b.type === "water")
    .reduce((sum, b) => sum + b.amount, 0);

  // ── Previous month totals ──
  const prevTotalMonth = prevMonthBills.reduce((sum, b) => sum + b.amount, 0);
  const prevTotalElectric = prevMonthBills
    .filter((b) => b.type === "electric")
    .reduce((sum, b) => sum + b.amount, 0);
  const prevTotalWater = prevMonthBills
    .filter((b) => b.type === "water")
    .reduce((sum, b) => sum + b.amount, 0);

  // ── Delta % (null nếu tháng trước không có data) ──
  const deltaTotal = calcDelta(totalMonth, prevTotalMonth);
  const deltaElectric = calcDelta(totalElectric, prevTotalElectric);
  const deltaWater = calcDelta(totalWater, prevTotalWater);

  // ── Progress: paid bills this month ──
  const paidCount = thisMonthBills.filter((b) => b.paid).length;
  const totalCount = thisMonthBills.length;

  // ── Unpaid bills for actionable card (sorted by due_date asc, top 3) ──
  const allUnpaidBills = allBills.filter((b) => !b.paid);
  const unpaidBills = [...allUnpaidBills]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3);

  // ── 6-month sparkline data ──
  const last6Months = getLast6Months();
  const monthlyMap: Record<string, number> = {};
  last6Months.forEach((m) => { monthlyMap[m.key] = 0; });
  allBills.forEach((b) => {
    const ym = b.due_date?.slice(0, 7);
    if (ym && monthlyMap[ym] !== undefined) {
      monthlyMap[ym] += b.amount;
    }
  });
  const chartData: MonthlyDataPoint[] = last6Months.map((m) => ({
    month: m.label,
    shortMonth: m.shortLabel,
    total: monthlyMap[m.key],
  }));

  // ── Month label ──
  const monthLabel = formatMonthLabel(now);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── TOPBAR: Add bill button ── */}
      <div className="flex items-center justify-end">
        <Link
          href="/protected/bills/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-indigo-600/25"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hóa đơn</span>
        </Link>
      </div>

      {/* ── A: Hero Section "Tổng quan tháng" ── */}
      <DashboardOverview
        totalMonth={totalMonth}
        totalElectric={totalElectric}
        totalWater={totalWater}
        deltaTotal={deltaTotal}
        deltaElectric={deltaElectric}
        deltaWater={deltaWater}
        paidCount={paidCount}
        totalCount={totalCount}
        monthLabel={monthLabel}
        thisMonthBills={thisMonthBills}
        allBillsCount={allBills.length}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* ── B: 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Hóa đơn cần xử lý */}
        <div className="lg:col-span-7">
          <BillsActionableCard
            bills={unpaidBills}
            splitsByBill={splitsByBill}
            totalUnpaidCount={allUnpaidBills.length}
          />
        </div>

        {/* Cột phải: Việc nhà hôm nay */}
        <div className="lg:col-span-5">
          <ChoresCard chores={dashboardChores} members={dashboardMembers} />
        </div>
      </div>

      {/* ── C: Mini Sparkline Chart ── */}
      <DashboardMiniChart data={chartData} />
    </div>
  );
}
