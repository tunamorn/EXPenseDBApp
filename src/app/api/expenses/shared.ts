import { CATEGORIES, today } from "@/lib/categories";
import type { Expense } from "@/lib/types";

export const COLUMNS = "id, expense_date, category, amount, note";

export type Row = {
  id: number;
  expense_date: string;
  category: string;
  amount: number | string;
  note: string | null;
};

export type Payload = {
  expense_date: string;
  category: string;
  amount: number;
  note: string | null;
};

// แปลงแถวจากฐานข้อมูลให้เป็นรูปแบบที่แอปใช้ (note null -> "")
export function toExpense(row: Row): Expense {
  return {
    id: row.id,
    expense_date: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? "",
  };
}

// อ่าน body และคัดเฉพาะฟิลด์ที่อนุญาต ป้องกันการแอบส่ง user_id หรือ id เข้ามา
export async function readPayload(request: Request): Promise<Payload | null> {
  try {
    const body = await request.json();
    return {
      expense_date: String(body.expense_date ?? ""),
      category: String(body.category ?? ""),
      amount: Number(body.amount),
      note: String(body.note ?? "") || null,
    };
  } catch {
    return null;
  }
}

// ตรวจข้อมูลซ้ำฝั่ง server เพราะการตรวจในเบราว์เซอร์ถูกข้ามได้
// กฎต้องตรงกับ src/lib/validate.ts และ CHECK (amount > 0) ที่ฐานข้อมูล
export function checkPayload(p: Payload): string | null {
  if (!p.expense_date) return "กรุณาเลือกวันที่";
  if (p.expense_date > today()) return "วันที่ใช้จ่ายต้องไม่เป็นวันในอนาคต";
  if (!CATEGORIES.includes(p.category as (typeof CATEGORIES)[number])) return "หมวดไม่ถูกต้อง";
  if (Number.isNaN(p.amount) || p.amount <= 0) return "จำนวนเงินต้องมากกว่า 0 บาท";
  if (p.amount > 500000) return "จำนวนเงินต้องไม่เกิน 500,000 บาท";
  return null;
}
