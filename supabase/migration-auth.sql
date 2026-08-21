-- ============================================================
-- MyExpense : เพิ่มระบบผู้ใช้หลายคน (รันครั้งเดียวใน SQL Editor)
--
-- สคริปต์นี้ไม่ลบข้อมูลเดิม รันซ้ำได้อย่างปลอดภัย
-- หลังรันเสร็จ เบราว์เซอร์จะแตะตารางไม่ได้อีก (RLS เปิดแบบไม่มี policy)
-- แอปจะเข้าถึงข้อมูลผ่าน Route Handler ฝั่ง server ด้วย service role key เท่านั้น
-- ============================================================

-- ตารางผู้ใช้ เก็บรหัสผ่านเป็น bcrypt hash ห้ามเก็บรหัสผ่านดิบ
create table if not exists public.app_users (
  id            uuid        primary key default gen_random_uuid(),
  username      text        not null unique,
  password_hash text        not null,
  display_name  text        not null,
  created_at    timestamptz not null default now()
);

comment on table  public.app_users               is 'ผู้ใช้ของแอป MyExpense — สร้างบัญชีโดยเจ้าของโปรเจกต์เท่านั้น ไม่มีหน้าสมัครสมาชิก';
comment on column public.app_users.id            is 'รหัสประจำผู้ใช้ สร้างค่าอัตโนมัติ และเป็นคีย์หลัก';
comment on column public.app_users.username      is 'ชื่อผู้ใช้สำหรับ login ห้ามซ้ำกัน';
comment on column public.app_users.password_hash is 'รหัสผ่านที่ผ่าน bcrypt แล้ว ห้ามเก็บรหัสผ่านดิบเด็ดขาด';
comment on column public.app_users.display_name  is 'ชื่อที่แสดงบนหน้าเว็บ เช่น "สวัสดี สมชาย"';
comment on column public.app_users.created_at    is 'เวลาที่สร้างบัญชีนี้';

-- เพิ่มคอลัมน์เจ้าของรายจ่าย ปล่อย null ได้ชั่วคราวสำหรับข้อมูลเดิมที่ยังไม่มีเจ้าของ
alter table public.expenses
  add column if not exists user_id uuid references public.app_users(id) on delete cascade;

comment on column public.expenses.user_id is 'เจ้าของรายจ่ายแถวนี้ อ้างถึง app_users.id — null คือข้อมูลเก่าที่ยังไม่มีเจ้าของ';

-- ดัชนีช่วยตอนกรองรายจ่ายของผู้ใช้แต่ละคน
create index if not exists expenses_user_id_expense_date_idx
  on public.expenses (user_id, expense_date desc);

-- ------------------------------------------------------------
-- ปิดประตูฝั่งเบราว์เซอร์
-- เปิด RLS แบบไม่สร้าง policy = role anon และ authenticated เข้าไม่ได้เลย
-- service_role ข้าม RLS อยู่แล้ว จึงมีแต่ฝั่ง server ที่อ่าน/เขียนได้
-- ------------------------------------------------------------
alter table public.expenses  enable row level security;
alter table public.app_users enable row level security;

-- ตรวจผล
select
  (select count(*) from public.app_users) as users,
  (select count(*) from public.expenses)  as expenses,
  (select count(*) from public.expenses where user_id is null) as expenses_ยังไม่มีเจ้าของ;
