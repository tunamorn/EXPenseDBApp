import { admin } from "@/lib/supabase-admin";
import { currentUser } from "@/lib/auth";
import { COLUMNS, checkPayload, readPayload, toExpense, type Row } from "./shared";

// อ่านรายจ่ายของผู้ใช้ที่ล็อกอินอยู่ เรียงวันที่จากใหม่ไปเก่า
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const { data, error } = await admin()
    .from("expenses")
    .select(COLUMNS)
    .eq("user_id", user.uid)
    .order("expense_date", { ascending: false })
    .order("id", { ascending: false });

  if (error) return Response.json({ error: `โหลดรายจ่ายไม่สำเร็จ: ${error.message}` }, { status: 500 });
  return Response.json((data as Row[]).map(toExpense));
}

// เพิ่มรายจ่ายใหม่ — เจ้าของมาจาก session เท่านั้น ไม่รับ user_id จากเบราว์เซอร์
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const payload = await readPayload(request);
  if (!payload) return Response.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });

  const invalid = checkPayload(payload);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const { data, error } = await admin()
    .from("expenses")
    .insert({ ...payload, user_id: user.uid })
    .select(COLUMNS)
    .single();

  if (error) return Response.json({ error: `บันทึกรายจ่ายไม่สำเร็จ: ${error.message}` }, { status: 500 });
  return Response.json(toExpense(data as Row), { status: 201 });
}
