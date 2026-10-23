-- Policy: Cho phép user insert thông báo cho chính mình
create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);
