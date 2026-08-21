# MyExpense — คำสั่งสำหรับ AI agent

แอปบันทึกรายจ่ายส่วนตัวภาษาไทย **หลายผู้ใช้ มีระบบ login ของตัวเอง** เก็บข้อมูลบน Supabase (PostgreSQL)

## This is NOT the Next.js you know

เวอร์ชันนี้มี breaking changes — API, convention และโครงไฟล์อาจต่างจากที่โมเดลเคยเรียนมา
**อ่านคู่มือที่เกี่ยวข้องใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดทุกครั้ง** และให้ความสำคัญกับประกาศ deprecation

ที่เจอแล้วในโปรเจกต์นี้: `cookies()` เป็น async ต้อง `await`, และ `params` ของ dynamic route เป็น `Promise`

## Stack

| ส่วน | เวอร์ชัน / เครื่องมือ |
| --- | --- |
| Framework | Next.js 16.2.12 (App Router, Turbopack) |
| UI | React 19.2.4 + TypeScript strict |
| CSS | Tailwind CSS v4 (`@theme` ใน `src/app/globals.css` ไม่มีไฟล์ `tailwind.config`) |
| ฐานข้อมูล | Supabase — project `zotlxdelkksignnwtonf` (ap-southeast-1) |
| Client | `@supabase/supabase-js` v2 (ฝั่ง server เท่านั้น) |
| รหัสผ่าน | `bcryptjs` |
| Deploy | Vercel — project `myexpense` |

## สถาปัตยกรรม — อ่านก่อนแก้อะไรที่เกี่ยวกับข้อมูล

**เบราว์เซอร์ไม่คุยกับ Supabase ตรง ๆ เลย** ตาราง `expenses` และ `app_users` เปิด RLS แบบไม่มี policy
จึงเข้าถึงได้เฉพาะ `service_role` ซึ่งอยู่ฝั่ง server เท่านั้น

```
เบราว์เซอร์  →  Route Handler (/api/*)  →  supabaseAdmin (service role key)  →  Supabase
```

**ห้าม import `supabase-admin.ts` ในไฟล์ที่มี `"use client"`** จะทำให้ service role key รั่วลง bundle

## โครงสร้างไฟล์

```
src/app/layout.tsx              ฟอนต์ Noto Sans Thai + metadata
src/app/page.tsx                Server Component — ตรวจ session แล้ว redirect ไป /login ถ้ายังไม่ล็อกอิน
src/app/login/page.tsx          หน้าเข้าสู่ระบบ
src/app/globals.css             design tokens ของ 9Expert CI (ห้ามแก้ค่าสีโดยไม่ถาม)
src/app/api/login/route.ts      ตรวจรหัสผ่านด้วย bcrypt แล้วออกคุกกี้ session
src/app/api/logout/route.ts     ลบคุกกี้ session
src/app/api/expenses/route.ts   GET รายการทั้งหมดของผู้ใช้ / POST เพิ่มรายการ
src/app/api/expenses/[id]/route.ts  PATCH แก้ไข / DELETE ลบ
src/app/api/expenses/shared.ts  type Row, แปลงข้อมูล, ตรวจ payload ฝั่ง server
src/components/ExpenseApp.tsx   ตัวแอปฝั่ง client ถือ state ทั้งหมด
src/components/                 ExpenseForm, ExpenseTable, Filters, CategorySummary
src/lib/supabase-admin.ts       จุดเชื่อมต่อ Supabase จุดเดียว — server only
src/lib/session.ts              คุกกี้ session เซ็นด้วย HMAC — server only
src/lib/auth.ts                 currentUser() อ่านผู้ใช้จากคุกกี้ — server only
src/lib/expenses.ts             ชั้นเข้าถึงข้อมูลฝั่ง client — เรียก /api/expenses
src/lib/types.ts                type Expense
src/lib/categories.ts           CATEGORIES, CATEGORY_COLOR, formatBaht, today
src/lib/validate.ts             ตรวจฟอร์มฝั่ง client คืนข้อความเตือนภาษาไทย
scripts/create-user.mjs         สร้างบัญชีผู้ใช้ (ไม่มีหน้าสมัครสมาชิก)
supabase/myexpense-seed.sql     สร้างตาราง expenses + ข้อมูลตัวอย่าง 8 แถว
supabase/migration-auth.sql     เพิ่ม app_users, expenses.user_id และเปิด RLS
```

## กติกาที่ต้องรักษา

**ชั้นข้อมูล** — component เข้าถึงข้อมูลผ่าน `src/lib/expenses.ts` เท่านั้น ซึ่งเรียก Route Handler
ถ้าต้องการ query แบบใหม่ ให้เพิ่ม Route Handler ก่อน แล้วเพิ่มฟังก์ชันใน `expenses.ts` ให้ component เรียก

**เจ้าของข้อมูล** — `user_id` มาจาก session ฝั่ง server เท่านั้น **ห้ามรับ `user_id` จาก request body**
ทุก query ที่แตะ `expenses` ต้องมี `.eq("user_id", user.uid)` กำกับ ไม่งั้นผู้ใช้จะเห็นข้อมูลของคนอื่น

**หมวดค่าใช้จ่าย** — `CATEGORIES` ใน `src/lib/categories.ts` เป็นแหล่งความจริงเดียว
6 หมวด: อาหาร, เดินทาง, ช้อปปิ้ง, ค่าบ้าน, สุขภาพ, อื่น ๆ — ห้าม hardcode ชื่อหมวดที่อื่น

**ข้อความ UI ทั้งหมดเป็นภาษาไทย** รวมถึงข้อความ error ที่ผู้ใช้เห็น คอมเมนต์ในโค้ดก็เขียนภาษาไทย

**สี** — ใช้ token จาก `globals.css` เท่านั้น (`bg-brand`, `text-navy`, `ring-line` …)
ห้ามใช้โทนอุ่น (ส้ม แดง เหลือง อำพัน) ทุกกรณี — ข้อความเตือน/สถานะผิดพลาดใช้ `text-navy` บนพื้น `bg-mist`
ห้ามใส่ hex สีตรงใน component

**จำนวนเงิน** — แสดงผ่าน `formatBaht()` เสมอ ไม่ format เอง

**การตรวจข้อมูล** — ตรวจ **สองฝั่ง** กฎต้องตรงกัน
`src/lib/validate.ts` (client, ข้อความต่อช่อง) และ `src/app/api/expenses/shared.ts` → `checkPayload()` (server)
กฎปัจจุบัน: เงิน > 0 และ ≤ 500,000 / วันที่ไม่เป็นอนาคต / หมวดต้องอยู่ใน `CATEGORIES`
`amount` มี `CHECK (amount > 0)` ที่ฝั่งฐานข้อมูลด้วย — สามฝั่งต้องไม่ขัดกัน

**`note` ว่าง** — ในฐานข้อมูลเก็บเป็น `null` ในแอปใช้ `""` การแปลงอยู่ใน `shared.ts` แล้ว อย่าทำซ้ำที่อื่น

**การบันทึกรายการใหม่เป็น optimistic** — `ExpenseApp.save()` ใส่แถวลงหน้าจอทันทีด้วย id ชั่วคราว
(เลขลบ กันชนกับ `bigint identity`) แล้วยิงไป server เบื้องหลัง ถ้าพลาดจะถอนแถวออกและขึ้นข้อความไทย
แถวที่ id เป็นเลขลบยังแก้/ลบไม่ได้ — มี `isPending()` กันไว้ ส่วนการ **แก้ไข** ยังรอผลก่อนอัปเดตหน้าจอ

## ฐานข้อมูล

**`public.expenses`** — `id` (bigint identity, PK), `expense_date` (date, not null),
`category` (text, not null), `amount` (numeric(12,2), CHECK > 0), `note` (text, null ได้),
`created_at` (timestamptz, default now()), `user_id` (uuid → `app_users.id`, null ได้)

**`public.app_users`** — `id` (uuid, PK), `username` (text, unique), `password_hash` (text, bcrypt),
`display_name` (text), `created_at` (timestamptz)

ทั้งสองตาราง **เปิด RLS และไม่มี policy** โดยเจตนา = เบราว์เซอร์แตะไม่ได้เลย มีแต่ server ที่เข้าได้
ทุกคอลัมน์มี comment ภาษาไทยกำกับ

⚠️ **`myexpense-seed.sql` ขึ้นต้นด้วย `DROP TABLE IF EXISTS`** — รันแล้วข้อมูลจริงหายทั้งหมด
และจะลบคอลัมน์ `user_id` ไปด้วย ห้ามรันซ้ำโดยไม่ถามเจ้าของโปรเจกต์

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       URL ของโปรเจกต์ ไม่ใช่ความลับ
SUPABASE_SERVICE_ROLE_KEY      กุญแจผีของฐานข้อมูล ข้าม RLS ได้ทุกอย่าง
SESSION_SECRET                 สุ่มเอง 32 bytes ใช้เซ็นคุกกี้ session
```

**ตอนพัฒนา (local):** อยู่ใน `.env.local` (ไม่เข้า git) — ดูคำอธิบายแต่ละตัวใน `.env.local.example`

**ตอน production:** ตั้งเป็น Environment Variables ในหน้า Settings ของโปรเจกต์ Vercel
**ห้ามแนบไฟล์ `.env.production` ไปกับ deploy**

🔴 **ห้ามเปลี่ยน `SUPABASE_SERVICE_ROLE_KEY` หรือ `SESSION_SECRET` ให้ขึ้นต้นด้วย `NEXT_PUBLIC_`**
เพราะจะถูกฝังลง bundle ฝั่งเบราว์เซอร์ = ยกฐานข้อมูลให้คนทั้งอินเทอร์เน็ต

ถ้าตัวแปรใดยังไม่ได้ตั้งค่า `src/lib/supabase-admin.ts` จะ export `supabaseAdmin` เป็น `null`
และ `src/app/page.tsx` จะแสดงการ์ดบอกวิธีตั้งค่าเป็นภาษาไทย — **ห้ามเปลี่ยนเป็น throw ตอน import**
เพราะจะทำให้หน้าเว็บกลายเป็นจอขาว

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # dev server ที่ http://localhost:3000
npm run build    # ตรวจ TypeScript + build production
npm run lint

# สร้างบัญชีผู้ใช้ (ไม่มีหน้าสมัครสมาชิก)
node scripts/create-user.mjs <username> <password> "<ชื่อที่แสดง>"
```

รัน `npm run build` ก่อนเสมอเมื่อแก้โค้ดเสร็จ — เป็นด่านตรวจ type เดียวที่มีในโปรเจกต์นี้ (ไม่มีชุดทดสอบ)

## ข้อจำกัดที่รู้อยู่ (อย่า "แก้" โดยไม่ถาม)

- **ไม่มีหน้าสมัครสมาชิก** โดยเจตนา — เจ้าของโปรเจกต์สร้างบัญชีให้ด้วย `scripts/create-user.mjs`
- **session ไม่มีการ refresh** อายุ 7 วันแล้วต้องล็อกอินใหม่
- **ไม่มีหน้าเปลี่ยนรหัสผ่าน** และไม่มีระบบรีเซ็ตรหัสผ่าน
- `README.md` เป็นเอกสาร checkpoint ของคอร์ส เนื้อหาบางส่วนล้าสมัย — ยึด AGENTS.md เป็นหลัก
