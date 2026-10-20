"use server";

import { setActiveGroupId } from "@/lib/group-context";
import { revalidatePath } from "next/cache";

export async function switchGroupAction(groupId: string): Promise<void> {
  await setActiveGroupId(groupId);
  revalidatePath("/protected", "layout");
}
