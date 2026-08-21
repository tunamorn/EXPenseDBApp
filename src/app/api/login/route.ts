import { compare } from "bcryptjs";
import { admin, isConfigured } from "@/lib/supabase-admin";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionValue } from "@/lib/session";

// ตรวจรหัสผ่านฝั่ง server เท่านั้น — ไม่เคยส่ง hash ออกไปให้เบราว์เซอร์
export async function POST(request: Request) {
  if (!isConfigured) {
    return Response.json({ error: "ระบบยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแล" }, { status: 500 });
  }

  let username = "";
  let password = "";
  try {
    const body = await request.json();
    // ชื่อผู้ใช้เก็บเป็นตัวเล็กทั้งหมด (ดู /api/register) จึงต้องแปลงก่อนค้นให้ตรงกัน
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return Response.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  if (!username || !password) {
    return Response.json({ error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, { status: 400 });
  }

  const { data, error } = await admin()
    .from("app_users")
    .select("id, display_name, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500 });
  }

  // ข้อความเดียวกันทั้งกรณีไม่มีผู้ใช้และรหัสผ่านผิด เพื่อไม่บอกใบ้ว่าชื่อผู้ใช้ไหนมีอยู่จริง
  const wrong = Response.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  if (!data) return wrong;
  if (!(await compare(password, data.password_hash))) return wrong;

  const response = Response.json({ name: data.display_name });
  response.headers.append(
    "Set-Cookie",
    [
      `${SESSION_COOKIE}=${createSessionValue(data.id, data.display_name)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${SESSION_MAX_AGE}`,
      process.env.NODE_ENV === "production" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ")
  );
  return response;
}
