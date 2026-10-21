"use server";

import { setActiveGroupId, clearActiveGroupId } from "@/lib/group-context";
import { revalidatePath } from "next/cache";

export async function setActiveGroupAction(groupId: string): Promise<void> {
  await setActiveGroupId(groupId);
  revalidatePath("/protected", "layout");
}

export async function clearActiveGroupAction(): Promise<void> {
  await clearActiveGroupId();
  revalidatePath("/protected", "layout");
}
