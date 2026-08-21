import Link from "next/link";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { currentUser } from "@/lib/auth";
import { isRegistrationEnabled } from "@/lib/invite";

// หน้าสมัครสมาชิก — เป็น Server Component เพื่อเช็คว่าเปิดรับสมัครอยู่หรือไม่
export default async function RegisterPage() {
  // ล็อกอินอยู่แล้วไม่ต้องสมัครใหม่
  if (await currentUser()) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">สมัครสมาชิกเพื่อเริ่มบันทึกรายจ่าย</p>
      </header>

      {isRegistrationEnabled ? (
        <RegisterForm />
      ) : (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
          <h2 className="mb-2 text-lg font-semibold text-navy">ปิดรับสมัครสมาชิกอยู่</h2>
          <p className="text-ink">
            ตอนนี้ระบบยังไม่เปิดให้สมัครสมาชิก กรุณาติดต่อเจ้าของระบบเพื่อขอบัญชีผู้ใช้
          </p>
          <p className="mt-4 text-sm text-ink">
            <Link href="/login" className="font-medium text-brand hover:underline">
              กลับไปหน้าเข้าสู่ระบบ
            </Link>
          </p>
        </div>
      )}
    </main>
  );
}
