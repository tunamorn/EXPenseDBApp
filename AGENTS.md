# MyExpense — คำสั่งสำหรับ AI agent

แอปบันทึกรายจ่ายส่วนตัวภาษาไทย ผู้ใช้คนเดียว **ไม่มีระบบ login** เก็บข้อมูลบน Supabase (PostgreSQL)

## This is NOT the Next.js you know

เวอร์ชันนี้มี breaking changes — API, convention และโครงไฟล์อาจต่างจากที่โมเดลเคยเรียนมา
**อ่านคู่มือที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดทุกครั้ง** และให้ความสำคัญกับประกาศ deprecation

## Stack

| ส่วน | เวอร์ชัน / เครื่องมือ |
| --- | --- |
| Framework | Next.js 16.2.12 (App Router, Turbopack) |
| UI | React 19.2.4 + TypeScript strict |
| CSS | Tailwind CSS v4 (`@theme` ใน `src/app/globals.css` ไม่มีไฟล์ `tailwind.config`) |
| ฐานข้อมูล | Supabase — project `zotlxdelkksignnwtonf` (ap-southeast-1) |
| Client | `@supabase/supabase-js` v2 |
| Deploy | Vercel — project `myexpense` |

## โครงสร้างไฟล์

```
src/app/layout.tsx        ฟอนต์ Noto Sans Thai + metadata
src/app/page.tsx          หน้าเดียวของแอป ถือ state ทั้งหมด เรียก CRUD
src/app/globals.css       design tokens ของ 9Expert CI (ห้ามแก้ค่าสีโดยไม่ถาม)
src/components/           ExpenseForm, ExpenseTable, Filters, CategorySummary
src/lib/supabase.ts       สร้าง client ตัวเดียวจาก env vars
src/lib/expenses.ts       ชั้นเข้าถึงข้อมูลทั้งหมด (list/create/update/delete)
src/lib/types.ts          type Expense
src/lib/categories.ts     CATEGORIES, CATEGORY_COLOR, formatBaht, today
src/lib/validate.ts       ตรวจฟอร์มก่อนบันทึก คืนข้อความเตือนภาษาไทย
supabase/myexpense-seed.sql  สคริปต์สร้างตาราง + ข้อมูลตัวอย่าง 8 แถว
```

## กติกาที่ต้องรักษา

**ชั้นข้อมูล** — เข้าถึง Supabase ผ่าน `src/lib/expenses.ts` เท่านั้น ห้าม `import { supabase }` ตรงใน component
ถ้าต้องการ query แบบใหม่ ให้เพิ่มฟังก์ชันใน `expenses.ts` แล้วให้ component เรียกฟังก์ชันนั้น

**หมวดค่าใช้จ่าย** — `CATEGORIES` ใน `src/lib/categories.ts` เป็นแหล่งความจริงเดียว
6 หมวด: อาหาร, เดินทาง, ช้อปปิ้ง, ค่าบ้าน, สุขภาพ, อื่น ๆ — ห้าม hardcode ชื่อหมวดที่อื่น

**ข้อความ UI ทั้งหมดเป็นภาษาไทย** รวมถึงข้อความ error ที่ผู้ใช้เห็น คอมเมนต์ในโค้ดก็เขียนภาษาไทย

**สี** — ใช้ token จาก `globals.css` เท่านั้น (`bg-brand`, `text-navy`, `ring-line` …)
ห้ามใช้โทนอุ่น (ส้ม แดง เหลือง อำพัน) ทุกกรณี — ข้อความเตือน/สถานะผิดพลาดใช้ `text-navy` บนพื้น `bg-mist`
ห้ามใส่ hex สีตรงใน component

**จำนวนเงิน** — แสดงผ่าน `formatBaht()` เสมอ ไม่ format เอง

**การตรวจข้อมูล** — เพิ่มกฎใหม่ที่ `src/lib/validate.ts` ไม่ใช่ในตัว component
กฎปัจจุบัน: เงิน > 0 และ ≤ 500,000 / วันที่ไม่เป็นอนาคต / ต้องเลือกหมวด
`amount` มี `CHECK (amount > 0)` ที่ฝั่งฐานข้อมูลด้วย — กฎสองฝั่งต้องไม่ขัดกัน

**`note` ว่าง** — ในฐานข้อมูลเก็บเป็น `null` ในแอปใช้ `""` การแปลงอยู่ใน `expenses.ts` แล้ว อย่าทำซ้ำที่อื่น

## ฐานข้อมูล

ตารางเดียว `public.expenses` — `id` (bigint identity, PK), `expense_date` (date, not null),
`category` (text, not null), `amount` (numeric(12,2), CHECK > 0), `note` (text, null ได้),
`created_at` (timestamptz, default now())

ทุกคอลัมน์มี comment ภาษาไทยกำกับ ดูสคริปต์เต็มที่ `supabase/myexpense-seed.sql`

⚠️ **สคริปต์ seed ขึ้นต้นด้วย `DROP TABLE IF EXISTS`** — รันแล้วข้อมูลจริงหายทั้งหมด ห้ามรันซ้ำโดยไม่ถามเจ้าของโปรเจกต์

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**ตอนพัฒนา (local):** อยู่ใน `.env.local` (ไม่เข้า git) — ดูชื่อตัวแปรได้จาก `.env.local.example` ที่ commit ขึ้น repo ได้

**ตอน production:** ตั้งเป็น Environment Variables ในหน้า Settings ของโปรเจกต์ Vercel
**ห้ามแนบไฟล์ `.env.production` ไปกับ deploy** — Vercel เตือนใน build log ว่าควรใช้ env handling ของตัวเอง
และการฝังค่าไว้ในไฟล์ที่ deploy ทำให้แก้ค่าไม่ได้โดยไม่ deploy ใหม่

ค่าเหล่านี้ถูกฝังลง bundle ฝั่งเบราว์เซอร์ตอน build จึงเป็นข้อมูลสาธารณะ

ถ้าตัวแปรใดยังไม่ได้ตั้งค่า `src/lib/supabase.ts` จะ export `supabase` เป็น `null`
และ `src/app/page.tsx` จะแสดงการ์ดบอกวิธีตั้งค่าเป็นภาษาไทย — **ห้ามเปลี่ยนเป็น throw ตอน import** เพราะจะทำให้หน้าเว็บกลายเป็นจอขาว
**ห้ามใส่ service role key หรือ secret ใด ๆ ในตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_`**

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # dev server ที่ http://localhost:3000
npm run build    # ตรวจ TypeScript + build production
npm run lint
```

รัน `npm run build` ก่อนเสมอเมื่อแก้โค้ดเสร็จ — เป็นด่านตรวจ type เดียวที่มีในโปรเจกต์นี้ (ไม่มีชุดทดสอบ)

## ข้อจำกัดที่รู้อยู่ (อย่า "แก้" โดยไม่ถาม)

- **RLS ปิดอยู่** ที่ตาราง `expenses` — เจ้าของโปรเจกต์เลือกไว้เอง ใครที่มี publishable key อ่าน/แก้/ลบได้ทุกแถว
  การเปิด RLS โดยไม่สร้าง policy จะทำให้แอปพังทันที ต้องคุยกับเจ้าของก่อน
- ไม่มีระบบ login และไม่มีคอลัมน์ `user_id` — เป็นแอปผู้ใช้คนเดียวโดยเจตนา
- `README.md` เป็นเอกสาร checkpoint ของคอร์ส เนื้อหาบางส่วนล้าสมัย (ยังบอกว่าไม่มีฐานข้อมูล) — ยึด AGENTS.md เป็นหลัก
