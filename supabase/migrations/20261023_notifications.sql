-- Bảng notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  type text not null check (type in ('bill_due', 'member_joined', 'member_kicked', 'system')),
  title text not null,
  message text not null,
  link text, -- Đường dẫn để click vào (VD: /protected/bills)
  read boolean default false not null,
  created_at timestamptz default now() not null
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, read);

alter table public.notifications enable row level security;

-- Policy: User chỉ xem thông báo của mình
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Policy: User chỉ cập nhật (đánh dấu đã đọc) thông báo của mình
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Policy: User có thể xóa thông báo của mình
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
