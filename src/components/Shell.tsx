"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { useSession } from "@/lib/session";

/** 로그인·가입 화면은 껍데기 없이 혼자 선다. */
const BARE = ["/login", "/signup"];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useSession();

  if (BARE.includes(pathname)) return <>{children}</>;

  return (
    <div>
      <Nav />
      {/* 사이드바 너비만큼 비우고, 모바일에서는 하단 탭에 가리지 않게 아래를 띄운다 */}
      <main className="mx-auto w-full max-w-[935px] px-4 pb-20 pt-4 md:pl-[88px] md:pb-8 xl:pl-64">
        {loading ? <Skeleton /> : children}
      </main>
    </div>
  );
}

/**
 * 첫 재발급이 끝나기 전의 자리.
 *
 * 이 순간에 "로그인해 주세요"를 띄우면, 이미 로그인한 사람이 새로고침할 때마다
 * 로그인 화면이 깜빡였다가 사라진다.
 */
function Skeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 pt-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] animate-pulse rounded bg-black/5 dark:bg-white/10" />
      ))}
    </div>
  );
}
