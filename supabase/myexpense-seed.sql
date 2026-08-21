-- ============================================================
-- MyExpense : สร้างตาราง expenses + ข้อมูลตัวอย่างสำหรับทดสอบ
-- คัดลอกทั้งไฟล์นี้ไปวางใน Supabase SQL Editor แล้วกด Run
-- สคริปต์นี้รันซ้ำได้ (ลบตารางเดิมทิ้งก่อนทุกครั้ง)
-- ============================================================

-- ลบตารางเดิมทิ้งก่อน เพื่อให้รันซ้ำได้โดยไม่ error
drop table if exists public.expenses;

-- ตารางเดียวของแอป เก็บรายจ่าย 1 รายการต่อ 1 แถว
create table public.expenses (
  id           bigint generated always as identity primary key,
  expense_date date        not null,
  category     text        not null,
  amount       numeric(12, 2) not null check (amount > 0),
  note         text,
  created_at   timestamptz not null default now()
);

-- คำอธิบายภาษาไทยของตารางและทุกคอลัมน์
comment on table  public.expenses            is 'ตารางรายจ่ายของแอป MyExpense เก็บรายจ่าย 1 รายการต่อ 1 แถว';
comment on column public.expenses.id           is 'รหัสประจำแถว สร้างค่าอัตโนมัติ และเป็นคีย์หลัก (primary key)';
comment on column public.expenses.expense_date is 'วันที่ที่เกิดรายจ่าย (ชนิดวันที่ ห้ามว่าง)';
comment on column public.expenses.category     is 'หมวดของรายจ่าย เช่น อาหาร เดินทาง ช้อปปิ้ง ค่าบ้าน สุขภาพ อื่น ๆ (ห้ามว่าง)';
comment on column public.expenses.amount       is 'จำนวนเงิน ทศนิยม 2 ตำแหน่ง ต้องมากกว่า 0 เสมอ';
comment on column public.expenses.note         is 'บันทึกช่วยจำ ปล่อยว่างได้';
comment on column public.expenses.created_at   is 'เวลาที่สร้างแถวนี้ บันทึกโดยอัตโนมัติ';

-- ------------------------------------------------------------
-- ข้อมูลตัวอย่าง 8 แถวของเดือนนี้ (สิงหาคม 2026) ครอบคลุม 6 หมวด
-- และมี 2 แถวที่ปล่อย note ว่าง (null)
-- ------------------------------------------------------------
insert into public.expenses (expense_date, category, amount, note) values
  ('2026-08-02', 'อาหาร',     120.00, 'ข้าวมันไก่ + น้ำ'),
  ('2026-08-04', 'เดินทาง',    45.50, 'ค่า BTS ไปทำงาน'),
  ('2026-08-06', 'ช้อปปิ้ง',  890.00, 'เสื้อยืด 2 ตัว'),
  ('2026-08-09', 'ค่าบ้าน',  8500.00, 'ค่าเช่าห้องเดือนสิงหาคม'),
  ('2026-08-12', 'สุขภาพ',    350.00, null),
  ('2026-08-15', 'อาหาร',      75.25, 'กาแฟ + ขนมปัง'),
  ('2026-08-18', 'อื่น ๆ',    230.00, 'ค่าอินเทอร์เน็ตรายเดือน'),
  ('2026-08-20', 'เดินทาง',   180.00, null);

-- ตรวจผลลัพธ์ (ควรได้ 8 แถว)
select * from public.expenses order by expense_date;
