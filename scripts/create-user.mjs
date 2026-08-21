// สร้างบัญชีผู้ใช้ของ MyExpense (แอปนี้ไม่มีหน้าสมัครสมาชิก)
//
// วิธีใช้:
//   node scripts/create-user.mjs <username> <password> "<ชื่อที่แสดง>"
//
// สคริปต์นี้ใช้ service role key จาก .env.local จึงรันได้เฉพาะบนเครื่องของเจ้าของโปรเจกต์
// ผู้ใช้คนแรกที่ถูกสร้างจะได้รับรายจ่ายเดิมที่ยังไม่มีเจ้าของทั้งหมด

import { readFileSync } from "node:fs";
import { hash } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

// อ่านค่าจาก .env.local แบบง่าย ๆ (สคริปต์นี้อยู่นอก Next.js จึงไม่มีการโหลดให้อัตโนมัติ)
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
    }
  } catch {
    console.error("อ่านไฟล์ .env.local ไม่ได้ — รันคำสั่งนี้ที่รากโปรเจกต์");
    process.exit(1);
  }
  return env;
}

const [username, password, displayName] = process.argv.slice(2);

if (!username || !password || !displayName) {
  console.error('วิธีใช้: node scripts/create-user.mjs <username> <password> "<ชื่อที่แสดง>"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  process.exit(1);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("ไม่พบ NEXT_PUBLIC_SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

// นับผู้ใช้ที่มีอยู่ เพื่อรู้ว่าคนนี้เป็นคนแรกหรือไม่
const { count, error: countError } = await supabase
  .from("app_users")
  .select("id", { count: "exact", head: true });

if (countError) {
  console.error(`อ่านตาราง app_users ไม่ได้: ${countError.message}`);
  process.exit(1);
}

const isFirstUser = (count ?? 0) === 0;

const { data, error } = await supabase
  .from("app_users")
  .insert({
    username,
    password_hash: await hash(password, 12),
    display_name: displayName,
  })
  .select("id, username, display_name")
  .single();

if (error) {
  const reason = error.code === "23505" ? "ชื่อผู้ใช้นี้มีอยู่แล้ว" : error.message;
  console.error(`สร้างบัญชีไม่สำเร็จ: ${reason}`);
  process.exit(1);
}

console.log(`สร้างบัญชีสำเร็จ: ${data.username} (${data.display_name})`);

// ผู้ใช้คนแรกรับรายจ่ายเดิมที่ยังไม่มีเจ้าของไปทั้งหมด
if (isFirstUser) {
  const { data: claimed, error: claimError } = await supabase
    .from("expenses")
    .update({ user_id: data.id })
    .is("user_id", null)
    .select("id");

  if (claimError) {
    console.error(`ยกรายจ่ายเดิมให้ผู้ใช้คนแรกไม่สำเร็จ: ${claimError.message}`);
    process.exit(1);
  }

  console.log(`ยกรายจ่ายเดิมที่ยังไม่มีเจ้าของให้บัญชีนี้ ${claimed.length} รายการ`);
}
