"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Droplets,
  Wifi,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  Pencil,
  Search,
  X,
  RotateCcw,
  Receipt,
  LayoutGrid,
} from "lucide-react";
import { type Bill } from "@/types/database";
import { BillSplitDisplay, type BillSplitWithMember } from "./bill-split-display";
import { MarkPaidButton } from "./mark-paid-button";
import { DeleteBillButton } from "./delete-bill-button";

type StatusFilter = "all" | "unpaid" | "paid" | "overdue";
type TypeFilter = "all" | "electric" | "water" | "net" | "other";

interface BillsListClientProps {
  initialBills: Bill[];
  splitsByBill: Record<string, BillSplitWithMember[]>;
}

const typeConfig = {
  electric: {
    icon: Zap,
    label: "Điện",
    colorBg: "bg-amber-100 dark:bg-amber-950/60",
    colorText: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  },
  water: {
    icon: Droplets,
    label: "Nước",
    colorBg: "bg-sky-100 dark:bg-sky-950/60",
    colorText: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  net: {
    icon: Wifi,
    label: "Internet",
    colorBg: "bg-purple-100 dark:bg-purple-950/60",
    colorText: "text-purple-600 dark:text-purple-400",
    badge: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  other: {
    icon: Package,
    label: "Khác",
    colorBg: "bg-slate-100 dark:bg-slate-800",
    colorText: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

function formatMoneyFull(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
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

export function BillsListClient({
  initialBills,
  splitsByBill,
}: BillsListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Tab counts
  const statusCounts = useMemo(() => {
    return {
      all: initialBills.length,
      unpaid: initialBills.filter((b) => !b.paid).length,
      paid: initialBills.filter((b) => b.paid).length,
      overdue: initialBills.filter((b) => !b.paid && daysUntil(b.due_date) < 0).length,
    };
  }, [initialBills]);

  // Filtering
  const filteredBills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return initialBills.filter((bill) => {
      // 1. Search filter
      if (query) {
        const titleMatch = bill.title.toLowerCase().includes(query);
        const noteMatch = bill.note?.toLowerCase().includes(query);
        if (!titleMatch && !noteMatch) return false;
      }

      // 2. Status filter
      if (statusFilter === "unpaid" && bill.paid) return false;
      if (statusFilter === "paid" && !bill.paid) return false;
      if (
        statusFilter === "overdue" &&
        (bill.paid || daysUntil(bill.due_date) >= 0)
      ) {
        return false;
      }

      // 3. Type filter
      if (typeFilter !== "all" && bill.type !== typeFilter) return false;

      return true;
    });
  }, [initialBills, searchQuery, statusFilter, typeFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" || statusFilter !== "all" || typeFilter !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  }

  return (
    <div className="space-y-5">
      {/* CONTROLS BAR: SEARCH & FILTERS */}
      <div className="space-y-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* ROW 1: SEARCH INPUT */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên hóa đơn, ghi chú..."
            className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Xóa tìm kiếm"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-spring"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ROW 2: STATUS FILTER TABS */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "all"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Tất cả</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700 text-current">
              {statusCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("unpaid")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "unpaid"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Chưa đóng</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {statusCounts.unpaid}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "paid"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Đã đóng</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {statusCounts.paid}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("overdue")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "overdue"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Quá hạn</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
              {statusCounts.overdue}
            </span>
          </button>
        </div>

        {/* ROW 3: CATEGORY / TYPE FILTER TABS */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              typeFilter === "all"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tất cả loại</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("electric")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              typeFilter === "electric"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Tiền điện</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("water")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              typeFilter === "water"
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            <span>Tiền nước</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("net")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              typeFilter === "net"
                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-purple-500" />
            <span>Internet</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("other")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              typeFilter === "other"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>Khác</span>
          </button>
        </div>
      </div>

      {/* RESULT COUNT & RESET ACTION */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Hiển thị{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {filteredBills.length}
          </strong>{" "}
          / <span className="font-mono tabular-nums">{initialBills.length}</span> hóa đơn
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition-spring"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      {/* BILLS LIST OR EMPTY STATE */}
      {filteredBills.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
            Không tìm thấy hóa đơn nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? "Không có hóa đơn nào phù hợp với bộ lọc hiện tại. Thử thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc."
              : "Chưa có hóa đơn nào được tạo trong hệ thống."}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2 rounded-xl transition-spring btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          ) : (
            <Link
              href="/protected/bills/new"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-spring btn-press"
            >
              <span>Thêm hóa đơn đầu tiên</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => {
            const config = typeConfig[bill.type];
            const Icon = config.icon;
            const isUrgent = !bill.paid && daysUntil(bill.due_date) <= 3;

            return (
              <div
                key={bill.id}
                className={`group p-4 rounded-xl border transition-spring card-hover ${
                  isUrgent
                    ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
                    : bill.paid
                      ? "bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800"
                      : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Dòng 1: Icon + Tên + Badge trạng thái + Nút Đã đóng */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${config.colorBg} ${config.colorText} flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {bill.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${config.badge}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span className="font-mono tabular-nums">
                          {bill.paid && bill.paid_date
                            ? `Đã thanh toán ngày ${formatDate(bill.paid_date)}`
                            : `Hạn đóng: ${formatDate(bill.due_date)}`}
                        </span>
                        {bill.note && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]" title={bill.note}>
                              {bill.note}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        bill.paid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {bill.paid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã thanh toán</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Chưa đóng</span>
                        </>
                      )}
                    </span>

                    {!bill.paid && <MarkPaidButton billId={bill.id} />}
                  </div>
                </div>

                {/* SPLIT DISPLAY */}
                {splitsByBill[bill.id] && splitsByBill[bill.id].length > 0 && (
                  <BillSplitDisplay
                    splits={splitsByBill[bill.id]}
                    billPaid={bill.paid}
                  />
                )}

                {/* Dòng 2: Số tiền & Actions */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono tabular-nums">
                    {formatMoneyFull(bill.amount)}
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/protected/bills/${bill.id}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-lg transition-spring"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Sửa</span>
                    </Link>
                    <DeleteBillButton billId={bill.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
