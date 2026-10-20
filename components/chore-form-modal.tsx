"use client";

import React, { useState, useEffect, useRef } from "react";
import { type Chore, type Member } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { colorMap } from "@/lib/color-map";
import { X, Loader2, AlertCircle, Calendar, User, CheckSquare } from "lucide-react";

interface ChoreFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  groupId: string;
  members: Pick<Member, "id" | "name" | "color">[];
  editChore?: Chore | null;
}

export function ChoreFormModal({
  open,
  onClose,
  onSuccess,
  userId,
  groupId,
  members,
  editChore,
}: ChoreFormModalProps) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "once">("daily");
  const [nextDue, setNextDue] = useState("");
  const [priority, setPriority] = useState<"high" | "normal" | "low">("normal");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editChore) {
      setTitle(editChore.title || "");
      setAssignedTo(editChore.assigned_to || "");
      setFrequency(editChore.frequency || "daily");
      setNextDue(editChore.next_due ? editChore.next_due.split("T")[0] : "");
      setPriority(editChore.priority || "normal");
      setNote(editChore.note || "");
    } else {
      setTitle("");
      setAssignedTo(members[0]?.name || "");
      setFrequency("daily");
      // Mặc định ngày mai hoặc hôm nay
      const today = new Date().toISOString().split("T")[0];
      setNextDue(today);
      setPriority("normal");
      setNote("");
    }
    setError(null);
  }, [editChore, open, members]);

  useEffect(() => {
    if (open) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Vui lòng nhập tên việc cần làm");
      return;
    }
    if (title.trim().length > 100) {
      setError("Tên công việc không được quá 100 ký tự");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const chorePayload = {
      title: title.trim(),
      assigned_to: assignedTo.trim() || null,
      frequency,
      next_due: nextDue || null,
      priority,
      note: note.trim() || null,
    };

    if (editChore) {
      const { error: updateError } = await supabase
        .from("chores")
        .update(chorePayload)
        .eq("id", editChore.id);

      if (updateError) {
        setLoading(false);
        setError("Lỗi khi cập nhật việc: " + updateError.message);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("chores").insert({
        user_id: userId,
        group_id: groupId,
        ...chorePayload,
        done: false,
      });

      if (insertError) {
        setLoading(false);
        setError("Lỗi khi thêm việc: " + insertError.message);
        return;
      }
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  function handleClose() {
    if (loading) return;
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {editChore ? "Chỉnh sửa việc nhà" : "Thêm việc nhà mới"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {editChore
                  ? "Cập nhật thông tin phân công việc nhà"
                  : "Tạo công việc và phân chia cho thành viên"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring disabled:opacity-50"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. TÊN VIỆC NHÀ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên việc cần làm <span className="text-rose-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Rửa bát, Hút bụi phòng khách, Tưới cây..."
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring"
            />
          </div>

          {/* 2. NGƯỜI PHỤ TRÁCH & HẠN HOÀN THÀNH */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Người phụ trách
              </label>
              <div className="relative">
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring"
                >
                  <option value="">-- Chưa giao ai --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hạn làm việc
              </label>
              <input
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring font-mono"
              />
            </div>
          </div>

          {/* 3. TẦN SUẤT & MỨC ƯU TIÊN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tần suất lặp lại
              </label>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(
                    e.target.value as "daily" | "weekly" | "monthly" | "once"
                  )
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring"
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="once">Một lần</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mức ưu tiên
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(
                  [
                    { key: "high", label: "Cao" },
                    { key: "normal", label: "Vừa" },
                    { key: "low", label: "Thấp" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-spring ${
                      priority === p.key
                        ? p.key === "high"
                          ? "bg-rose-500 text-white shadow-xs"
                          : p.key === "low"
                            ? "bg-slate-600 text-white shadow-xs"
                            : "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. GHI CHÚ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ghi chú thêm (tùy chọn)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhớ phơi chỗ có nắng, xả nước kỹ..."
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-spring resize-none"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-spring btn-press"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white transition-spring shadow-sm shadow-indigo-600/25 btn-press"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editChore ? "Cập nhật" : "Tạo việc nhà"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
