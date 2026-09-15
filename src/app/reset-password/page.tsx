"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useCooldown } from "@/lib/cooldown";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

/**
 * 메일 링크가 데려오는 화면. `?token=`을 그대로 들고 서버에 낸다.
 *
 * 실패는 전부 A005 하나다 — 없는 토큰·만료·이미 쓴 토큰을 서버가 구분해 주지 않는다.
 * 구분해 주면 남의 토큰을 찔러 보며 존재 여부를 알아낼 수 있기 때문이고, 그래서 화면도
 * 한 문구로만 말하고 요청 화면으로 되돌린다.
 *
 * 성공하면 그 사람의 모든 기기가 로그아웃된다(서버가 refresh 세션을 전부 끊는다).
 * 바꾸는 이유가 보통 탈취라서 의도된 동작이고, 그래서 끝나면 로그인 화면으로 보낸다.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const cooldown = useCooldown();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api<void>("/api/v1/auth/password-reset/confirm", {
        method: "POST", body: { token, password }, anonymous: true,
      });
      router.replace("/login?reset=1");
    } catch (e) {
      if (cooldown.take(e)) setError(null);
      else setError(e instanceof ApiError ? e : "비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  /* 링크가 죽었다. 세 경우를 구분하지 않으므로 한 문구로 말하고 다시 요청하게 한다. */
  const dead = (error instanceof ApiError && error.code === "A005") || !token;
  if (dead) return <>
    <h1 className="text-title">링크를 쓸 수 없어요</h1>
    <p className="mt-3 text-callout text-muted">
      링크가 만료되었거나 이미 사용되었어요. 재설정을 다시 요청해 주세요.
    </p>
    <Button size="lg" className="mt-6 w-full" onClick={() => router.replace("/forgot-password")}>
      다시 요청하기
    </Button>
  </>;

  return <>
    <h1 className="text-title">새 비밀번호</h1>
    {/* 길이 규칙은 서버가 가진다. 여기 적힌 것은 검사하는 값이 아니라 안내다. */}
    <p className="mt-2 mb-7 text-callout text-muted">8~20자로 정해 주세요.</p>
    <form onSubmit={submit}>
      <FieldGroup>
        <Field label="새 비밀번호" type="password" autoComplete="new-password"
          value={password} onChange={e => setPassword(e.target.value)}
          error={error instanceof ApiError ? error.reasonFor("password") : undefined} required />
      </FieldGroup>

      {cooldown.locked ? (
        <p role="alert" className="mt-3.5 text-center text-callout text-danger">
          시도가 너무 잦았어요. {cooldown.left}초 뒤에 다시 시도해 주세요.
        </p>
      ) : typeof error === "string" ? (
        <p className="mt-3.5 text-center text-callout text-danger">{error}</p>
      ) : error instanceof ApiError && error.fieldErrors.length === 0 ? (
        <p className="mt-3.5 text-center text-callout text-danger">{error.message}</p>
      ) : null}

      {/* 바꾸고 나면 다른 기기도 함께 로그아웃된다. 겪고 나서 알면 고장으로 읽힌다. */}
      <p className="mt-4 text-foot text-muted">
        비밀번호를 바꾸면 지금 로그인된 모든 기기에서 로그아웃돼요.
      </p>

      <Button type="submit" size="lg" disabled={busy || cooldown.locked} className="mt-4 w-full">
        {cooldown.locked ? `${cooldown.left}초 뒤에 다시` : busy ? "바꾸는 중…" : "비밀번호 바꾸기"}
      </Button>
    </form>

    <p className="mt-8 text-center text-callout text-muted">
      <Link href="/login" className="font-medium text-accent hover:opacity-65">로그인으로 돌아가기</Link>
    </p>
  </>;
}

export default function ResetPasswordPage() {
  return <AuthFrame>
    <Suspense fallback={<p className="text-callout text-muted">불러오는 중</p>}>
      <ResetPasswordForm />
    </Suspense>
  </AuthFrame>;
}
