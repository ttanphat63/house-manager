"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colorMap } from "@/lib/color-map";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { type BillSplit, type Member } from "@/types/database";

export type BillSplitWithMember = Omit<BillSplit, "member"> & {
  member: Pick<Member, "id" | "name" | "color" | "role">;
};

export interface BillSplitDisplayProps {
  splits: BillSplitWithMember[];
  billPaid: boolean;
}

export function BillSplitDisplay({ splits, billPaid }: BillSplitDisplayProps) {
  const [loadingSplitId, setLoadingSplitId] = useState<string | null>(null);
  const router = useRouter();

  if (!splits || splits.length === 0) return null;

  const paidCount = splits.filter((s) => s.paid).length;
  const totalCount = splits.length;
  const paidPercent = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  async function handleMarkSplitPaid(splitId: string) {
    setLoadingSplitId(splitId);
    const supabase = createClient();
    const { error } = await supabase
      .from("bill_splits")
      .update({ paid: true, paid_date: new Date().toISOString() })
      .eq("id", splitId);

    if (!error) {
      router.refresh();
    }
    setLoadingSplitId(null);
  }

  return (
    <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-800 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              paidPercent === 100
                ? "bg-emerald-500"
                : paidPercent > 0
                  ? "bg-indigo-500"
                  : "bg-slate-300 dark:bg-slate-600"
            }`}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
          {paidCount}/{totalCount}
        </span>
      </div>

      {/* Member chips */}
      <div className="flex flex-wrap gap-1.5">
        {splits.map((split) => {
          const colorStyle = colorMap[split.member?.color] || colorMap.indigo;
          return (
            <div
              key={split.id}
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border ${
                split.paid
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              {/* Mini avatar */}
              <span
                className={`w-4 h-4 rounded-full ${colorStyle.bg} ${colorStyle.text} flex items-center justify-center text-[8px] font-bold`}
              >
                {split.member?.name?.charAt(0) || "?"}
              </span>

              {/* Amount */}
              <span className="font-mono tabular-nums">
                {Number(split.amount).toLocaleString("vi-VN")}₫
              </span>

              {/* Status icon or action button */}
              {split.paid ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <button
                  type="button"
                  onClick={() => handleMarkSplitPaid(split.id)}
                  disabled={loadingSplitId === split.id || billPaid}
                  title={
                    billPaid
                      ? "Hóa đơn đã đóng"
                      : `Đánh dấu ${split.member?.name || "thành viên"} đã góp`
                  }
                  className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-spring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSplitId === split.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BillSplitDisplay;
