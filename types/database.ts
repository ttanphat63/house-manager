export type Member = {
  id: string;
  user_id: string;
  name: string;
  role: string;
  color: string;
  email: string | null;
  created_at: string;
};

export type Bill = {
  id: string;
  user_id: string;
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
  bill_id: string;
  member_id: string;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  note: string | null;
  created_at: string;
  member?: Member;
};
