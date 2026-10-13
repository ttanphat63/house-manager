"use client";

import React from "react";
import { type Member } from "@/types/database";
import { colorMap } from "@/lib/color-map";
import { Users, Divide, RotateCcw, CheckCircle2 } from "lucide-react";

export interface SplitItem {
  memberId: string;
  memberName: string;
  memberColor: string;
  amount: number;
}

interface BillSplitSectionProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  splits: SplitItem[];
  onSplitsChange: (splits: SplitItem[]) => void;
  totalAmount: number;
  members: Pick<Member, "id" | "name" | "color" | "role">[];
}

export function BillSplitSection({
  enabled,
  onEnabledChange,
  splits,
  onSplitsChange,
  totalAmount,
  members,
}: BillSplitSectionProps) {
  const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
  const isValid = splitTotal === totalAmount && totalAmount > 0;
  const hasAnySplit = splits.some((s) => s.amount > 0);

  function handleSplitEvenly() {
    const count = splits.length;
    if (count === 0 || totalAmount <= 0) return;
    const base = Math.floor(totalAmount / count);
    const remainder = totalAmount - base * count;
    const newSplits = splits.map((s, i) => ({
      ...s,
      amount: base + (i < remainder ? 1 : 0),
    }));
    onSplitsChange(newSplits);
  }

  function handleClearSplits() {
    onSplitsChange(splits.map((s) => ({ ...s, amount: 0 })));
  }

  function handleAmountChange(index: number, rawValue: string) {
    const numericValue = rawValue.replace(/[^0-9]/g, "");
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      amount: numericValue ? parseInt(numericValue, 10) : 0,
    };
    onSplitsChange(newSplits);
  }

  const noMembers = members.length === 0;

  return (
    <div className="space-y-3">
      {/* TOGGLE ROW */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chia tiền cho thành viên
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {noMembers
                ? "Cần thêm thành viên trước khi chia tiền"
                : "Phân chia hóa đơn cho từng người trong gia đình"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => !noMembers && onEnabledChange(!enabled)}
          disabled={noMembers}
          title={
            noMembers ? "Cần thêm thành viên trước" : "Bật/tắt chia tiền"
          }
          className={`relative w-10 h-[22px] rounded-full transition-spring shrink-0 ${
            noMembers
              ? "bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-50"
              : enabled
                ? "bg-indigo-600"
                : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-spring ${
              enabled ? "translate-x-[18px]" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* SPLIT CONTENT */}
      {enabled && !noMembers && (
        <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* QUICK ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSplitEvenly}
              disabled={totalAmount <= 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-spring btn-press"
            >
              <Divide className="w-3.5 h-3.5" />
              Chia đều
            </button>
            <button
              type="button"
              onClick={handleClearSplits}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-spring btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          </div>

          {/* MEMBER SPLIT ROWS */}
          <div className="space-y-2">
            {splits.map((split, index) => {
              const cs =
                colorMap[split.memberColor] || colorMap.indigo;
              return (
                <div
                  key={split.memberId}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                >
                  {/* Mini avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg ${cs.bg} ${cs.text} flex items-center justify-center font-bold text-xs shrink-0`}
                  >
                    {split.memberName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
                      {split.memberName}
                    </span>
                  </div>

                  {/* Amount input */}
                  <div className="w-32 relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={split.amount || ""}
                      onChange={(e) =>
                        handleAmountChange(index, e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-sm text-right font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                      ₫
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY BAR */}
          {hasAnySplit && (
            <div
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                isValid
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isValid && <CheckCircle2 className="w-3.5 h-3.5" />}
                Tổng đã chia:
              </span>
              <span className="font-mono tabular-nums">
                {splitTotal.toLocaleString("vi-VN")} /{" "}
                {totalAmount.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
