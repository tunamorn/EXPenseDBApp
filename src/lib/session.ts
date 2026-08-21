import { createHmac, timingSafeEqual } from "node:crypto";

// session เก็บในคุกกี้ที่เซ็นด้วย HMAC — แก้ค่าในคุกกี้เองไม่ได้เพราะลายเซ็นจะไม่ตรง
// ใช้ได้ฝั่ง server เท่านั้น
export const SESSION_COOKIE = "myexpense_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

export type SessionPayload = {
  uid: string;   // app_users.id
  name: string;  // display_name สำหรับแสดง "สวัสดี ..."
  exp: number;   // เวลาหมดอายุ (วินาที)
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("ยังไม่ได้ตั้งค่า SESSION_SECRET");
  return s;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

// สร้างค่าคุกกี้จากข้อมูลผู้ใช้
export function createSessionValue(uid: string, name: string): string {
  const payload: SessionPayload = {
    uid,
    name,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

// ตรวจลายเซ็นและวันหมดอายุ คืน null ถ้าไม่ผ่าน
export function readSessionValue(value: string | undefined): SessionPayload | null {
  if (!value) return null;

  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;

  const body = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1), "base64url");
  const expected = Buffer.from(sign(body), "base64url");

  // เทียบแบบ timing-safe กันการเดาลายเซ็นจากเวลาที่ใช้ตรวจ
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.uid || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
