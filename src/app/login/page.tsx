"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// หน้าเข้าสู่ระบบ — ส่งชื่อผู้ใช้กับรหัสผ่านไปตรวจที่ /api/login ฝั่ง server
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      // เข้าสู่ระบบแล้ว — refresh เพื่อให้ Server Component อ่านคุกกี้ใหม่
      router.replace("/");
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-line-strong px-3 py-2 outline-none focus:border-brand";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-navy">MyExpense</h1>
        <p className="mt-1 text-ink">เข้าสู่ระบบเพื่อดูรายจ่ายของคุณ</p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
        {error && (
          <div className="mb-4 rounded-lg bg-mist p-3 text-sm text-navy ring-1 ring-line-strong">
            {error}
          </div>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อผู้ใช้</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={inputCls}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-strong">รหัสผ่าน</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep disabled:bg-steel-light"
        >
          {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>

        <p className="mt-4 text-sm text-steel">
          ไม่มีหน้าสมัครสมาชิก — บัญชีผู้ใช้สร้างโดยเจ้าของโปรเจกต์เท่านั้น
        </p>
      </form>
    </main>
  );
}
