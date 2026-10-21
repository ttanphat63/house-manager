"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function removeMember(memberId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .select("id");

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, message: "Không xóa được (không có quyền hoặc thành viên không tồn tại)." };
  }

  revalidatePath("/protected/settings");
  return { ok: true };
}
