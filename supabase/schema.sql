-- ==============================================================================
-- 1. MEMBERS TABLE
-- Quản lý thành viên gia đình để phân chia hóa đơn và công việc nhà
-- ==============================================================================

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text not null default 'Thành viên',
  color text not null default 'indigo',
  email text,
  created_at timestamptz default now() not null
);

create index if not exists members_user_id_idx on public.members(user_id);

alter table public.members enable row level security;

-- Policies for members table
drop policy if exists "Users can view own members" on public.members;
create policy "Users can view own members"
  on public.members for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own members" on public.members;
create policy "Users can insert own members"
  on public.members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own members" on public.members;
create policy "Users can update own members"
  on public.members for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own members" on public.members;
create policy "Users can delete own members"
  on public.members for delete
  using (auth.uid() = user_id);


-- ==============================================================================
-- 2. BILL_SPLITS TABLE (Split Bill Feature)
-- Chia tiền hóa đơn cho từng thành viên và theo dõi trạng thái thanh toán
-- ==============================================================================

create table if not exists public.bill_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  bill_id uuid references public.bills(id) on delete cascade not null,
  member_id uuid references public.members(id) on delete cascade not null,
  amount numeric not null check (amount >= 0),
  paid boolean not null default false,
  paid_date timestamptz,
  note text,
  created_at timestamptz default now() not null,
  unique (bill_id, member_id)
);

create index if not exists bill_splits_user_id_idx on public.bill_splits(user_id);
create index if not exists bill_splits_bill_id_idx on public.bill_splits(bill_id);
create index if not exists bill_splits_member_id_idx on public.bill_splits(member_id);

alter table public.bill_splits enable row level security;

-- Policies for bill_splits table
drop policy if exists "Users can view own bill splits" on public.bill_splits;
create policy "Users can view own bill splits"
  on public.bill_splits for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bill splits" on public.bill_splits;
create policy "Users can insert own bill splits"
  on public.bill_splits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bill splits" on public.bill_splits;
create policy "Users can update own bill splits"
  on public.bill_splits for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own bill splits" on public.bill_splits;
create policy "Users can delete own bill splits"
  on public.bill_splits for delete
  using (auth.uid() = user_id);
