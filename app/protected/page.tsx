import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { DeleteBillButton } from "@/components/delete-bill-button";
import { ChoresCard } from "@/components/chores-card";
import {
  Zap,
  Droplets,
  Wifi,
  Package,
  Plus,
  Receipt,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Pencil,
  Wallet,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { MetricStrip, type Metric } from "@/components/metric-strip";

type Bill = {
  id: string;
  type: "electric" | "water" | "net" | "other";
  title: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  note: string | null;
};

const typeConfig = {
  electric: {
    icon: Zap,
    label: "Điện",
    colorBg: "bg-amber-100 dark:bg-amber-950/60",
    colorText: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  water: {
    icon: Droplets,
    label: "Nước",
    colorBg: "bg-sky-100 dark:bg-sky-950/60",
    colorText: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  net: {
    icon: Wifi,
    label: "Internet",
    colorBg: "bg-purple-100 dark:bg-purple-950/60",
    colorText: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  other: {
    icon: Package,
    label: "Khác",
    colorBg: "bg-slate-100 dark:bg-slate-800",
    colorText: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(".0", "") + "M ₫";
  }
  if (amount >= 1_000) {
    return Math.round(amount / 1_000) + "K ₫";
  }
  return amount.toString() + " ₫";
}

function formatMoneyFull(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const userEmail = authData.claims.email as string;
  const userName = userEmail.split("@")[0];

  // Query tất cả hóa đơn của user
  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .order("due_date", { ascending: false });

  const allBills = (bills || []) as Bill[];

  // Tính toán số liệu
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthBills = allBills.filter((b) => {
    const d = new Date(b.due_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonth = thisMonthBills.reduce((sum, b) => sum + b.amount, 0);
  const totalElectric = thisMonthBills
    .filter((b) => b.type === "electric")
    .reduce((sum, b) => sum + b.amount, 0);
  const totalWater = thisMonthBills
    .filter((b) => b.type === "water")
    .reduce((sum, b) => sum + b.amount, 0);

  // Hóa đơn chưa đóng, sắp đến hạn (trong 7 ngày)
  const upcomingBills = allBills
    .filter((b) => !b.paid && daysUntil(b.due_date) <= 7)
    .sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    );

  const unpaidCount = allBills.filter((b) => !b.paid).length;
  const overdueBillsCount = allBills.filter(
    (b) => !b.paid && daysUntil(b.due_date) < 0,
  ).length;

  const kpiMetrics: Metric[] = [
    {
      id: "total-month",
      label: "Tổng chi tháng này",
      value: formatMoney(totalMonth),
      subtext: `${thisMonthBills.length} hóa đơn trong tháng`,
      icon: Receipt,
      color: "indigo",
      delta: { value: "+12%", direction: "up" },
    },
    {
      id: "electric",
      label: "Tiền điện",
      value: formatMoney(totalElectric),
      subtext: `${
        totalMonth > 0
          ? `${Math.round((totalElectric / totalMonth) * 100)}% tổng hóa đơn`
          : "Chưa phát sinh"
      }`,
      icon: Zap,
      color: "amber",
      delta: { value: "+8%", direction: "up" },
    },
    {
      id: "water",
      label: "Tiền nước",
      value: formatMoney(totalWater),
      subtext: "Sinh hoạt gia đình",
      icon: Droplets,
      color: "sky",
      delta: { value: "-3%", direction: "down" },
    },
    {
      id: "pending",
      label: "Cần thanh toán",
      value: `${upcomingBills.length} hóa đơn`,
      subtext: `${overdueBillsCount} hóa đơn quá hạn`,
      icon: AlertCircle,
      color: "red",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* HEADER GREETING BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Xin chào, {userName}
            </h1>
            <span className="inline-flex items-center justify-center p-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Theo dõi chi phí sinh hoạt và phân chia công việc gia đình trong tầm tay.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/protected/bills/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm hóa đơn mới</span>
          </Link>
        </div>
      </div>

      {/* 1. THẺ THỐNG KÊ TỔNG QUAN (METRIC STRIP) */}
      <MetricStrip metrics={kpiMetrics} />

      {/* 2. BÊN DƯỚI CHIA THÀNH 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* CỘT TRÁI (COL-7): DANH SÁCH HÓA ĐƠN */}
        <div id="bills" className="lg:col-span-7 space-y-6">
          {/* CẢNH BÁO HÓA ĐƠN SẮP ĐẾN HẠN (NẾU CÓ) */}
          {upcomingBills.length > 0 && (
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Hóa đơn sắp đến hạn ({upcomingBills.length})</span>
              </div>

              <div className="space-y-2.5">
                {upcomingBills.map((bill) => {
                  const days = daysUntil(bill.due_date);
                  const config = typeConfig[bill.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={bill.id}
                      className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs card-hover"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${config.colorBg} ${config.colorText} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {bill.title}
                          </div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {formatMoneyFull(bill.amount)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            days < 0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : days <= 2
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {days < 0
                            ? `Quá hạn ${Math.abs(days)} ngày`
                            : days === 0
                              ? "Hôm nay đến hạn"
                              : `Còn ${days} ngày`}
                        </span>
                        <MarkPaidButton billId={bill.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DANH SÁCH TẤT CẢ HÓA ĐƠN */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Danh sách Hóa đơn
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {allBills.length} hóa đơn đã ghi nhận
                  </p>
                </div>
              </div>

              <Link
                href="/protected/bills/new"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-spring btn-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm hóa đơn</span>
              </Link>
            </div>

            {allBills.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
                  Chưa có hóa đơn nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                  Bắt đầu thêm hóa đơn tiền điện, nước, internet hoặc các chi phí khác để dễ dàng theo dõi.
                </p>
                <Link
                  href="/protected/bills/new"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-spring"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo hóa đơn đầu tiên</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {allBills.map((bill) => {
                  const config = typeConfig[bill.type];
                  const Icon = config.icon;
                  const isUrgent = !bill.paid && daysUntil(bill.due_date) <= 3;

                  return (
                    <div
                      key={bill.id}
                      className={`group p-4 rounded-xl border transition-spring card-hover ${
                        isUrgent
                          ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
                          : bill.paid
                            ? "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800"
                            : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {/* Dòng 1: Icon + Tên + Badge trạng thái + Nút Đã đóng */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl ${config.colorBg} ${config.colorText} flex items-center justify-center shrink-0 shadow-xs`}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                {bill.title}
                              </span>
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${config.badge}`}
                              >
                                {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {bill.paid && bill.paid_date
                                  ? `Đã thanh toán ngày ${formatDate(bill.paid_date)}`
                                  : `Hạn đóng: ${formatDate(bill.due_date)}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              bill.paid
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {bill.paid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Đã thanh toán</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>Chưa đóng</span>
                              </>
                            )}
                          </span>

                          {!bill.paid && <MarkPaidButton billId={bill.id} />}
                        </div>
                      </div>

                      {/* Dòng 2: Số tiền & Actions */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {formatMoneyFull(bill.amount)}
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            href={`/protected/bills/${bill.id}/edit`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-spring"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Sửa</span>
                          </Link>
                          <DeleteBillButton billId={bill.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (COL-5): DANH SÁCH VIỆC NHÀ */}
        <div className="lg:col-span-5 space-y-6">
          <ChoresCard />
        </div>
      </div>
    </div>
  );
}
