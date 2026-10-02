"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MarkPaidButton({ billId }: { billId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    setLoading(true);

    const { error } = await supabase
      .from("bills")
      .update({
        paid: true,
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", billId);

    if (error) {
      setLoading(false);
      alert("Lỗi: " + error.message);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleMarkPaid}
      disabled={loading}
      className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-3 py-1.5 rounded-lg transition"
    >
      {loading ? "Đang lưu..." : "✅ Đã đóng"}
    </button>
  );
}
