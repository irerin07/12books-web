"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Profile } from "@/lib/types";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

/**
 * 로그인 직후 어디로 보낼지.
 *
 * 고른 사람들의 글이 있는 쪽이 기본이다. 다만 아무도 팔로우하지 않았다면 팔로잉은 비어 있고,
 * 처음 들어온 사람에게 빈 화면을 보여주게 된다 — 그때는 발견이 사람을 만나는 자리다.
 *
 * 물어보는 데 실패하면 발견으로 보낸다. 목적지를 정하려다 로그인 자체를 막을 일은 아니다.
 */
async function landingFor(handle: string) {
  try {
    const me = await api<Profile>(`/api/v1/users/${handle}`);
    return me.followingCount > 0 ? "/following" : "/";
  } catch {
    return "/";
  }
}

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
      router.replace(await landingFor(who.handle));
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
