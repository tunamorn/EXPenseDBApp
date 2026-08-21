import { hash } from "bcryptjs";
import { admin, isConfigured } from "@/lib/supabase-admin";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionValue } from "@/lib/session";
import { checkRegisterInput, isRegistrationEnabled, isValidInviteCode } from "@/lib/invite";

// สมัครสมาชิกด้วยโค้ดเชิญ — ผู้ใช้ตั้งรหัสผ่านเอง เจ้าของระบบไม่เคยเห็นรหัสผ่าน
export async function POST(request: Request) {
  if (!isConfigured) {
    return Response.json({ error: "ระบบยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแล" }, { status: 500 });
  }

  if (!isRegistrationEnabled) {
    return Response.json({ error: "ระบบปิดรับสมัครสมาชิกอยู่" }, { status: 403 });
  }

  let inviteCode = "";
  let username = "";
  let password = "";
  let displayName = "";
  try {
    const body = await request.json();
    inviteCode = String(body.inviteCode ?? "");
    // ชื่อผู้ใช้เก็บเป็นตัวเล็กทั้งหมด กันสับสนตอนล็อกอิน
    username = String(body.username ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
    displayName = String(body.displayName ?? "").trim();
  } catch {
    return Response.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  if (!isValidInviteCode(inviteCode)) {
    return Response.json({ error: "โค้ดเชิญไม่ถูกต้อง" }, { status: 403 });
  }

  const invalid = checkRegisterInput({ username, password, displayName });
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const { data, error } = await admin()
    .from("app_users")
    .insert({
      username,
      password_hash: await hash(password, 12),
      display_name: displayName,
    })
    .select("id, display_name")
    .single();

  if (error) {
    // 23505 = unique violation ที่คอลัมน์ username
    if (error.code === "23505") {
      return Response.json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น" }, { status: 409 });
    }
    return Response.json({ error: `สมัครสมาชิกไม่สำเร็จ: ${error.message}` }, { status: 500 });
  }

  // สมัครเสร็จให้เข้าสู่ระบบต่อเลย ไม่ต้องพิมพ์รหัสผ่านซ้ำ
  const response = Response.json({ name: data.display_name }, { status: 201 });
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
