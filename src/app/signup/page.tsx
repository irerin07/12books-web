"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Button, Field } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useSession();
  const [form, setForm] = useState({
    email: "",
    password: "",
    handle: "",
    displayName: "",
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/v1/auth/signup", { method: "POST", body: form, anonymous: true });
      // 가입 직후 바로 쓰게 한다. 로그인 화면으로 돌려보내 같은 값을 또 치게 하지 않는다.
      await login(form.email, form.password);
      router.push("/");
    } catch (e) {
      setError(e instanceof ApiError ? e : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-center text-3xl font-semibold tracking-tight">12books</h1>
      <p className="mb-8 text-center text-sm text-muted">읽고 있는 책을 기록해 보세요</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="이메일" type="email" value={form.email} onChange={set("email")}
          error={error?.reasonFor("email")} required />
        <Field label="비밀번호 (8~20자)" type="password" value={form.password} onChange={set("password")}
          error={error?.reasonFor("password")} required />
        <Field label="handle (영소문자·숫자·_ 3~20자)" value={form.handle} onChange={set("handle")}
          error={error?.reasonFor("handle")} required />
        <Field label="이름" value={form.displayName} onChange={set("displayName")}
          error={error?.reasonFor("displayName")} required />

        {error && error.fieldErrors.length === 0 ? (
          <p className="text-center text-sm text-danger">{error.message}</p>
        ) : null}

        <Button type="submit" disabled={busy} className="mt-2 h-10 w-full">
          {busy ? "만드는 중…" : "가입하기"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-accent">
          로그인
        </Link>
      </p>
    </div>
  );
}
