import { getActiveGroupId } from "@/lib/group-context";
import { redirect } from "next/navigation";
import { EditBillClient } from "@/components/edit-bill-client";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const groupId = await getActiveGroupId();
  if (!groupId) {
    redirect("/protected/onboarding");
  }

  return <EditBillClient billId={id} groupId={groupId} />;
}
