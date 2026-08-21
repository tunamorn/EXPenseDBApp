import { createClient } from "@supabase/supabase-js";

// จุดเชื่อมต่อ Supabase จุดเดียวของทั้งแอป และใช้ได้ "ฝั่ง server เท่านั้น"
// ใช้ service role key ซึ่งข้าม RLS ได้ทุกอย่าง ห้าม import ไฟล์นี้ใน component ที่มี "use client"
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// รายชื่อตัวแปรที่ยังไม่ได้ตั้งค่า ใช้แสดงข้อความบอกผู้ใช้แทนการทำให้หน้าเว็บพัง
export const missingEnvVars: string[] = [
  ...(url ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
  ...(serviceRoleKey ? [] : ["SUPABASE_SERVICE_ROLE_KEY"]),
  ...(process.env.SESSION_SECRET ? [] : ["SESSION_SECRET"]),
];

export const isConfigured = missingEnvVars.length === 0;

// ถ้ายังไม่ได้ตั้งค่า env จะเป็น null — ไม่ throw ตอน import เพื่อไม่ให้หน้าเว็บกลายเป็นจอขาว
export const supabaseAdmin =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
    : null;

// เรียกใช้ในที่ที่มั่นใจว่าตั้งค่าครบแล้ว
export function admin() {
  if (!supabaseAdmin) {
    throw new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase ฝั่ง server");
  }
  return supabaseAdmin;
}
