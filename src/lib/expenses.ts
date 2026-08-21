import type { Expense } from "./types";

// ชั้นเข้าถึงข้อมูลของฝั่งเบราว์เซอร์ — คุยกับ Route Handler ของแอปเท่านั้น
// ไม่คุยกับ Supabase ตรง ๆ อีกแล้ว เพราะ RLS ปิดประตูฝั่งเบราว์เซอร์ไว้
const BASE = "/api/expenses";

// ดึงข้อความ error ภาษาไทยที่ Route Handler ส่งมา
async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // ไม่ใช่ JSON ก็ใช้ข้อความสำรอง
  }
  return fallback;
}

// อ่านรายจ่ายทั้งหมดของผู้ใช้ที่ล็อกอินอยู่ เรียงวันที่จากใหม่ไปเก่า
export async function listExpenses(): Promise<Expense[]> {
  const response = await fetch(BASE, { cache: "no-store" });
  if (!response.ok) throw new Error(await errorMessage(response, "โหลดรายจ่ายไม่สำเร็จ"));
  return response.json();
}

// เพิ่มรายจ่ายใหม่ คืนแถวที่บันทึกแล้ว (พร้อม id ที่ฐานข้อมูลสร้างให้)
export async function createExpense(input: Omit<Expense, "id">): Promise<Expense> {
  const response = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "บันทึกรายจ่ายไม่สำเร็จ"));
  return response.json();
}

// แก้ไขรายจ่ายตาม id
export async function updateExpense(id: number, input: Omit<Expense, "id">): Promise<Expense> {
  const response = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorMessage(response, "แก้ไขรายจ่ายไม่สำเร็จ"));
  return response.json();
}

// ลบรายจ่ายตาม id
export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await errorMessage(response, "ลบรายจ่ายไม่สำเร็จ"));
}
