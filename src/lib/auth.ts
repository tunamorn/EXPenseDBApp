import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionValue, type SessionPayload } from "./session";

// อ่านผู้ใช้ที่ล็อกอินอยู่จากคุกกี้ — ใช้ได้ใน Server Component และ Route Handler เท่านั้น
export async function currentUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionValue(store.get(SESSION_COOKIE)?.value);
}
