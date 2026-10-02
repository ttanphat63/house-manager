"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type BillType = "electric" | "water" | "net" | "other";

const typeOptions: { value: BillType; icon: string; label: string }[] = [
  { value: "electric", icon: "⚡", label: "Điện" },
  { value: "water", icon: "💧", label: "Nước" },
  { value: "net", icon: "🌐", label: "Net" },
  { value: "other", icon: "📦", label: "Khác" },
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
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 bg-gray-50 p-4 rounded-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/protected"
          className="text-gray-600 hover:text-gray-900 text-xl"
        >
          ←
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Sửa hóa đơn</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Loại hóa đơn <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`p-3 rounded-xl border-2 transition text-center ${
                  type === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="text-2xl mb-1">{opt.icon}</div>
                <div className="text-xs font-semibold text-gray-700">
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tên hóa đơn <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Số tiền (VNĐ) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          {amount && (
            <p className="text-xs text-gray-500 mt-1">
              = {Number(amount).toLocaleString("vi-VN")}đ
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Ngày đến hạn <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Ghi chú{" "}
            <span className="text-xs text-gray-400 font-normal">
              (tùy chọn)
            </span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            id="paid"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
            className="w-5 h-5 cursor-pointer"
          />
          <label
            htmlFor="paid"
            className="cursor-pointer text-sm text-gray-700"
          >
            Đánh dấu đã đóng
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:text-white/70 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Đang lưu..." : "CẬP NHẬT"}
          </button>
          <Link
            href="/protected"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition text-center"
          >
            Hủy
          </Link>
        </div>
      </form>
    </div>
  );
}
