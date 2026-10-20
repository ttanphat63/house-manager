import { cookies } from "next/headers";

const COOKIE_KEY = "active_group_id";

export async function getActiveGroupId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_KEY)?.value || null;
}

export async function setActiveGroupId(groupId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY, groupId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

export async function clearActiveGroupId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_KEY);
}
