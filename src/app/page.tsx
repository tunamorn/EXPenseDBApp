"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { isSupabaseConfigured, missingEnvVars } from "@/lib/supabase";
import type { Expense } from "@/lib/types";

// หัวข้อด้านบนของหน้า ใช้ร่วมกันทั้งกรณีตั้งค่าแล้วและยังไม่ได้ตั้งค่า
function PageHeader() {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
      <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
    </header>
  );
}

// แสดงเมื่อยังไม่ได้ตั้งค่า environment variable — บอกผู้ใช้ว่าต้องทำอะไร
function SetupNotice() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
      <h2 className="mb-2 text-lg font-semibold text-navy">ยังเชื่อมต่อฐานข้อมูลไม่ได้</h2>
      <p className="text-ink">
        แอปยังไม่ได้ตั้งค่าการเชื่อมต่อ Supabase จึงยังอ่านหรือบันทึกรายจ่ายไม่ได้
      </p>

      <p className="mt-4 text-sm font-medium text-ink-strong">ตัวแปรที่ยังไม่ได้ตั้งค่า</p>
      <ul className="mt-2 space-y-1">
        {missingEnvVars.map((name) => (
          <li key={name} className="rounded-lg bg-mist px-3 py-2 font-mono text-sm text-navy">
            {name}
          </li>
        ))}
      </ul>

      <div className="mt-5 space-y-2 text-sm text-ink">
        <p>วิธีตั้งค่า</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>คัดลอกไฟล์ <span className="font-mono">.env.local.example</span> เป็น <span className="font-mono">.env.local</span></li>
          <li>ใส่ค่าจาก Supabase Dashboard &gt; Project Settings &gt; API</li>
          <li>รีสตาร์ต dev server ด้วย <span className="font-mono">npm run dev</span></li>
        </ol>
      </div>
    </div>
  );
}

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  // โหลดรายจ่ายทั้งหมดจากตาราง expenses บน Supabase
  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) return;
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

  // บันทึกรายการใหม่ หรือแก้ไขรายการเดิมลงฐานข้อมูล แล้วอัปเดตรายการบนหน้าจอ
  async function save(data: Omit<Expense, "id">, id?: number): Promise<boolean> {
    setError(null);
    try {
      if (id === undefined) {
        const created = await createExpense(data);
        setExpenses((prev) => [created, ...prev]);
      } else {
        const updated = await updateExpense(id, data);
        setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
        setEditing(null);
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return false;
    }
  }

  // ลบแถวใน expenses จริง แล้วเอาออกจากรายการบนหน้าจอ
  async function remove(id: number) {
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

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <PageHeader />
        <SetupNotice />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader />

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
              <ExpenseTable expenses={filtered} onEdit={setEditing} onDelete={remove} />
            )}
          </div>
          <CategorySummary expenses={filtered} />
        </div>
      </div>
    </main>
  );
}
