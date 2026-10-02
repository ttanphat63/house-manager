import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { DeleteBillButton } from "@/components/delete-bill-button";

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
  electric: { icon: "⚡", label: "Điện", color: "text-amber-600" },
  water: { icon: "💧", label: "Nước", color: "text-blue-600" },
  net: { icon: "🌐", label: "Net", color: "text-purple-600" },
  other: { icon: "📦", label: "Khác", color: "text-gray-600" },
};

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(".0", "") + "M";
  }
  if (amount >= 1_000) {
    return Math.round(amount / 1_000) + "K";
  }
  return amount.toString();
}

function formatMoneyFull(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
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

  // Tính toán
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

  // 5 hóa đơn gần đây
  const recentBills = allBills.slice(0, 5);

  return (
    <div className="flex-1 w-full flex flex-col gap-6 bg-gray-50 p-4 rounded-2xl">
      {/* LỜI CHÀO */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {userName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Hôm nay là {now.toLocaleDateString("vi-VN")}
        </p>
      </div>

      {/* THẺ TÓM TẮT */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl mb-1">💰</div>
          <div className="font-bold text-gray-900">
            {formatMoney(totalMonth)}
          </div>
          <div className="text-xs text-gray-500">Tổng tháng</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl mb-1">⚡</div>
          <div className="font-bold text-gray-900">
            {formatMoney(totalElectric)}
          </div>
          <div className="text-xs text-gray-500">Tiền điện</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="text-2xl mb-1">💧</div>
          <div className="font-bold text-gray-900">
            {formatMoney(totalWater)}
          </div>
          <div className="text-xs text-gray-500">Tiền nước</div>
        </div>
      </div>

      {/* VIỆC NHÀ HÔM NAY - giữ nguyên demo */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold flex items-center gap-2">
            ✅ Việc nhà hôm nay
          </h2>
          <span className="text-sm opacity-90">3/5 việc</span>
        </div>
        <div className="h-2 bg-white/25 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: "60%" }}
          ></div>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 opacity-70">
            <span>✓</span>
            <span className="line-through flex-1">Đổ rác</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Nam
            </span>
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <span>✓</span>
            <span className="line-through flex-1">Rửa bát</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Linh
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>○</span>
            <span className="flex-1">Tưới cây ban công</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              Nam
            </span>
          </div>
        </div>
      </div>

      {/* HÓA ĐƠN SẮP ĐẾN HẠN */}
      {upcomingBills.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
            ⚠️ Hóa đơn sắp đến hạn
          </h2>
          <div className="space-y-2">
            {upcomingBills.map((bill) => {
              const days = daysUntil(bill.due_date);
              const config = typeConfig[bill.type];
              return (
                <div
                  key={bill.id}
                  className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-3 flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <div>
                      <div className="font-semibold text-amber-800 text-sm">
                        {bill.title}
                      </div>
                      <div className="font-bold text-amber-900 text-xs">
                        {formatMoneyFull(bill.amount)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        days < 0
                          ? "text-red-700"
                          : days <= 2
                            ? "text-red-600"
                            : "text-amber-700"
                      }`}
                    >
                      {days < 0
                        ? `Quá ${Math.abs(days)} ngày`
                        : `Còn ${days} ngày`}
                    </span>
                    <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                      💳 Trả ngay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HÓA ĐƠN GẦN ĐÂY */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            📋 Hóa đơn gần đây
          </h2>
          <Link href="#" className="text-xs text-blue-600 font-semibold">
            Xem tất cả →
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
            📭 Chưa có hóa đơn nào
          </div>
        ) : (
          <div className="space-y-2">
            {recentBills.map((bill) => {
              const config = typeConfig[bill.type];
              return (
                <div
                  key={bill.id}
                  className={`bg-white border rounded-xl p-4 ${
                    !bill.paid && daysUntil(bill.due_date) <= 3
                      ? "border-red-300"
                      : !bill.paid
                        ? "border-amber-300"
                        : "border-gray-200"
                  }`}
                >
                  {/* Dòng 1: Tên + Badge + Nút đã đóng */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                      <span>{config.icon}</span>
                      {bill.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          bill.paid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bill.paid ? "✅ Đã đóng" : "⏳ Chưa đóng"}
                      </span>
                      {!bill.paid && <MarkPaidButton billId={bill.id} />}
                    </div>
                  </div>

                  {/* Dòng 2: Số tiền + Ngày */}
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {formatMoneyFull(bill.amount)}
                    </span>
                    <span>
                      {bill.paid && bill.paid_date
                        ? `Đã đóng ${formatDate(bill.paid_date)}`
                        : `Đến hạn ${formatDate(bill.due_date)}`}
                    </span>
                  </div>

                  {/* Dòng 3: Nút Sửa */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Link
                      href={`/protected/bills/${bill.id}/edit`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-50 transition"
                    >
                      ✏️ Sửa
                    </Link>
                    <DeleteBillButton billId={bill.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NÚT HÀNH ĐỘNG */}
      <div className="flex gap-3">
        <Link
          href="/protected/bills/new"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-center"
        >
          + Thêm hóa đơn
        </Link>
        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition">
          Xem tất cả
        </button>
      </div>
    </div>
  );
}
