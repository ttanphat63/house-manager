"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Zap,
  Droplets,
  Wifi,
  Package,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

type BillType = "electric" | "water" | "net" | "other";

const typeOptions: {
  value: BillType;
  icon: typeof Zap;
  label: string;
  activeColor: string;
}[] = [
  { value: "electric", icon: Zap, label: "Điện", activeColor: "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600" },
  { value: "water", icon: Droplets, label: "Nước", activeColor: "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600" },
  { value: "net", icon: Wifi, label: "Internet", activeColor: "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-600" },
  { value: "other", icon: Package, label: "Khác", activeColor: "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600" },
];

export default function EditBillPage() {
  const router = useRouter();
  const params = useParams();
  const billId = params.id as string;
  const supabase = createClient();

  const [type, setType] = useState<BillType>("electric");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dữ liệu cũ khi vào trang
  useEffect(() => {
    async function loadBill() {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("id", billId)
        .single();

      if (error || !data) {
        setError("Không tìm thấy hóa đơn");
        setLoadingData(false);
        return;
      }

      setType(data.type);
      setTitle(data.title);
      setAmount(data.amount.toString());
      setDueDate(data.due_date);
      setNote(data.note || "");
      setPaid(data.paid);
      setLoadingData(false);
    }

    loadBill();
  }, [billId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Vui lòng nhập tên hóa đơn");
      return;
    }
    const amountNum = Number(amount.replace(/[^0-9]/g, ""));
    if (!amountNum || amountNum <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    if (!dueDate) {
      setError("Vui lòng chọn ngày đến hạn");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase
      .from("bills")
      .update({
        type,
        title: title.trim(),
        amount: amountNum,
        due_date: dueDate,
        note: note.trim() || null,
        paid,
        paid_date: paid ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", billId);

    if (updateError) {
      setLoading(false);
      setError("Lỗi khi lưu: " + updateError.message);
      return;
    }

    router.push("/protected");
    router.refresh();
  }

  if (loadingData) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-12">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span>Đang tải thông tin hóa đơn...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/protected"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Cập nhật hóa đơn
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chỉnh sửa chi tiết khoản phí gia đình
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Loại hóa đơn <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {typeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`p-3.5 rounded-xl border-2 transition-spring text-center flex flex-col items-center gap-2 ${
                      isSelected
                        ? opt.activeColor + " shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Tên hóa đơn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Số tiền (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
            {amount && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                = {Number(amount).toLocaleString("vi-VN")} ₫
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Ngày đến hạn <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Ghi chú{" "}
              <span className="text-[11px] text-slate-400 font-normal">
                (tùy chọn)
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-spring"
            />
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <input
              type="checkbox"
              id="paid"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="paid"
              className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Đánh dấu đã thanh toán hóa đơn này
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/30 btn-press"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Cập nhật</span>
                </>
              )}
            </button>
            <Link
              href="/protected"
              className="flex-1 text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-spring btn-press"
            >
              Hủy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
