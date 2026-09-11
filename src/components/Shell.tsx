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
  /*
   * 위쪽 이름표. 모르는 경로를 "프로필"로 떨어뜨리면 탭을 더할 때마다 엉뚱한 이름이 걸린다 —
   * 실제로 /following이 "프로필"로 나왔다. 긴 경로부터 보고, 끝내 모르면 앱 이름만 남긴다.
   */
  const title =
    pathname === "/" ? "홈" :
    pathname === "/following" ? "팔로잉" :
    pathname === "/search" ? "책 발견" :
    pathname === "/library" ? "내 서재" :
    pathname.endsWith("/followers") ? "팔로워" :
    pathname.endsWith("/followings") ? "팔로잉" :
    pathname.startsWith("/u/") ? "프로필" : null;
  return <><Nav /><div className="app-body"><div className="topbar"><div className="flex items-center gap-3 text-foot"><span className="text-muted">12books</span>{title && <><Icon name="chevron" className="h-3 w-3 text-faint" /><span>{title}</span></>}</div><Link href={me ? `/u/${me.handle}` : "/login"} className="text-foot font-medium">{me ? `@${me.handle}` : "로그인"}</Link></div><main id="main-content" key={pathname} className="page-container">{loading ? <div role="status" aria-label="불러오는 중" className="space-y-5"><div className="h-8 w-36 animate-pulse rounded bg-fill" /><div className="h-14 animate-pulse rounded-xl bg-fill" /><div className="h-60 animate-pulse rounded-xl bg-fill" /></div> : children}</main></div></>;
}
