"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import AuthFrame from "@/components/AuthFrame";
import { Button, Field, FieldGroup } from "@/components/ui";

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
    <AuthFrame><h1 className="text-title">내 서재 만들기</h1><p className="mt-2 mb-7 text-callout text-muted">12books에서 나의 독서 생활을 시작하세요.</p>
        <form onSubmit={submit}>
          {/*
            길이 규칙은 서버가 가진다. 여기 적힌 "8~20자"는 검사하는 값이 아니라 안내일 뿐이고,
            실제로 막는 것은 서버가 준 fieldErrors다.
          */}
          <FieldGroup>
            <Field label="이메일" type="email" placeholder="name@example.com"
              value={form.email} onChange={set("email")}
              error={error?.reasonFor("email")} required />
            <Field label="비밀번호" type="password" placeholder="8~20자"
              value={form.password} onChange={set("password")}
              error={error?.reasonFor("password")} required />
            {/*
              "아이디"라고 부르면 로그인에 쓰는 것으로 읽힌다 — 이 앱의 로그인은 이메일이다.
              handle이 실제로 하는 일은 남에게 보이는 주소(/u/…, @…)이고, 가입 뒤에는 바꿀 수
              없다(서버가 PATCH /me에서 아예 받지 않는다). 그 두 가지를 라벨과 설명이 말한다.
            */}
            <Field label="프로필 주소" placeholder="영소문자·숫자·_ 3~20자"
              hint="/u/여기 · @여기로 쓰여요. 가입 뒤에는 바꿀 수 없어요."
              value={form.handle} onChange={set("handle")}
              error={error?.reasonFor("handle")} required />
            {/* "이름"은 실명인지 별명인지 말하지 않는다. 이 값은 글과 프로필에 표시되는 이름이다. */}
            <Field label="닉네임" placeholder="글과 프로필에 보일 이름"
              value={form.displayName} onChange={set("displayName")}
              error={error?.reasonFor("displayName")} required />
          </FieldGroup>

          {error && error.fieldErrors.length === 0 ? (
            <p className="mt-3.5 text-center text-callout text-danger">{error.message}</p>
          ) : null}

          <Button type="submit" size="lg" disabled={busy} className="mt-5 w-full">
            {busy ? "만드는 중…" : "가입하기"}
          </Button>
        </form>

        <p className="mt-8 text-center text-callout text-muted">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-medium text-accent hover:opacity-65">
            로그인
          </Link>
        </p>
    </AuthFrame>
  );
}
