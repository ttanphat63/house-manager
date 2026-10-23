"use server";

import { setActiveGroupId, getActiveGroupId } from "@/lib/group-context";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import type { Notification } from "@/types/database";

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

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching notifications:", error.message);
    return [];
  }

  return (data || []) as Notification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw new Error(error.message);
  revalidatePath("/protected", "layout");
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) throw new Error(error.message);
  revalidatePath("/protected", "layout");
}

export async function checkAndCreateBillDueNotifications() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const groupId = await getActiveGroupId();
  if (!groupId) return;

  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Lấy bills chưa đóng, sắp đến hạn trong 3 ngày tới
  const { data: bills } = await supabase
    .from("bills")
    .select("id, title, amount, due_date")
    .eq("group_id", groupId)
    .eq("paid", false)
    .lte("due_date", threeDaysLater.toISOString().split("T")[0])
    .gte("due_date", now.toISOString().split("T")[0]);

  if (!bills || bills.length === 0) return;

  // 2. Lấy các thông báo bill_due trong 24h qua để tránh spam
  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("title")
    .eq("user_id", user.id)
    .eq("type", "bill_due")
    .gte("created_at", oneDayAgo.toISOString());

  const recentTitles = new Set(recentNotifications?.map((n) => n.title) || []);

  // 3. Tạo thông báo cho các bill chưa có thông báo trong 24h qua
  for (const bill of bills) {
    const notifTitle = `Hóa đơn sắp đến hạn: ${bill.title}`;
    if (!recentTitles.has(notifTitle)) {
      const daysLeft = Math.ceil(
        (new Date(bill.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      await createNotification({
        userId: user.id,
        groupId,
        type: "bill_due",
        title: notifTitle,
        message: `Hóa đơn "${bill.title}" (${Number(bill.amount).toLocaleString("vi-VN")}₫) sẽ đến hạn trong ${daysLeft} ngày.`,
        link: "/protected/bills",
      });
    }
  }
}


