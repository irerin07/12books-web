"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { useCooldown } from "@/lib/cooldown";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

/**
 * 비밀번호 재설정 요청.
 *
 * 서버는 계정이 있든 없든 204를 준다 — "가입되지 않은 이메일입니다"로 답하면 그 한 줄이
 * 계정 존재를 확인하는 도구가 되기 때문이다. 그래서 이 화면도 결과를 말할 수 없고,
 * 말해서도 안 된다. 조건부로 안내한다.
 *
 * 메일 발송이 실패해도 204다. 즉 "보냈다"고 단정하면 틀릴 수 있어서, 안 왔을 때 무엇을
 * 해야 하는지를 같은 자리에 적어 둔다.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api<void>("/api/v1/auth/password-reset", { method: "POST", body: { email }, anonymous: true });
      setSent(true);
    } catch (e) {
      if (cooldown.take(e)) setError(null);
      else setError("요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  return <AuthFrame>
    {sent ? <>
      <h1 className="text-title">메일을 확인해 주세요</h1>
      <p className="mt-3 text-callout text-muted">
        {email} 으로 가입된 계정이 있다면 재설정 링크를 보냈어요. 링크는 한 번만 쓸 수 있어요.
      </p>
      {/* 발송 실패도 204라 "보냈다"고 단정할 수 없다. 안 왔을 때 할 일을 같이 적는다. */}
      <p className="mt-4 text-foot text-muted">
        메일이 안 보이면 스팸함을 확인해 주세요. 그래도 없으면 다시 요청할 수 있어요.
      </p>
      <Button variant="quiet" size="lg" className="mt-6 w-full" onClick={() => setSent(false)}>
        다시 요청하기
      </Button>
      <p className="mt-8 text-center text-callout text-muted">
        <Link href="/login" className="font-medium text-accent hover:opacity-65">로그인으로 돌아가기</Link>
      </p>
    </> : <>
      <h1 className="text-title">비밀번호 재설정</h1>
      <p className="mt-2 mb-7 text-callout text-muted">가입한 이메일로 재설정 링크를 보내드려요.</p>
      <form onSubmit={submit}>
        <FieldGroup>
          <Field label="이메일" type="email" autoComplete="email" placeholder="name@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </FieldGroup>

        {cooldown.locked ? (
          <p role="alert" className="mt-3.5 text-center text-callout text-danger">
            요청이 너무 잦았어요. {cooldown.left}초 뒤에 다시 시도해 주세요.
          </p>
        ) : error ? (
          <p className="mt-3.5 text-center text-callout text-danger">{error}</p>
        ) : null}

        <Button type="submit" size="lg" disabled={busy || cooldown.locked} className="mt-5 w-full">
          {cooldown.locked ? `${cooldown.left}초 뒤에 다시` : busy ? "보내는 중…" : "재설정 링크 받기"}
        </Button>
      </form>

      <p className="mt-8 text-center text-callout text-muted">
        비밀번호가 기억났나요?{" "}
        <Link href="/login" className="font-medium text-accent hover:opacity-65">로그인</Link>
      </p>
    </>}
  </AuthFrame>;
}
