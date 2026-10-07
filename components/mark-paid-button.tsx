"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

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
      className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-emerald-400 text-white px-3 py-1.5 rounded-lg transition-spring shadow-sm hover:shadow"
    >
      {loading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Đang lưu...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã thanh toán</span>
        </>
      )}
    </button>
  );
}
