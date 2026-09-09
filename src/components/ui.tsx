"use client";

import Image from "next/image";
import Link from "next/link";

export function Button({
  children,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet";
}) {
  const base =
    "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:opacity-40";
  const look =
    variant === "primary"
      ? "bg-accent text-white hover:bg-accent-hover"
      : "border border-line hover:bg-black/5 dark:hover:bg-white/10";
  return (
    <button {...props} className={`${base} ${look} ${props.className ?? ""}`}>
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink/40"
      />
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

/** 표지 한 장. 이미지가 없을 때도 자리가 무너지지 않게 제목을 대신 세운다. */
export function Cover({
  src,
  title,
  className = "",
}: {
  src: string | null;
  title: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex aspect-[2/3] items-center justify-center bg-black/5 p-2 text-center text-[11px] leading-tight text-muted dark:bg-white/10 ${className}`}
      >
        {title}
      </div>
    );
  }
  return (
    <div className={`relative aspect-[2/3] overflow-hidden bg-black/5 dark:bg-white/10 ${className}`}>
      <Image src={src} alt="" fill sizes="(max-width: 768px) 33vw, 300px" className="object-cover" />
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {hint ? <p className="max-w-xs text-sm text-muted">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-ink" />
    </div>
  );
}

export function SignInWall() {
  return (
    <Empty
      title="로그인이 필요합니다"
      hint="책을 담고 진도를 기록하려면 먼저 로그인하세요."
      action={
        <Link href="/login" className="text-sm font-semibold text-accent">
          로그인하러 가기
        </Link>
      }
    />
  );
}
