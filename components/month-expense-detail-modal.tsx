"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Clock } from "lucide-react";
import { type Bill } from "@/types/database";
import { typeConfig, type BillType } from "@/lib/type-config";

interface MonthExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalMonth: number;
  thisMonthBills: Bill[];
  month: number;
  year: number;
}

function formatMoneyFull(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export function MonthExpenseDetailModal({
  isOpen,
  onClose,
  totalMonth,
  thisMonthBills,
  month,
  year,
}: MonthExpenseDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Chi tiết tổng chi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hạn nộp trong Tháng {month}/{year}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big total */}
        <div className="bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl p-4 mb-4 border border-indigo-100 dark:border-indigo-900/50">
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Tổng cộng ({thisMonthBills.length} hóa đơn)
          </div>
          <div className="text-3xl font-extrabold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 mt-1">
            {formatMoneyFull(totalMonth)}
          </div>
        </div>

        {/* Bills list */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Danh sách hóa đơn tính vào tháng này:
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {thisMonthBills.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                Không có hóa đơn nào có hạn trong tháng {month}/{year}
              </div>
            ) : (
              thisMonthBills.map((bill) => {
                const config = typeConfig[bill.type as BillType] || typeConfig.other;
                const Icon = config.icon;

                return (
                  <div
                    key={bill.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {bill.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>Hạn: {formatDate(bill.due_date)}</span>
                          <span>•</span>
                          {bill.paid ? (
                            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Đã đóng
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5 font-medium">
                              <Clock className="w-3 h-3" /> Chưa đóng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {formatMoneyFull(bill.amount)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Explain footer */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
          💡 <span className="font-medium text-slate-600 dark:text-slate-300">Lưu ý:</span> Chỉ tính các hóa đơn có hạn đóng trong tháng này. Hóa đơn hạn tháng khác không được tính (dù đã thanh toán sớm).
        </p>
      </div>
    </div>,
    document.body
  );
}
