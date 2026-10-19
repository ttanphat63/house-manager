"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { type Bill } from "@/types/database";
import { BillSplitDisplay, type BillSplitWithMember } from "./bill-split-display";
import { MarkPaidButton } from "./mark-paid-button";
import { DeleteBillButton } from "./delete-bill-button";

type StatusFilter = "all" | "unpaid" | "paid" | "overdue";
type TypeFilter = "all" | "electric" | "water" | "net" | "other";
type SortOption = "newest" | "oldest" | "amount-high" | "amount-low" | "due-soon";

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
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState<"delete" | "paid" | null>(null);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, typeFilter, monthFilter, searchQuery]);

  // Tab counts
  const statusCounts = useMemo(() => {
    return {
      all: initialBills.length,
      unpaid: initialBills.filter((b) => !b.paid).length,
      paid: initialBills.filter((b) => b.paid).length,
      overdue: initialBills.filter((b) => !b.paid && daysUntil(b.due_date) < 0).length,
    };
  }, [initialBills]);

  // Available months (YYYY-MM) from initialBills, sorted descending
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    initialBills.forEach((b) => {
      const ym = b.due_date?.slice(0, 7);
      if (ym) monthSet.add(ym);
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
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

      // 4. Month filter
      if (monthFilter !== "all" && bill.due_date?.slice(0, 7) !== monthFilter) {
        return false;
      }

      return true;
    });
  }, [initialBills, searchQuery, statusFilter, typeFilter, monthFilter]);

  // Sorting
  const sortedBills = useMemo(() => {
    const sorted = [...filteredBills];
    switch (sortBy) {
      case "newest":
        sorted.sort((a, b) => b.due_date.localeCompare(a.due_date));
        break;
      case "oldest":
        sorted.sort((a, b) => a.due_date.localeCompare(b.due_date));
        break;
      case "amount-high":
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case "amount-low":
        sorted.sort((a, b) => a.amount - b.amount);
        break;
      case "due-soon":
        sorted.sort((a, b) => {
          if (a.paid !== b.paid) return a.paid ? 1 : -1;
          return a.due_date.localeCompare(b.due_date);
        });
        break;
    }
    return sorted;
  }, [filteredBills, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    monthFilter !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setMonthFilter("all");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sortedBills.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedBills.map((b) => b.id)));
    }
  }

  const isAllSelected = sortedBills.length > 0 && selectedIds.size === sortedBills.length;
  const hasSelection = selectedIds.size > 0;

  async function handleBulkMarkPaid() {
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("bills")
      .update({ paid: true, paid_date: new Date().toISOString().split("T")[0] })
      .in("id", ids);

    setBulkLoading(false);
    setShowBulkConfirm(null);
    if (!error) {
      setSelectedIds(new Set());
      router.refresh();
    } else {
      alert("Lỗi: " + error.message);
    }
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    // Delete splits first (foreign key constraint), then bills
    await supabase.from("bill_splits").delete().in("bill_id", ids);
    const { error } = await supabase.from("bills").delete().in("id", ids);

    setBulkLoading(false);
    setShowBulkConfirm(null);
    if (!error) {
      setSelectedIds(new Set());
      router.refresh();
    } else {
      alert("Lỗi: " + error.message);
    }
  }

  return (
    <div className="space-y-5">
      {/* CONTROLS BAR: SEARCH & FILTERS */}
      <div className="space-y-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* ROW 1: SEARCH + MONTH FILTER + SORT */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search input */}
          <div className="relative flex-1">
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

          {/* Month filter dropdown */}
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer min-w-[140px]"
          >
            <option value="all">Tất cả tháng</option>
            {availableMonths.map((ym) => {
              const [y, m] = ym.split("-");
              return (
                <option key={ym} value={ym}>
                  Tháng {parseInt(m, 10)}/{y}
                </option>
              );
            })}
          </select>

          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all cursor-pointer min-w-[150px]"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="amount-high">Số tiền ↓</option>
            <option value="amount-low">Số tiền ↑</option>
            <option value="due-soon">Hạn đóng gần</option>
          </select>
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

      {/* RESULT COUNT, SELECT ALL & RESET ACTION */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <div className="flex items-center gap-3">
          {/* Select All toggle */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-spring"
          >
            {isAllSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>{isAllSelected ? "Bỏ chọn" : "Chọn tất cả"}</span>
          </button>

          <span>
            Hiển thị{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {sortedBills.length}
            </strong>{" "}
            / <span className="font-mono tabular-nums">{initialBills.length}</span> hóa đơn
          </span>
        </div>

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

      {/* BULK ACTION BAR */}
      {hasSelection && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <CheckSquare className="w-4 h-4" />
            <span className="font-mono tabular-nums">{selectedIds.size}</span>
            <span>hóa đơn đã chọn</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowBulkConfirm("paid")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-spring shadow-xs btn-press"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đánh dấu đã đóng</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkConfirm("delete")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-spring shadow-xs btn-press"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* BILLS LIST OR EMPTY STATE */}
      {sortedBills.length === 0 ? (
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
          {sortedBills.map((bill) => {
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
                {/* Dòng 1: Checkbox + Icon + Tên + Badge trạng thái + Nút Đã đóng */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(bill.id);
                      }}
                      aria-label={selectedIds.has(bill.id) ? "Bỏ chọn hóa đơn" : "Chọn hóa đơn"}
                      className="shrink-0 p-0.5 rounded transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                    >
                      {selectedIds.has(bill.id) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-400" />
                      )}
                    </button>

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

      {/* BULK CONFIRM DIALOG */}
      {showBulkConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity animate-in fade-in duration-200"
          onClick={() => !bulkLoading && setShowBulkConfirm(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  showBulkConfirm === "delete"
                    ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600"
                    : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"
                }`}
              >
                {showBulkConfirm === "delete" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {showBulkConfirm === "delete"
                  ? `Xóa ${selectedIds.size} hóa đơn?`
                  : `Đánh dấu ${selectedIds.size} hóa đơn đã đóng?`}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {showBulkConfirm === "delete"
                  ? "Hành động này không thể hoàn tác. Tất cả dữ liệu đã chọn sẽ bị xóa vĩnh viễn."
                  : "Các hóa đơn đã chọn sẽ được đánh dấu đã thanh toán với ngày hôm nay."}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowBulkConfirm(null)}
                disabled={bulkLoading}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 rounded-xl transition-spring btn-press"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={showBulkConfirm === "delete" ? handleBulkDelete : handleBulkMarkPaid}
                disabled={bulkLoading}
                className={`flex-1 inline-flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-spring shadow-sm btn-press ${
                  showBulkConfirm === "delete"
                    ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-emerald-600/20"
                }`}
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : showBulkConfirm === "delete" ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa luôn</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác nhận</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
