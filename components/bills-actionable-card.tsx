import React from "react";
import Link from "next/link";
import { Receipt, Calendar, Clock, ArrowRight, CheckCircle2, PartyPopper } from "lucide-react";
import { MarkPaidButton } from "@/components/mark-paid-button";
import { BillSplitDisplay, type BillSplitWithMember } from "@/components/bill-split-display";
import { typeConfig } from "@/lib/type-config";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

export interface BillsActionableCardProps {
  /** Already filtered: paid === false, sorted by due_date asc, sliced to max 3 */
  bills: Bill[];
  /** Map of bill_id → splits with member info */
  splitsByBill: Record<string, BillSplitWithMember[]>;
  /** Total unpaid count (for showing overflow indicator) */
  totalUnpaidCount: number;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatMoneyFull(amount: number): string {
  return Number(amount).toLocaleString("vi-VN") + " ₫";
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

function UrgencyBadgeWithDate({ days, dateStr }: { days: number; dateStr: string }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-mono tabular-nums">
        Quá hạn {Math.abs(days)} ngày
      </span>
    );
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
        Hôm nay đến hạn
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-mono tabular-nums">
        <Clock className="w-3 h-3" />
        Còn {days} ngày
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-mono tabular-nums">
      <Calendar className="w-3 h-3" />
      Hạn {formatDate(dateStr)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Component — Server-compatible (no state)
// ─────────────────────────────────────────────

export function BillsActionableCard({
  bills,
  splitsByBill,
  totalUnpaidCount,
}: BillsActionableCardProps) {
  const overflowCount = totalUnpaidCount - bills.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Hóa đơn cần xử lý
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {totalUnpaidCount === 0
                ? "Tất cả đã đóng"
                : `${totalUnpaidCount} hóa đơn chưa thanh toán`}
            </p>
          </div>
        </div>

        <Link
          href="/protected/bills"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-3 py-1.5 rounded-lg transition-all"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── CONTENT ── */}
      <div className="p-4">
        {totalUnpaidCount === 0 ? (
          /* ── EMPTY STATE: Tất cả đã đóng 🎉 ── */
          <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <PartyPopper className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Tất cả đã đóng! 🎉
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tuyệt vời — không có hóa đơn nào cần xử lý.
              </p>
            </div>
            <Link
              href="/protected/bills/new"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              + Thêm hóa đơn mới
            </Link>
          </div>
        ) : (
          /* ── BILLS LIST ── */
          <div className="space-y-3">
            {bills.map((bill) => {
              const cfg = typeConfig[bill.type];
              const Icon = cfg.icon;
              const days = daysUntil(bill.due_date);
              const isOverdue = days < 0;
              const isUrgent = days >= 0 && days <= 3;

              return (
                <div
                  key={bill.id}
                  className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                    isOverdue
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                      : isUrgent
                        ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                        : "bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/60"
                  }`}
                >
                  {/* Row 1: Icon + Title + Urgency badge */}
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {bill.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <UrgencyBadgeWithDate days={days} dateStr={bill.due_date} />
                      </div>
                    </div>
                  </div>

                  {/* Split display (if exists) */}
                  {splitsByBill[bill.id] && splitsByBill[bill.id].length > 0 && (
                    <BillSplitDisplay
                      splits={splitsByBill[bill.id]}
                      billPaid={bill.paid}
                    />
                  )}

                  {/* Row 2: Amount + Quick pay button */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/80 dark:border-slate-800/80">
                    <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 text-sm">
                      {formatMoneyFull(bill.amount)}
                    </span>
                    <MarkPaidButton billId={bill.id} />
                  </div>
                </div>
              );
            })}

            {/* Overflow indicator */}
            {overflowCount > 0 && (
              <Link
                href="/protected/bills"
                className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 transition-all"
              >
                <span>+{overflowCount} hóa đơn khác</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
