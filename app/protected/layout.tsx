export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userEmail = data?.claims?.email as string | undefined;

  return (
    <DashboardShell userEmail={userEmail}>
      {children}
    </DashboardShell>
  );
}
