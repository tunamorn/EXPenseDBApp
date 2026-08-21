import { createClient } from "@supabase/supabase-js";

// จุดเชื่อมต่อ Supabase จุดเดียวของทั้งแอป
// ห้าม import createClient ที่ไฟล์อื่น ให้ใช้ client จากไฟล์นี้เท่านั้น
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// รายชื่อตัวแปรที่ยังไม่ได้ตั้งค่า ใช้แสดงข้อความบอกผู้ใช้แทนการทำให้หน้าเว็บพัง
export const missingEnvVars: string[] = [
  ...(url ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
  ...(anonKey ? [] : ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]),
];

export const isSupabaseConfigured = missingEnvVars.length === 0;

// ถ้ายังไม่ได้ตั้งค่า env จะเป็น null — ไม่ throw ตอน import เพื่อไม่ให้หน้าเว็บกลายเป็นจอขาว
export const supabase = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      // แอปนี้ไม่มีระบบ login จึงไม่ต้องเก็บ session
      auth: { persistSession: false },
    })
  : null;
