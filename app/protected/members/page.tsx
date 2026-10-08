import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Receipt, AlertCircle, Wallet } from "lucide-react";
import { MetricStrip, type Metric } from "@/components/metric-strip";
import { MembersClient } from "@/components/members-client";
import { type Member } from "@/types/database";

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(".0", "") + "M ₫";
  }
  if (amount >= 1_000) {
    return Math.round(amount / 1_000) + "K ₫";
  }
  return amount.toString() + " ₫";
}

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const userId = authData.claims.sub as string;

  // Tính ngày đầu tiên của tháng hiện tại (YYYY-MM-01)
  const now = new Date();
  const firstDayOfMonth = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), 1)
  )
    .toISOString()
    .split("T")[0];

  // Truy vấn song song members và bills trong tháng (Adjustment 1)
  const [{ data: membersData }, { data: billsData }] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("bills")
      .select("amount, due_date")
      .gte("due_date", firstDayOfMonth),
  ]);

  const members = (membersData || []) as Member[];
  const bills = billsData || [];

  const totalMonth = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const memberCount = members.length;
  const avgPerMember = memberCount > 0 ? Math.round(totalMonth / memberCount) : 0;

  const kpiMetrics: Metric[] = [
    {
      id: "total-members",
      label: "Tổng thành viên",
      value: `${memberCount} người`,
      subtext: "Đang sinh hoạt chung",
      icon: Users,
      color: "indigo",
    },
    {
      id: "month-expense",
      label: "Tổng chi tháng này",
      value: formatMoney(totalMonth),
      subtext: `${bills.length} hóa đơn trong tháng`,
      icon: Receipt,
      color: "amber",
    },
    {
      id: "unpaid-splits",
      label: "Nợ chưa thanh toán",
      value: "0 ₫",
      subtext: "Chưa có nợ phát sinh",
      icon: AlertCircle,
      color: "sky",
    },
    {
      id: "avg-per-member",
      label: "Chi tiêu trung bình",
      value: formatMoney(avgPerMember),
      subtext: "Mỗi người / tháng",
      icon: Wallet,
      color: "indigo",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* BREADCRUMB HEADER */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
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
            Thành viên gia đình
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Quản lý danh sách người thân, phân chia chi phí sinh hoạt và công việc nhà
          </p>
        </div>
      </div>

      {/* METRIC STRIP (4 METRICS) */}
      <MetricStrip metrics={kpiMetrics} />

      {/* MEMBERS LIST & GRID */}
      <MembersClient initialMembers={members} userId={userId} />
    </div>
  );
}
