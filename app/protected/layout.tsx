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

  // 2. Kiểm tra user có ít nhất 1 group không
  let hasGroup = false;
  if (userId) {
    const { data: userGroups } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .limit(1);
    hasGroup = Boolean(userGroups && userGroups.length > 0);
  }

  const hasActiveCookie = !!(await getActiveGroupId());

  // 3. Guard Onboarding:
  // Nếu chưa có group VÀ chưa có cookie VÀ không phải trang onboarding -> redirect onboarding
  if (!hasGroup && !hasActiveCookie && !isOnboardingPage) {
    redirect("/protected/onboarding");
  }

  // Nếu đã có group VÀ đang ở trang onboarding -> redirect về trang chủ protected
  if (hasGroup && isOnboardingPage) {
    redirect("/protected");
  }

  return (
    <DashboardShell userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}

