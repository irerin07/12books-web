"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { defaultFeedPath } from "@/lib/feedHome";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const who = await login(email, password);
      router.replace(await defaultFeedPath(who.handle));
    } catch (e) {
      // 서버는 이메일이 틀렸는지 비밀번호가 틀렸는지 구분해 주지 않는다. 그게 맞다 —
      // 구분해 주면 어느 이메일이 가입돼 있는지 알려주는 셈이 된다.
      setError(e instanceof ApiError ? e.message : "로그인하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame><h1 className="text-title">로그인</h1><p className="mt-2 mb-7 text-callout text-muted">내 서재에서 읽던 책을 이어가세요.</p>
        <form onSubmit={submit}>
          <FieldGroup>
            <Field
              label="이메일"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Field
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FieldGroup>

          {error ? (
            <p className="mt-3.5 text-center text-callout text-danger">{error}</p>
          ) : null}

          <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full">
            {busy ? "확인 중…" : "로그인"}
          </Button>
        </form>

        <p className="mt-8 text-center text-callout text-muted">
          계정이 없나요?{" "}
          <Link href="/signup" className="font-medium text-accent hover:opacity-65">
            가입하기
          </Link>
        </p>
    </AuthFrame>
  );
}
