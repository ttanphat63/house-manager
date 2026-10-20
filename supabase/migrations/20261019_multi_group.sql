-- =============================================
-- PHASE 5.5a: Multi-Group Architecture Migration
-- ⚠️ BACKUP DATABASE TRƯỚC KHI CHẠY
-- =============================================

-- ---------------------------------------------
-- Bước 1: Tạo bảng groups
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  avatar_emoji text DEFAULT '🏠',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ---------------------------------------------
-- Bước 2: Tạo bảng group_members (junction table)
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- ---------------------------------------------
-- Bước 3: Thêm cột group_id (nullable) vào 4 bảng hiện tại
-- ---------------------------------------------
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.chores ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.bill_splits ADD COLUMN IF NOT EXISTS group_id uuid
  REFERENCES public.groups(id) ON DELETE CASCADE;

-- ---------------------------------------------
-- Bước 4: Data Migration: Tạo 1 group mặc định cho mỗi user hiện có
-- ---------------------------------------------
DO $$
DECLARE
  r RECORD;
  new_group_id uuid;
BEGIN
  FOR r IN (
    SELECT DISTINCT user_id FROM public.bills
    UNION SELECT DISTINCT user_id FROM public.members
    UNION SELECT DISTINCT user_id FROM public.chores
    UNION SELECT DISTINCT user_id FROM public.bill_splits
  ) LOOP
    -- 4.1. Tạo group mặc định "Gia đình"
    INSERT INTO public.groups (name, owner_id)
    VALUES ('Gia đình', r.user_id)
    RETURNING id INTO new_group_id;

    -- 4.2. Thêm owner vào group_members
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, r.user_id, 'owner')
    ON CONFLICT DO NOTHING;

    -- 4.3. Backfill group_id cho bills, members, chores, bill_splits
    UPDATE public.bills SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;

    UPDATE public.members SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;

    UPDATE public.chores SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;

    UPDATE public.bill_splits SET group_id = new_group_id
      WHERE user_id = r.user_id AND group_id IS NULL;
  END LOOP;
END $$;

-- ---------------------------------------------
-- Bước 5: Đặt ràng buộc NOT NULL cho group_id sau khi đã backfill
-- ---------------------------------------------
ALTER TABLE public.bills ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.chores ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.bill_splits ALTER COLUMN group_id SET NOT NULL;

-- ---------------------------------------------
-- Bước 6: Tạo Indexes tối ưu hiệu năng truy vấn
-- ---------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON public.bills(group_id);
CREATE INDEX IF NOT EXISTS idx_members_group_id ON public.members(group_id);
CREATE INDEX IF NOT EXISTS idx_chores_group_id ON public.chores(group_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_group_id ON public.bill_splits(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON public.groups(invite_code);

-- ---------------------------------------------
-- Bước 7: Row Level Security (RLS) cho groups và group_members
-- ---------------------------------------------
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Policies cho public.groups
DROP POLICY IF EXISTS "Members see their groups" ON public.groups;
CREATE POLICY "Members see their groups" ON public.groups
  FOR SELECT USING (
    id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Owner manages group" ON public.groups;
CREATE POLICY "Owner manages group" ON public.groups
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users create groups" ON public.groups;
CREATE POLICY "Users create groups" ON public.groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Policies cho public.group_members
DROP POLICY IF EXISTS "Members see group members" ON public.group_members;
CREATE POLICY "Members see group members" ON public.group_members
  FOR SELECT USING (
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users join groups" ON public.group_members;
CREATE POLICY "Users join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner/self can delete membership" ON public.group_members;
CREATE POLICY "Owner/self can delete membership" ON public.group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR group_id IN (SELECT id FROM public.groups WHERE owner_id = auth.uid())
  );

-- =============================================
-- VERIFICATION QUERIES (Chạy sau khi migration để kiểm tra)
-- =============================================
-- SELECT count(*) FROM public.bills;              -- Kỳ vọng: 5
-- SELECT count(*) FROM public.members;            -- Kỳ vọng: 3
-- SELECT count(*) FROM public.chores;             -- Kỳ vọng: 2
-- SELECT count(*) FROM public.bill_splits;        -- Kỳ vọng: 3
-- SELECT count(*) FROM public.groups;             -- Kỳ vọng: 1 (mỗi user 1 group)
-- SELECT * FROM public.groups;                    -- Xác nhận tên "Gia đình" & invite_code đã sinh
-- SELECT count(*) FROM public.group_members;      -- Kỳ vọng: 1 (role 'owner')
-- SELECT count(*) FROM public.bills WHERE group_id IS NULL;        -- Kỳ vọng: 0
-- SELECT count(*) FROM public.members WHERE group_id IS NULL;      -- Kỳ vọng: 0
-- SELECT count(*) FROM public.chores WHERE group_id IS NULL;       -- Kỳ vọng: 0
-- SELECT count(*) FROM public.bill_splits WHERE group_id IS NULL;  -- Kỳ vọng: 0
