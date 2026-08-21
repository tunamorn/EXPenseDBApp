import { redirect } from "next/navigation";
import ExpenseApp from "@/components/ExpenseApp";
import { currentUser } from "@/lib/auth";
import { isConfigured, missingEnvVars } from "@/lib/supabase-admin";

// หน้าหลักเป็น Server Component — ตรวจ session ก่อน ถ้ายังไม่ล็อกอินให้ไปหน้า /login
export default async function Home() {
  if (!isConfigured) return <SetupNotice />;

  const user = await currentUser();
  if (!user) redirect("/login");

  return <ExpenseApp userName={user.name} />;
}

// แสดงเมื่อยังตั้งค่า environment variable ไม่ครบ — ไม่ปล่อยให้หน้าเว็บพัง
function SetupNotice() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">บันทึกรายจ่ายส่วนตัว</p>
      </header>

      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
        <h2 className="mb-2 text-lg font-semibold text-navy">ยังเชื่อมต่อฐานข้อมูลไม่ได้</h2>
        <p className="text-ink">แอปยังตั้งค่าไม่ครบ จึงยังอ่านหรือบันทึกรายจ่ายไม่ได้</p>

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
            <li>
              คัดลอกไฟล์ <span className="font-mono">.env.local.example</span> เป็น{" "}
              <span className="font-mono">.env.local</span>
            </li>
            <li>ใส่ค่าตามคำอธิบายในไฟล์ตัวอย่าง</li>
            <li>
              รีสตาร์ต dev server ด้วย <span className="font-mono">npm run dev</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  );
}
