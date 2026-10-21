"use server";

import { setActiveGroupId } from "@/lib/group-context";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function switchGroupAction(groupId: string): Promise<void> {
  await setActiveGroupId(groupId);
  revalidatePath("/protected", "layout");
}

export async function kickMemberAction(groupId: string, userId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // Xóa cache của trang settings
  revalidatePath("/protected/settings");
  return { success: true };
}
