"use server";

import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types/database";

export async function createNotification({
  userId,
  groupId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  groupId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    group_id: groupId || null,
    type,
    title,
    message,
    link: link || null,
  });

  if (error) {
    console.error("Error creating notification:", error.message);
    throw new Error(error.message);
  }
}
