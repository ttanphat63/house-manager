"use client";

import React, { useState, useEffect } from "react";
import { type Member } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, AlertCircle, Trash2, Loader2 } from "lucide-react";

interface DeleteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: Member | null;
}

export function DeleteMemberDialog({
  open,
  onClose,
  onSuccess,
  member,
}: DeleteMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(false);
    }
  }, [open]);

  // ESC key to close
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

  async function handleDelete() {
    if (!member) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("members")
      .delete()
      .eq("id", member.id);

    if (deleteError) {
      setLoading(false);
      setError("Lỗi khi xóa: " + deleteError.message);
      return;
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  function handleClose() {
    if (loading) return;
    onClose();
  }

  if (!open || !member) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-6 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WARNING ICON */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* TITLE & DESCRIPTION */}
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1">
          Xóa thành viên?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto mb-5">
          Bạn có chắc muốn xóa{" "}
          <strong className="text-slate-900 dark:text-slate-100">
            {member.name}
          </strong>
          ? Tất cả dữ liệu chia tiền của thành viên này cũng sẽ bị xóa và
          không thể khôi phục.
        </p>

        {/* WARNING ALERT */}
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] p-2.5 rounded-xl mb-5 text-left">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Hành động này không thể hoàn tác</span>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl mb-4 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-spring shadow-sm shadow-rose-600/30 btn-press"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? "Đang xóa..." : "Xóa thành viên"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-spring btn-press"
          >
            Giữ lại
          </button>
        </div>
      </div>
    </div>
  );
}
