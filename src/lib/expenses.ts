import { supabase } from "./supabase";
import type { Expense } from "./types";

const TABLE = "expenses";
const COLUMNS = "id, expense_date, category, amount, note";

// รูปแบบแถวที่ได้จากฐานข้อมูล — note เป็น null ได้ และ amount อาจมาเป็นสตริง
type Row = {
  id: number;
  expense_date: string;
  category: string;
  amount: number | string;
  note: string | null;
};

// กันกรณีเรียกใช้ตอนที่ยังไม่ได้ตั้งค่า environment variable
function client() {
  if (!supabase) {
    throw new Error("ยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase — ตรวจไฟล์ .env.local");
  }
  return supabase;
}

// แปลงแถวจากฐานข้อมูลให้เป็นรูปแบบที่แอปใช้
function toExpense(row: Row): Expense {
  return {
    id: row.id,
    expense_date: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    note: row.note ?? "",
  };
}

// อ่านรายจ่ายทั้งหมด เรียงวันที่จากใหม่ไปเก่า
export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await client()
    .from(TABLE)
    .select(COLUMNS)
    .order("expense_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw new Error(`โหลดรายจ่ายไม่สำเร็จ: ${error.message}`);
  return (data as Row[]).map(toExpense);
}

// เพิ่มรายจ่ายใหม่ คืนแถวที่บันทึกแล้ว (พร้อม id ที่ฐานข้อมูลสร้างให้)
export async function createExpense(input: Omit<Expense, "id">): Promise<Expense> {
  const { data, error } = await client()
    .from(TABLE)
    .insert({ ...input, note: input.note || null })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`บันทึกรายจ่ายไม่สำเร็จ: ${error.message}`);
  return toExpense(data as Row);
}

// แก้ไขรายจ่ายตาม id
export async function updateExpense(id: number, input: Omit<Expense, "id">): Promise<Expense> {
  const { data, error } = await client()
    .from(TABLE)
    .update({ ...input, note: input.note || null })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`แก้ไขรายจ่ายไม่สำเร็จ: ${error.message}`);
  return toExpense(data as Row);
}

// ลบรายจ่ายตาม id
export async function deleteExpense(id: number): Promise<void> {
  const { error } = await client().from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`ลบรายจ่ายไม่สำเร็จ: ${error.message}`);
}
