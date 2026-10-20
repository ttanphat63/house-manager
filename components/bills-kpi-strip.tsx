"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Wallet, Eye } from "lucide-react";
import { type Bill } from "@/types/database";
import { MonthExpenseDetailModal } from "./month-expense-detail-modal";

interface BillsKpiStripProps {
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalMonth: number;
  allBillsLength: number;
  thisMonthBills: Bill[];
  currentMonth: number;
  currentYear: number;
}

function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(".0", "") + "M ₫";
  }
  if (amount >= 1_000) {
    return Math.round(amount / 1_000) + "K ₫";
  }
  return amount.toString() + " ₫";
}

export function BillsKpiStrip({
  paidCount,
  unpaidCount,
  overdueCount,
  totalMonth,
  allBillsLength,
  thisMonthBills,
  currentMonth,
  currentYear,
}: BillsKpiStripProps) {
  const [showDetail, setShowDetail] = useState(false);

  const percentPaid =
    allBillsLength > 0 ? Math.round((paidCount / allBillsLength) * 100) : 0;

  const tooltipMonth = `Tổng chi phí các hóa đơn có hạn đóng trong tháng ${
    currentMonth + 1
  }/${currentYear}. Không bao gồm hóa đơn có hạn ở tháng khác (dù đã thanh toán sớm).`;

  return (
    <>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {/* CARD 1: ĐÃ ĐÓNG */}
        <div className="flex-1 p-5 md:p-6 flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[0.6875rem] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate block">
              Đã đóng
            </span>
            <div className="text-2xl md:text-[1.75rem] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 tracking-tight mt-1 leading-tight truncate">
              {paidCount} hóa đơn
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {percentPaid}% hoàn thành
            </div>
          </div>
        </div>

        {/* CARD 2: CHƯA ĐÓNG */}
        <div className="flex-1 p-5 md:p-6 flex items-start gap-4 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              unpaidCount > 0
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[0.6875rem] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate block">
              Chưa đóng
            </span>
            <div className="text-2xl md:text-[1.75rem] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 tracking-tight mt-1 leading-tight truncate">
              {unpaidCount} hóa đơn
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              {overdueCount} hóa đơn quá hạn
            </div>
          </div>
        </div>

        {/* CARD 3: TỔNG CHI THÁNG NÀY (CLICKABLE) */}
        <div className="flex-1 p-5 md:p-6 flex items-start gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.6875rem] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate block">
                Tổng chi tháng này
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowDetail(true)}
              title={tooltipMonth}
              className="text-2xl md:text-[1.75rem] font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 tracking-tight mt-1 leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer flex items-baseline gap-1.5 group text-left"
            >
              <span>{formatMoney(totalMonth)}</span>
              <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 shrink-0" />
            </button>

            <div
              className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate cursor-help"
              title={tooltipMonth}
            >
              {thisMonthBills.length}/{allBillsLength} hóa đơn có hạn trong tháng này
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <MonthExpenseDetailModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        totalMonth={totalMonth}
        thisMonthBills={thisMonthBills}
        month={currentMonth + 1}
        year={currentYear}
      />
    </>
  );
}
