"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseTable from "@/components/ExpenseTable";
import CategorySummary from "@/components/CategorySummary";
import Filters from "@/components/Filters";
import { formatBaht } from "@/lib/categories";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/expenses";
import type { Expense } from "@/lib/types";

// id ชั่วคราวของรายการที่เพิ่งกดบันทึกและยังรอผลจากฐานข้อมูล
// ใช้เลขลบเพื่อไม่ให้ชนกับ id จริง (bigint identity เริ่มที่ 1)
let tempIdSeq = 0;
function nextTempId(): number {
  tempIdSeq -= 1;
  return tempIdSeq;
}

export default function ExpenseApp({ userName }: { userName: string }) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // โหลดรายจ่ายของผู้ใช้คนนี้
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setExpenses(await listExpenses());
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาดที่ไม่รู้จัก");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  // แถวที่ id เป็นเลขลบคือแถวชั่วคราวที่ยังบันทึกไม่เสร็จ ยังแก้หรือลบไม่ได้
  function isPending(id: number): boolean {
    return id < 0;
  }

  // บันทึกรายการใหม่ หรือแก้ไขรายการเดิม แล้วอัปเดตรายการบนหน้าจอ
  async function save(data: Omit<Expense, "id">, id?: number): Promise<boolean> {
    setError(null);

    // รายการใหม่ — ขึ้นบนหน้าจอทันที แล้วส่งไปบันทึกเบื้องหลัง
    if (id === undefined) {
      const tempId = nextTempId();
      setExpenses((prev) => [{ ...data, id: tempId }, ...prev]);

      void createExpense(data)
        .then((created) => {
          // สำเร็จ — แทนแถวชั่วคราวด้วยแถวจริงที่มี id จากฐานข้อมูล
          setExpenses((prev) => prev.map((e) => (e.id === tempId ? created : e)));
        })
        .catch((e) => {
          // ไม่สำเร็จ — เอารายการออกจากหน้าจอ แล้วบอกเหตุผล
          setExpenses((prev) => prev.filter((e) => e.id !== tempId));
          setError(e instanceof Error ? e.message : "บันทึกรายจ่ายไม่สำเร็จ");
        });

      return true; // ล้างฟอร์มได้เลย เพราะรายการขึ้นหน้าจอแล้ว
    }

    // แก้ไขรายการเดิม — ยังรอผลจากฐานข้อมูลก่อนอัปเดตหน้าจอ
    try {
      const updated = await updateExpense(id, data);
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditing(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return false;
    }
  }

  async function remove(id: number) {
    if (isPending(id)) {
      setError("รายการนี้กำลังบันทึกลงฐานข้อมูล กรุณารอสักครู่");
      return;
    }
    setError(null);
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (editing?.id === id) setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const filtered = useMemo(
    () =>
      expenses.filter(
        (e) =>
          (!month || e.expense_date.startsWith(month)) &&
          (!category || e.category === category)
      ),
    [expenses, month, category]
  );

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
          <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-strong">สวัสดี {userName}</span>
          <button
            onClick={() => void logout()}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink ring-1 ring-line-strong hover:bg-ice"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-xl bg-mist p-4 text-navy ring-1 ring-line-strong">
          <p className="text-sm">{error}</p>
          <button onClick={() => void reload()} className="whitespace-nowrap text-sm font-medium underline">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      <div className="mb-6 rounded-xl bg-brand p-6 text-white shadow-sm">
        <p className="text-sm text-tint">ยอดรวมตามเงื่อนไขที่เลือก</p>
        <p className="mt-1 text-4xl font-bold">{formatBaht(total)}</p>
        <p className="mt-1 text-sm text-tint">
          {loading
            ? "กำลังโหลดข้อมูล..."
            : `${filtered.length} รายการ จากทั้งหมด ${expenses.length} รายการ`}
        </p>
      </div>

      <div className="space-y-6">
        <ExpenseForm onSave={save} editing={editing} onCancelEdit={() => setEditing(null)} />
        <Filters month={month} category={category} onMonthChange={setMonth} onCategoryChange={setCategory} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="rounded-xl bg-white p-10 text-center text-steel shadow-sm ring-1 ring-line">
                กำลังโหลดข้อมูล...
              </div>
            ) : (
              <ExpenseTable
                expenses={filtered}
                onEdit={(e) =>
                  isPending(e.id)
                    ? setError("รายการนี้กำลังบันทึกลงฐานข้อมูล กรุณารอสักครู่")
                    : setEditing(e)
                }
                onDelete={remove}
              />
            )}
          </div>
          <CategorySummary expenses={filtered} />
        </div>
      </div>
    </main>
  );
}
