"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useCooldown } from "@/lib/cooldown";
import { defaultFeedPath } from "@/lib/feedHome";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

/* useSearchParams를 쓰는 부분은 Suspense 안에 있어야 한다 — 빌드 때 이 화면을 미리 그린다. */
export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const { login } = useSession();
  /* 재설정을 막 끝내고 온 사람. 모든 기기가 로그아웃된 참이라 왜 다시 묻는지 말해 준다. */
  const justReset = useSearchParams().get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cooldown = useCooldown();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const who = await login(email, password);
      router.replace(await defaultFeedPath(who.handle));
    } catch (e) {
      /*
       * 429는 잠시 잠그고 기다린다. 로그인은 실패만 세므로 여기 닿았다는 것은 비밀번호를
       * 여러 번 헤맸다는 뜻이고, 맞는 비밀번호로 들어가는 순간 그 한 번은 되돌려진다.
       */
      if (cooldown.take(e)) { setError(null); }
      // 서버는 이메일이 틀렸는지 비밀번호가 틀렸는지 구분해 주지 않는다. 그게 맞다 —
      // 구분해 주면 어느 이메일이 가입돼 있는지 알려주는 셈이 된다.
      else setError(e instanceof ApiError ? e.message : "로그인하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame><h1 className="text-title">로그인</h1>
        <p className="mt-2 mb-7 text-callout text-muted">
          {justReset ? "비밀번호를 바꿨어요. 새 비밀번호로 다시 로그인해 주세요." : "내 서재에서 읽던 책을 이어가세요."}
        </p>
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

          {cooldown.locked ? (
            <p role="alert" className="mt-3.5 text-center text-callout text-danger">
              로그인 시도가 너무 잦았어요. {cooldown.left}초 뒤에 다시 시도해 주세요.
            </p>
          ) : error ? (
            <p className="mt-3.5 text-center text-callout text-danger">{error}</p>
          ) : null}

          <Button type="submit" size="lg" disabled={busy || cooldown.locked} className="mt-5 w-full">
            {cooldown.locked ? `${cooldown.left}초 뒤에 다시` : busy ? "확인 중…" : "로그인"}
          </Button>
        </form>

        <p className="mt-5 text-center text-callout">
          <Link href="/forgot-password" className="text-muted hover:text-accent">비밀번호를 잊으셨나요?</Link>
        </p>

        <p className="mt-6 text-center text-callout text-muted">
          계정이 없나요?{" "}
          <Link href="/signup" className="font-medium text-accent hover:opacity-65">
            가입하기
          </Link>
        </p>
    </AuthFrame>
  );
}
