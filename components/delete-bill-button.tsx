"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteBillButton({ billId }: { billId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setLoading(true);

    const { error } = await supabase.from("bills").delete().eq("id", billId);

    if (error) {
      setLoading(false);
      alert("Lỗi: " + error.message);
      return;
    }

    setShowConfirm(false);
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs font-semibold text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition"
      >
        🗑️ Xóa
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🗑️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Xóa hóa đơn này?
              </h3>
              <p className="text-sm text-gray-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 font-semibold py-2.5 rounded-lg transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {loading ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
