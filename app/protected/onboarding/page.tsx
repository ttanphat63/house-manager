"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setActiveGroupAction } from "@/lib/group-actions";
import { Home, Link2, Sparkles, Loader2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Create Group State
  const [groupName, setGroupName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join Group State
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Handle Create Group
  // ─────────────────────────────────────────────
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setCreateError("Vui lòng nhập tên nhóm của bạn");
      return;
    }

    setCreateLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/auth/login");
        return;
      }

      // 1. Insert into groups
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          owner_id: user.id,
        })
        .select("id")
        .single();

      if (groupError || !groupData) {
        setCreateError(groupError?.message || "Không thể tạo nhóm. Vui lòng thử lại.");
        setCreateLoading(false);
        return;
      }

      // 2. Insert into group_members as owner
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: groupData.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) {
        setCreateError(memberError.message);
        setCreateLoading(false);
        return;
      }

      // 3. Set active group cookie & redirect
      await setActiveGroupAction(groupData.id);
      router.push("/protected");
      router.refresh();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
      setCreateLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  // Handle Join Group
  // ─────────────────────────────────────────────
  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(null);

    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      setJoinError("Vui lòng nhập mã mời");
      return;
    }

    setJoinLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/auth/login");
        return;
      }

      // 1. Query group by invite_code
      const { data: foundGroup, error: findError } = await supabase
        .from("groups")
        .select("id, name")
        .ilike("invite_code", trimmedCode)
        .maybeSingle();

      if (findError || !foundGroup) {
        setJoinError("Mã mời không hợp lệ hoặc nhóm không tồn tại");
        setJoinLoading(false);
        return;
      }

      // 2. Insert directly into group_members as member (rely on UNIQUE constraint to prevent duplicate)
      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: foundGroup.id,
        user_id: user.id,
        role: "member",
      });

      if (joinError) {
        if (
          joinError.code === "23505" ||
          joinError.message.toLowerCase().includes("unique") ||
          joinError.message.toLowerCase().includes("duplicate")
        ) {
          setJoinError("Bạn đã ở trong nhóm này rồi");
        } else {
          setJoinError(joinError.message);
        }
        setJoinLoading(false);
        return;
      }

      // 3. Set active group cookie & redirect
      await setActiveGroupAction(foundGroup.id);
      router.push("/protected");
      router.refresh();
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
      setJoinLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
      {/* Back to dashboard */}
      <div className="w-full flex items-center justify-start mb-4">
        <Link
          href="/protected"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại Dashboard</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center max-w-lg mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bắt đầu với House Manager</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
          🏠 Chào mừng đến House Manager!
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Bạn muốn bắt đầu như thế nào? Tạo một nhóm mới cho gia đình bạn hoặc tham gia vào nhóm đã có qua mã mời.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        {/* Card 1: Tạo nhóm mới */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center flex flex-col justify-between hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-indigo-500/20">
              <Home className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tạo nhóm mới
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 min-h-[32px]">
              Tạo không gian quản lý chi tiêu và công việc riêng cho gia đình hoặc căn hộ của bạn.
            </p>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    if (createError) setCreateError(null);
                  }}
                  placeholder="Ví dụ: Gia đình tôi, Căn hộ 402..."
                  disabled={createLoading}
                  className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400"
                />
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={createLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang tạo nhóm...</span>
                  </>
                ) : (
                  <>
                    <span>Tạo nhóm ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Tham gia qua mã mời */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center flex flex-col justify-between hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
              <Link2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              Tham gia nhóm
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 min-h-[32px]">
              Nhập mã mời 8 ký tự do chủ nhóm chia sẻ để cùng tham gia quản lý nhà.
            </p>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã mời (Invite code)
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value);
                    if (joinError) setJoinError(null);
                  }}
                  placeholder="Ví dụ: a1b2c3d4"
                  disabled={joinLoading}
                  className="w-full px-4 py-3 text-sm font-mono tracking-wider bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:border-emerald-400 text-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400 placeholder:tracking-normal"
                />
              </div>

              {joinError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{joinError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={joinLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm px-4 py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {joinLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <span>Tham gia nhóm</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
