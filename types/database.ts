export type Group = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  avatar_emoji: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
};

export type Member = {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  role: string;
  color: string;
  email: string | null;
  created_at: string;
};

export type Bill = {
  id: string;
  user_id: string;
  group_id: string;
  type: "electric" | "water" | "net" | "other";
  title: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  note: string | null;
  created_at?: string;
};

export type BillSplit = {
  id: string;
  user_id: string;
  group_id: string;
  bill_id: string;
  member_id: string;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  note: string | null;
  created_at: string;
  member?: Member;
};

export type Chore = {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  assigned_to: string | null;
  frequency: "daily" | "weekly" | "monthly" | "once";
  next_due: string | null;
  done: boolean;
  done_at: string | null;
  photo_url?: string | null;
  note: string | null;
  priority: "high" | "normal" | "low";
  created_at: string;
  updated_at?: string;
};

