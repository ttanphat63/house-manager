"use client";

import React, { useState, useEffect, useRef } from "react";
import { type Member } from "@/types/database";
import { colorOptions, colorMap } from "@/lib/color-map";
import { createClient } from "@/lib/supabase/client";
import { X, Check, Loader2, AlertCircle } from "lucide-react";

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  editMember?: Member | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberFormModal({
  open,
  onClose,
  onSuccess,
  userId,
  editMember,
}: MemberFormModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Thành viên");
  const [color, setColor] = useState("indigo");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prefill form when editing
  useEffect(() => {
    if (editMember) {
      setName(editMember.name);
      setRole(editMember.role);
      setColor(editMember.color);
      setEmail(editMember.email || "");
    } else {
      setName("");
      setRole("Thành viên");
      setColor("indigo");
      setEmail("");
    }
    setError(null);
  }, [editMember, open]);

  // Focus name input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
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

  function handleClose() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (!name.trim()) {
      setError("Vui lòng nhập tên thành viên");
      return;
    }
    if (name.trim().length > 50) {
      setError("Tên không được quá 50 ký tự");
      return;
    }
    if (!role.trim()) {
      setError("Vui lòng nhập vai trò");
      return;
    }
    if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
      setError("Email không hợp lệ");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (editMember) {
      // UPDATE
      const { error: updateError } = await supabase
        .from("members")
        .update({
          name: name.trim(),
          role: role.trim(),
          color,
          email: email.trim() || null,
        })
        .eq("id", editMember.id);

      if (updateError) {
        setLoading(false);
        setError("Lỗi khi lưu: " + updateError.message);
        return;
      }
    } else {
      // INSERT
      const { error: insertError } = await supabase.from("members").insert({
        user_id: userId,
        name: name.trim(),
        role: role.trim(),
        color,
        email: email.trim() || null,
      });

      if (insertError) {
        setLoading(false);
        setError("Lỗi khi lưu: " + insertError.message);
        return;
      }
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editMember ? "Chỉnh sửa thành viên" : "Thêm thành viên mới"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {editMember
                ? "Cập nhật thông tin cá nhân"
                : "Nhập thông tin người thân trong gia đình"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TÊN */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Tên thành viên <span className="text-rose-500">*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
          </div>

          {/* VAI TRÒ */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Vai trò trong gia đình <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="VD: Chủ hộ, Vợ, Con, Ông/Bà..."
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
          </div>

          {/* MÀU ĐẠI DIỆN */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Màu đại diện
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setColor(opt.key)}
                  title={opt.label}
                  className={`w-9 h-9 rounded-full border-2 transition-spring flex items-center justify-center ${
                    color === opt.key
                      ? "border-slate-900 dark:border-white scale-110 shadow-md"
                      : "border-transparent hover:scale-105"
                  } ${opt.swatch}`}
                >
                  {color === opt.key && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Email{" "}
              <span className="text-[11px] text-slate-400 font-normal">
                (tùy chọn)
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-spring"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-spring shadow-sm shadow-indigo-600/30 btn-press"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {loading
                ? "Đang lưu..."
                : editMember
                  ? "Cập nhật"
                  : "Thêm thành viên"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-spring btn-press"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
