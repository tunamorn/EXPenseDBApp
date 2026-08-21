import { createHash, timingSafeEqual } from "node:crypto";

// โค้ดเชิญสำหรับสมัครสมาชิก — ใช้ได้ฝั่ง server เท่านั้น
// ถ้าไม่ได้ตั้ง REGISTER_INVITE_CODE จะถือว่า "ปิดรับสมัคร" ซึ่งเป็นค่าเริ่มต้นที่ปลอดภัย
export const isRegistrationEnabled = Boolean(process.env.REGISTER_INVITE_CODE);

// เทียบโค้ดแบบ timing-safe และไม่สนใจช่องว่างหัวท้าย
// hash ก่อนเทียบเพื่อให้สองฝั่งยาวเท่ากันเสมอ ความยาวโค้ดจึงไม่รั่วออกไป
export function isValidInviteCode(given: string): boolean {
  const expected = process.env.REGISTER_INVITE_CODE;
  if (!expected) return false;

  const a = createHash("sha256").update(given.trim()).digest();
  const b = createHash("sha256").update(expected.trim()).digest();
  return timingSafeEqual(a, b);
}

// กติกาชื่อผู้ใช้ — ตัวเล็ก ตัวเลข จุด ขีดล่าง ขีดกลาง ยาว 3-30 ตัว
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export type RegisterInput = {
  username: string;
  password: string;
  displayName: string;
};

// ตรวจข้อมูลสมัครสมาชิกฝั่ง server คืนข้อความไทยถ้าไม่ผ่าน
export function checkRegisterInput(input: RegisterInput): string | null {
  if (!USERNAME_PATTERN.test(input.username)) {
    return "ชื่อผู้ใช้ต้องเป็นตัวอักษรอังกฤษตัวเล็ก ตัวเลข จุด ขีดล่าง หรือขีดกลาง ยาว 3-30 ตัว";
  }
  if (input.password.length < 8) {
    return "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร";
  }
  if (input.password.length > 200) {
    return "รหัสผ่านยาวเกินไป";
  }
  if (!input.displayName.trim()) {
    return "กรุณากรอกชื่อที่ต้องการให้แสดง";
  }
  if (input.displayName.trim().length > 60) {
    return "ชื่อที่แสดงยาวเกิน 60 ตัวอักษร";
  }
  return null;
}
