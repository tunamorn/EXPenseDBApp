import { SESSION_COOKIE } from "@/lib/session";

// ออกจากระบบ = ลบคุกกี้ session
export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
