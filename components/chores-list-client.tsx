"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Plus,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { type Chore, type Member } from "@/types/database";
import { ChoreCard } from "./chore-card";
import { ChoreFormModal } from "./chore-form-modal";
import { DeleteChoreDialog } from "./delete-chore-dialog";
import { createClient } from "@/lib/supabase/client";

interface ChoresListClientProps {
  initialChores: Chore[];
  members: Pick<Member, "id" | "name" | "color">[];
  userId: string;
}

type StatusFilter = "all" | "pending" | "done";
type FrequencyFilter = "all" | "daily" | "weekly" | "monthly" | "once";

export function ChoresListClient({
  initialChores,
  members,
  userId,
}: ChoresListClientProps) {
  const [chores, setChores] = useState<Chore[]>(initialChores);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingChore, setDeletingChore] = useState<Chore | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Keep state synced with props if initialChores updates
  React.useEffect(() => {
    setChores(initialChores);
  }, [initialChores]);

  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => {
      map[m.name] = m.color;
    });
    return map;
  }, [members]);

  async function refreshChores() {
    const { data } = await supabase
      .from("chores")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setChores(data as Chore[]);
    }
  }

  async function handleToggleDone(choreId: string, currentDone: boolean) {
    setTogglingId(choreId);
    // Optimistic UI update
    setChores((prev) =>
      prev.map((c) =>
        c.id === choreId
          ? {
              ...c,
              done: !currentDone,
              done_at: !currentDone ? new Date().toISOString() : null,
            }
          : c
      )
    );

    const { error } = await supabase
      .from("chores")
      .update({
        done: !currentDone,
        done_at: !currentDone ? new Date().toISOString() : null,
      })
      .eq("id", choreId);

    setTogglingId(null);
    if (!error) {
      router.refresh();
    } else {
      refreshChores();
    }
  }

  function handleEdit(chore: Chore) {
    setEditingChore(chore);
    setModalOpen(true);
  }

  function handleDelete(chore: Chore) {
    setDeletingChore(chore);
    setDeleteDialogOpen(true);
  }

  function handleAddNew() {
    setEditingChore(null);
    setModalOpen(true);
  }

  // Counts
  const statusCounts = useMemo(() => {
    return {
      all: chores.length,
      pending: chores.filter((c) => !c.done).length,
      done: chores.filter((c) => c.done).length,
    };
  }, [chores]);

  // Filtering
  const filteredChores = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return chores.filter((c) => {
      // 1. Search
      if (query) {
        const titleMatch = c.title.toLowerCase().includes(query);
        const noteMatch = c.note?.toLowerCase().includes(query);
        const assigneeMatch = c.assigned_to?.toLowerCase().includes(query);
        if (!titleMatch && !noteMatch && !assigneeMatch) return false;
      }

      // 2. Status
      if (statusFilter === "pending" && c.done) return false;
      if (statusFilter === "done" && !c.done) return false;

      // 3. Frequency
      if (frequencyFilter !== "all" && c.frequency !== frequencyFilter) {
        return false;
      }

      return true;
    });
  }, [chores, searchQuery, statusFilter, frequencyFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    frequencyFilter !== "all";

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setFrequencyFilter("all");
  }

  return (
    <div className="space-y-6">
      {/* CONTROLS BAR: SEARCH, STATUS & FREQUENCY FILTERS */}
      <div className="space-y-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        {/* ROW 1: SEARCH & QUICK ADD BUTTON */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên việc, người phụ trách, ghi chú..."
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

          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/25 btn-press shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc mới</span>
          </button>
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
            onClick={() => setStatusFilter("pending")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "pending"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Chưa xong</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              {statusCounts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("done")}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-spring btn-press ${
              statusFilter === "done"
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>Đã xong</span>
            <span className="font-mono tabular-nums text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {statusCounts.done}
            </span>
          </button>
        </div>

        {/* ROW 3: FREQUENCY FILTER TABS */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5">
          <button
            type="button"
            onClick={() => setFrequencyFilter("all")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              frequencyFilter === "all"
                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả tần suất</span>
          </button>

          <button
            type="button"
            onClick={() => setFrequencyFilter("daily")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              frequencyFilter === "daily"
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>Hàng ngày</span>
          </button>

          <button
            type="button"
            onClick={() => setFrequencyFilter("weekly")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              frequencyFilter === "weekly"
                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>Hàng tuần</span>
          </button>

          <button
            type="button"
            onClick={() => setFrequencyFilter("monthly")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              frequencyFilter === "monthly"
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>Hàng tháng</span>
          </button>

          <button
            type="button"
            onClick={() => setFrequencyFilter("once")}
            className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium px-2.5 py-1 rounded-lg border transition-spring shrink-0 ${
              frequencyFilter === "once"
                ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-semibold"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            }`}
          >
            <span>Một lần</span>
          </button>
        </div>
      </div>

      {/* RESULT COUNT & RESET ACTION */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Hiển thị{" "}
          <strong className="text-slate-900 dark:text-slate-100 font-mono tabular-nums">
            {filteredChores.length}
          </strong>{" "}
          / <span className="font-mono tabular-nums">{chores.length}</span> việc
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

      {/* CHORES GRID OR EMPTY STATE */}
      {filteredChores.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
            Không tìm thấy việc nhà nào
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? "Không có công việc nào phù hợp với bộ lọc hiện tại. Thử thay đổi từ khóa hoặc đặt lại bộ lọc."
              : "Chưa có công việc nào trong danh sách. Hãy thêm công việc đầu tiên để bắt đầu phân công."}
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
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-spring btn-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm việc đầu tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              memberColor={chore.assigned_to ? memberColorMap[chore.assigned_to] : undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleDone={handleToggleDone}
              isToggling={togglingId === chore.id}
            />
          ))}
        </div>
      )}

      {/* CHORE FORM MODAL */}
      <ChoreFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingChore(null);
        }}
        onSuccess={() => {
          refreshChores();
          router.refresh();
        }}
        userId={userId}
        members={members}
        editChore={editingChore}
      />

      {/* DELETE CHORE DIALOG */}
      <DeleteChoreDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingChore(null);
        }}
        onSuccess={() => {
          refreshChores();
          router.refresh();
        }}
        chore={deletingChore}
      />
    </div>
  );
}
