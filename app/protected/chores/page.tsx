import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { MetricStrip, type Metric } from "@/components/metric-strip";
import { ChoresListClient } from "@/components/chores-list-client";
import { type Chore, type Member } from "@/types/database";

function isTodayOrOverdue(chore: Chore): boolean {
  if (chore.done) return false;
  if (!chore.next_due) return false;
  const due = new Date(chore.next_due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() <= today.getTime();
}

export default async function ChoresPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const userId = authData.claims.sub as string;

  // Fetch song song chores và members
  const [{ data: choresData }, { data: membersData }] = await Promise.all([
    supabase
      .from("chores")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("id, name, color, role")
      .order("created_at", { ascending: true }),
  ]);

  const allChores = (choresData || []) as Chore[];
  const members = (membersData || []) as Pick<Member, "id" | "name" | "color">[];

  // Tính 4 KPI metrics
  const doneCount = allChores.filter((c) => c.done).length;
  const pendingCount = allChores.filter((c) => !c.done).length;
  const todayOrOverdueCount = allChores.filter(isTodayOrOverdue).length;
  const percentDone =
    allChores.length > 0 ? Math.round((doneCount / allChores.length) * 100) : 0;

  const kpiMetrics: Metric[] = [
    {
      id: "total-chores",
      label: "Tổng việc nhà",
      value: `${allChores.length} việc`,
      subtext: "Đã phân công",
      icon: CheckSquare,
      color: "indigo",
    },
    {
      id: "done-chores",
      label: "Đã hoàn thành",
      value: `${doneCount} việc`,
      subtext: `${percentDone}% hoàn thành`,
      icon: CheckCircle2,
      color: "sky",
    },
    {
      id: "pending-chores",
      label: "Chưa hoàn thành",
      value: `${pendingCount} việc`,
      subtext: "Đang chờ xử lý",
      icon: Clock,
      color: "amber",
    },
    {
      id: "today-overdue",
      label: "Hôm nay & Quá hạn",
      value: `${todayOrOverdueCount} việc`,
      subtext: todayOrOverdueCount > 0 ? "Cần ưu tiên xử lý" : "Đã xong việc gấp",
      icon: AlertCircle,
      color: todayOrOverdueCount > 0 ? "red" : "indigo",
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
              Việc nhà
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Phân chia trách nhiệm và theo dõi tiến độ công việc trong gia đình
            </p>
          </div>
        </div>
      </div>

      {/* METRIC STRIP (4 METRICS) */}
      <MetricStrip metrics={kpiMetrics} />

      {/* CHORES LIST & FILTERS */}
      <ChoresListClient
        initialChores={allChores}
        members={members}
        userId={userId}
      />
    </div>
  );
}
