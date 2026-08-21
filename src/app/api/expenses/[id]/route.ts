import { admin } from "@/lib/supabase-admin";
import { currentUser } from "@/lib/auth";
import { COLUMNS, checkPayload, readPayload, toExpense, type Row } from "../shared";

// แก้ไขรายจ่าย — จำกัดด้วย user_id เพื่อไม่ให้แก้ของคนอื่นได้
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "รหัสรายการไม่ถูกต้อง" }, { status: 400 });

  const payload = await readPayload(request);
  if (!payload) return Response.json({ error: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });

  const invalid = checkPayload(payload);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const { data, error } = await admin()
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.uid)
    .select(COLUMNS)
    .maybeSingle();

  if (error) return Response.json({ error: `แก้ไขรายจ่ายไม่สำเร็จ: ${error.message}` }, { status: 500 });
  if (!data) return Response.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
  return Response.json(toExpense(data as Row));
}

// ลบรายจ่าย — จำกัดด้วย user_id เช่นกัน
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "รหัสรายการไม่ถูกต้อง" }, { status: 400 });

  const { error } = await admin().from("expenses").delete().eq("id", id).eq("user_id", user.uid);
  if (error) return Response.json({ error: `ลบรายจ่ายไม่สำเร็จ: ${error.message}` }, { status: 500 });
  return Response.json({ ok: true });
}
