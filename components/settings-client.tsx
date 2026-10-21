"use client";

import React, { useState, useEffect, useOptimistic, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Copy,
  Check,
  ShieldCheck,
  UserMinus,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { clearActiveGroupAction } from "@/lib/group-actions";
import { removeMember } from "@/app/protected/settings/actions";
import { type Group } from "@/types/database";

export interface GroupMemberDetail {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface SettingsClientProps {
  group: Group;
  members: GroupMemberDetail[];
  currentUserId: string;
  currentUserEmail: string;
  isOwner: boolean;
}

// ─────────────────────────────────────────────
// Confirm Modal Sub-component
// ─────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText: string;
  loading: boolean;
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  loading,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-xl transition-all shadow-sm shadow-rose-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function SettingsClient({
  group,
  members,
  currentUserId,
  isOwner,
}: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Rename state
  const [groupName, setGroupName] = useState(group.name);
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Confirm delete member dialog state
  const [memberToConfirmDelete, setMemberToConfirmDelete] = useState<GroupMemberDetail | null>(null);

  // Leave state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Optimistic Members state using useOptimistic & useTransition
  const [isPending, startTransition] = useTransition();
  const [optimisticMembers, removeOptimistic] = useOptimistic(
    members,
    (state, removedId: string) => state.filter((m) => m.id !== removedId)
  );

  // Keep state updated if prop changes
  useEffect(() => {
    setGroupName(group.name);
  }, [group.name]);

  const hasNameChanged =
    groupName.trim() !== group.name && groupName.trim().length > 0;

  // Handler: Rename group
  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner || !hasNameChanged) return;

    setSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    const { error } = await supabase
      .from("groups")
      .update({ name: groupName.trim() })
      .eq("id", group.id);

    setSavingName(false);
    if (error) {
      setNameError(error.message);
    } else {
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2500);
      router.refresh();
    }
  }

  // Handler: Copy invite code
  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Lỗi khi sao chép mã mời:", err);
    }
  }

  // Handler: Remove member
  function handleRemove(memberId: string) {
    startTransition(async () => {
      removeOptimistic(memberId);
      const res = await removeMember(memberId);
      if (!res.ok) {
        alert(res.message);
      }
    });
  }

  // Handler: Leave group
  async function confirmLeave() {
    if (isOwner) return;

    setLeaveLoading(true);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", currentUserId);

    if (!error) {
      await clearActiveGroupAction();
      router.push("/protected");
      router.refresh();
    } else {
      setLeaveLoading(false);
      alert("Lỗi khi rời nhóm: " + error.message);
    }
  }

  // Handler: Delete group
  async function confirmDelete() {
    if (!isOwner) return;

    setDeleteLoading(true);
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", group.id);

    if (!error) {
      await clearActiveGroupAction();
      router.push("/protected");
      router.refresh();
    } else {
      setDeleteLoading(false);
      alert("Lỗi khi xóa nhóm: " + error.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────
          THẺ 1: THÔNG TIN NHÓM
      ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              Thông tin nhóm
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quản lý tên hiển thị và mã chia sẻ của nhóm
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {/* Form đổi tên */}
          <form onSubmit={handleRename} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tên nhóm
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={!isOwner || savingName}
                maxLength={50}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                placeholder="Nhập tên nhóm..."
              />
              {isOwner && hasNameChanged && (
                <button
                  type="submit"
                  disabled={savingName}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm shadow-indigo-600/20 shrink-0"
                >
                  {savingName ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {nameSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã đổi tên nhóm thành công!
              </p>
            )}
            {nameError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                Lỗi: {nameError}
              </p>
            )}
            {!isOwner && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Chỉ Chủ nhóm (Owner) mới có quyền đổi tên nhóm.
              </p>
            )}
          </form>

          {/* Mã mời (Invite Code) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã mời tham gia nhóm (Invite Code)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                <code className="text-base font-mono font-bold tracking-wider text-slate-900 dark:text-slate-100">
                  {group.invite_code}
                </code>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  8 ký tự
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs sm:text-sm rounded-xl border border-indigo-200/60 dark:border-indigo-800/60 transition-all shrink-0 cursor-pointer"
                title="Sao chép mã mời"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Đã copy!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép mã</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Chia sẻ mã này cho bạn cùng nhà để họ có thể nhập tại trang Onboarding và tham gia nhóm.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          THẺ 2: DANH SÁCH THÀNH VIÊN
      ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Thành viên nhóm ({optimisticMembers.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Danh sách các tài khoản đang tham gia nhóm này
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {optimisticMembers.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Chưa có thành viên nào khác trong nhóm.
            </p>
          ) : (
            optimisticMembers.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isMemberOwner = member.role === "owner";
              const displayName =
                member.name ||
                (member.email ? member.email.split("@")[0] : `User ${member.user_id.slice(0, 6)}`);
              const initialLetter = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={member.id}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar letter */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isMemberOwner
                          ? "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      }`}
                    >
                      {initialLetter}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Bạn
                          </span>
                        )}
                        {isMemberOwner ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <ShieldCheck className="w-3 h-3" />
                            Chủ nhóm
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Thành viên
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action: Kick (Owner only, cannot kick self) */}
                  {isOwner && !isMemberOwner && !isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => setMemberToConfirmDelete(member)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          THẺ 3: VÙNG NGUY HIỂM (DANGER ZONE)
      ───────────────────────────────────────────── */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">
            {isOwner ? "Xóa nhóm này" : "Rời khỏi nhóm"}
          </h3>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
            {isOwner
              ? "Xóa vĩnh viễn nhóm này cùng toàn bộ hóa đơn, phân chia tiền và việc nhà."
              : "Rời khỏi nhóm hiện tại. Bạn sẽ mất quyền truy cập vào dữ liệu của nhóm này."}
          </p>
        </div>
        <button
          type="button"
          onClick={isOwner ? () => setShowDeleteConfirm(true) : () => setShowLeaveConfirm(true)}
          className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {isOwner ? "Xóa nhóm" : "Rời nhóm"}
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          CONFIRM MODALS
      ───────────────────────────────────────────── */}

      {/* Modal: Xác nhận xóa thành viên */}
      {memberToConfirmDelete &&
        createPortal(
          <div className="fixed inset-0 z-9999 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800">
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Xóa thành viên khỏi nhóm
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bạn có chắc muốn xóa <strong>{memberToConfirmDelete.email}</strong> khỏi nhóm?{" "}
                  Họ sẽ không thể truy cập vào dữ liệu nhóm nữa.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToConfirmDelete(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRemove(memberToConfirmDelete.id);
                    setMemberToConfirmDelete(null);
                  }}
                  disabled={isPending}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Đang xóa..." : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}


      {/* Modal: Xác nhận Rời nhóm */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        onConfirm={confirmLeave}
        title="Rời khỏi nhóm"
        description={
          <>
            Bạn có chắc chắn muốn rời nhóm{" "}
            <strong className="text-slate-900 dark:text-slate-100">&quot;{group.name}&quot;</strong>?
            Bạn sẽ không xem được các hóa đơn và việc nhà của nhóm này nữa.
          </>
        }
        confirmText="Rời nhóm"
        loading={leaveLoading}
      />

      {/* Modal: Xác nhận Xóa nhóm */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Xóa nhóm vĩnh viễn"
        description={
          <>
            <span className="text-rose-600 font-semibold block mb-1">
              ⚠️ Cảnh báo: Hành động này không thể hoàn tác!
            </span>
            Toàn bộ hóa đơn, bảng chia tiền, danh sách việc nhà và thành viên của nhóm{" "}
            <strong className="text-slate-900 dark:text-slate-100">&quot;{group.name}&quot;</strong> sẽ bị
            xóa vĩnh viễn khỏi hệ thống.
          </>
        }
        confirmText="Xác nhận xóa nhóm"
        loading={deleteLoading}
      />
    </div>
  );
}
