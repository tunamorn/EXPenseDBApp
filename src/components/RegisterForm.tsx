"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ฟอร์มสมัครสมาชิก — ผู้ใช้ตั้งรหัสผ่านเอง ต้องมีโค้ดเชิญจากเจ้าของระบบ
export default function RegisterForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!inviteCode.trim() || !username.trim() || !displayName.trim() || !password) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, username, password, displayName }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      // สมัครแล้วเข้าสู่ระบบให้เลย
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
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-line">
      {error && (
        <div className="mb-4 rounded-lg bg-mist p-3 text-sm text-navy ring-1 ring-line-strong">
          {error}
        </div>
      )}

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">โค้ดเชิญ</span>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className={inputCls}
        />
        <span className="mt-1 block text-sm text-steel">ขอโค้ดจากเจ้าของระบบ</span>
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อผู้ใช้</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className={inputCls}
        />
        <span className="mt-1 block text-sm text-steel">
          ตัวอักษรอังกฤษตัวเล็ก ตัวเลข จุด ขีดล่าง ขีดกลาง ยาว 3-30 ตัว
        </span>
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">ชื่อที่ต้องการให้แสดง</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="เช่น สมชาย"
          className={inputCls}
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">รหัสผ่าน</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className={inputCls}
        />
        <span className="mt-1 block text-sm text-steel">อย่างน้อย 8 ตัวอักษร</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-strong">ยืนยันรหัสผ่าน</span>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className={inputCls}
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-deep disabled:bg-steel-light"
      >
        {submitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
      </button>

      <p className="mt-4 text-sm text-ink">
        มีบัญชีอยู่แล้ว?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
