-- Chạy trong Supabase SQL Editor để tạo bảng sổ cầu an.
create table if not exists public.prayers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ẩn danh',
  wish text not null,
  created_at timestamptz not null default now()
);

-- Bật Row Level Security
alter table public.prayers enable row level security;

-- Cho phép mọi người XEM (ẩn danh) và GHI lời nguyện,
-- nhưng không sửa/xóa của người khác.
create policy "Ai cũng đọc được lời nguyện"
  on public.prayers for select
  using (true);

create policy "Ai cũng thêm được lời nguyện"
  on public.prayers for insert
  with check (char_length(wish) between 1 and 240);

-- ================= Sổ công đức =================
create table if not exists public.merits (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ẩn danh',
  amount integer not null check (amount >= 1000),
  created_at timestamptz not null default now()
);

alter table public.merits enable row level security;

create policy "Ai cũng đọc được công đức"
  on public.merits for select
  using (true);

create policy "Ai cũng gieo được công đức"
  on public.merits for insert
  with check (amount >= 1000 and amount <= 100000000);
