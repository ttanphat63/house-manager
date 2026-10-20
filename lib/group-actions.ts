"use server";

import { setActiveGroupId, clearActiveGroupId } from "@/lib/group-context";

export async function setActiveGroupAction(groupId: string): Promise<void> {
  await setActiveGroupId(groupId);
}

export async function clearActiveGroupAction(): Promise<void> {
  await clearActiveGroupId();
}
