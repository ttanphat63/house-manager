export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveGroupId } from "@/lib/group-context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email as string | undefined;
  const userId = (data?.claims?.sub || data?.claims?.id) as string | undefined;

  // 1. Kiểm tra pathname hiện tại từ header x-pathname (set bởi proxy.ts) + fallback referer
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const referer = headersList.get("referer") || "";
  const isOnboardingPage = pathname
    ? pathname.startsWith("/protected/onboarding")
    : referer.includes("/protected/onboarding");

  // 2. Query danh sách groups của user qua junction table group_members
  type GroupSummary = { id: string; name: string; avatar_emoji: string };
  let userGroups: GroupSummary[] = [];

  if (userId) {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, groups (id, name, avatar_emoji)")
      .eq("user_id", userId);

    userGroups = (memberships || [])
      .map((m: any) => {
        if (!m.groups) return null;
        const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        if (!g) return null;
        return {
          id: g.id as string,
          name: g.name as string,
          avatar_emoji: (g.avatar_emoji || "🏠") as string,
        };
      })
      .filter(Boolean) as GroupSummary[];
  }

  const hasGroup = userGroups.length > 0;
  const activeGroupId = await getActiveGroupId();
  const activeGroup = userGroups.find((g) => g.id === activeGroupId) || userGroups[0] || null;

  // 3. Guard Onboarding:
  // Nếu chưa có group và chưa ở trang onboarding -> redirect onboarding
  if (!hasGroup && !isOnboardingPage) {
    redirect("/protected/onboarding");
  }

  return (
    <DashboardShell
      userEmail={userEmail}
      activeGroup={activeGroup}
      userGroups={userGroups}
    >
      {children}
    </DashboardShell>
  );
}


