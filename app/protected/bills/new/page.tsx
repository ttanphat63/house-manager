import { getActiveGroupId } from "@/lib/group-context";
import { redirect } from "next/navigation";
import { NewBillClient } from "@/components/new-bill-client";

export default async function NewBillPage() {
  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  return <NewBillClient groupId={groupId} />;
}
