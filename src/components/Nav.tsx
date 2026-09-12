"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import Icon from "./Icon";

export function Brand() {
  return <Link href="/" className="brand" aria-label="12books 홈"><span className="brand-mark"><Icon name="book" className="h-5 w-5" /></span><span>12books<span>.</span></span></Link>;
}
export default function Nav() {
  const pathname = usePathname();
  const { me } = useSession();
  const items = [
    /*
     * 팔로잉은 메뉴가 아니라 홈 안의 탭이다. 홈에서 "추천 / 팔로잉"을 오갈 수 있는데
     * 사이드바에 같은 목적지를 또 두면, 같은 곳으로 가는 길이 둘이라 어느 쪽이 지금 자리인지
     * 흐려진다. 그래서 두 경로 모두에서 "홈"이 지금 자리로 켜진다.
     */
    { href: "/", label: "홈", icon: "home" as const, active: pathname === "/" || pathname === "/following" },
    { href: "/search", label: "검색", icon: "search" as const, active: pathname === "/search" },
    { href: "/library", label: "내 서재", icon: "books" as const, active: pathname === "/library" },
    { href: me ? `/u/${me.handle}` : "/login", label: "프로필", icon: "user" as const, active: pathname.startsWith("/u/") },
  ];
  return <>
    <aside className="app-sidebar">
      <Brand />
      <div className="sidebar-menu">
      <nav aria-label="주 메뉴" className="desktop-nav">{items.map(item => <Link key={item.label} href={item.href} aria-label={item.label} aria-current={item.active ? "page" : undefined} className="nav-item"><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
      <Link className="sidebar-compose" aria-label="기록하기" href={me ? "/library" : "/login"}><Icon name="pen" /><span>기록하기</span></Link>
      </div>
      <div className="sidebar-bottom">
        <Link href={me ? `/u/${me.handle}` : "/login"} className="account-link" aria-label={me ? `${me.handle} 내 프로필` : "로그인"}>
          <span className="avatar">{me ? me.handle[0].toUpperCase() : <Icon name="user" className="h-[18px] w-[18px]" />}</span>
          <span className="truncate">{me ? `@${me.handle}` : "로그인"}</span>
          <Icon name="chevron" className="ml-auto h-4 w-4" />
        </Link>
      </div>
    </aside>
    <header className="mobile-header"><Brand /><Link href={me ? "/library" : "/login"} className="text-foot font-semibold text-accent">{me ? "기록하기" : "로그인"}</Link></header>
    <nav aria-label="모바일 주 메뉴" className="mobile-nav">{items.map(item => <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
  </>;
}
