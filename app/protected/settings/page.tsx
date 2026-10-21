import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getActiveGroupId } from "@/lib/group-context";
import { SettingsClient, type GroupMemberDetail } from "@/components/settings-client";
import { type Group } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();

  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const userId = authData.claims.sub as string;
  const userEmail = (authData.claims.email as string) || "";

  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  // 1. Fetch group details
  const { data: groupData, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (groupError || !groupData) {
    redirect("/protected/onboarding");
  }

  const group = groupData as Group;
  const isOwner = group.owner_id === userId;

  // 2. Fetch group members (group_members là NGUỒN SỰ THẬT DUY NHẤT)
  const { data: gmData } = await supabase
    .from("group_members")
    .select("id, user_id, role, joined_at")
    .eq("group_id", groupId);

  // RPC get_group_members chỉ dùng để bổ sung metadata nếu có
  const { data: rpcData } = await supabase.rpc("get_group_members", {
    target_group_id: groupId,
  });
  const rpcByUser = new Map(
    (Array.isArray(rpcData) ? (rpcData as Array<{ user_id: string; email?: string; name?: string }>) : []).map((r) => [r.user_id, r])
  );

  // 3. Fetch house members table (for display names / emails if linked)
  const { data: houseMembers } = await supabase
    .from("members")
    .select("name, email, user_id")
    .eq("group_id", groupId);

  const houseMemberMap = new Map<string, { name: string; email: string | null }>();
  (houseMembers || []).forEach((m) => {
    if (m.user_id) {
      houseMemberMap.set(m.user_id, { name: m.name, email: m.email });
    }
  });

  // 4. Build members array (100% dựa trên group_members, id LUÔN là gm.id)
  const members: GroupMemberDetail[] = (gmData || []).map((gm) => {
    const matchedHouse = houseMemberMap.get(gm.user_id);
    const matchedRpc = rpcByUser.get(gm.user_id);
    const isThisUser = gm.user_id === userId;

    const email = isThisUser
      ? userEmail
      : matchedRpc?.email || matchedHouse?.email || "";

    const name = matchedHouse?.name || matchedRpc?.name || (email ? email.split("@")[0] : undefined);

    const role: "owner" | "admin" | "member" =
      gm.user_id === group.owner_id ? "owner" : (gm.role || "member");

    return {
      id: gm.id,
      user_id: gm.user_id,
      email: email,
      name: name,
      role: role,
      joined_at: gm.joined_at || new Date().toISOString(),
    };
  });

  // Ensure owner is at the top of the list
  members.sort((a, b) => {
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    return a.joined_at.localeCompare(b.joined_at);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* BREADCRUMB HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/protected"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-spring btn-press shrink-0"
            title="Quay lại Dashboard"
            aria-label="Quay lại Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <span>Cài đặt nhóm</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Quản lý thông tin, thành viên và quyền của nhóm &quot;{group.name}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* CLIENT SETTINGS COMPONENT */}
      <SettingsClient
        group={group}
        members={members}
        currentUserId={userId}
        currentUserEmail={userEmail}
        isOwner={isOwner}
      />
    </div>
  );
}
