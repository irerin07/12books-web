"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import Icon from "./Icon";
import { useSession } from "@/lib/session";

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { me, loading } = useSession();
  if (["/login", "/signup"].includes(pathname)) return <>{children}</>;
  const title = pathname === "/" ? "홈" : pathname === "/search" ? "책 발견" : pathname === "/library" ? "내 서재" : "프로필";
  return <><Nav /><div className="app-body"><div className="topbar"><div className="flex items-center gap-3 text-foot"><span className="text-muted">12books</span><Icon name="chevron" className="h-3 w-3 text-faint" /><span>{title}</span></div><Link href={me ? `/u/${me.handle}` : "/login"} className="text-foot font-medium">{me ? `@${me.handle}` : "로그인"}</Link></div><main id="main-content" key={pathname} className="page-container">{loading ? <div role="status" aria-label="불러오는 중" className="space-y-5"><div className="h-8 w-36 animate-pulse rounded bg-fill" /><div className="h-14 animate-pulse rounded-xl bg-fill" /><div className="h-60 animate-pulse rounded-xl bg-fill" /></div> : children}</main></div></>;
}
