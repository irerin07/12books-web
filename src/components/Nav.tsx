"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import Icon from "./Icon";

export function Brand() {
  return <Link href="/" className="brand" aria-label="12books 홈"><span className="brand-mark"><Icon name="book" className="h-5 w-5" /></span><span>12books<span className="text-accent">.</span></span></Link>;
}
export default function Nav() {
  const pathname = usePathname();
  const { me } = useSession();
  const items = [
    { href: "/", label: "홈", icon: "home" as const, active: pathname === "/" },
    { href: "/search", label: "책 발견", icon: "search" as const, active: pathname === "/search" },
    { href: "/library", label: "내 서재", icon: "books" as const, active: pathname === "/library" },
    { href: me ? `/u/${me.handle}` : "/login", label: "프로필", icon: "user" as const, active: pathname.startsWith("/u/") },
  ];
  return <>
    <aside className="app-sidebar">
      <Brand />
      <nav aria-label="주 메뉴" className="desktop-nav">{items.map(item => <Link key={item.label} href={item.href} aria-label={item.label} aria-current={item.active ? "page" : undefined} className="nav-item"><Icon name={item.icon} /><span>{item.label}</span>{item.active && <i />}</Link>)}</nav>
      <Link className="sidebar-compose" href={me ? "/library" : "/login"}><Icon name="pen" /><span>읽은 페이지 기록</span></Link>
      <div className="sidebar-bottom">{me ? <Link href={`/u/${me.handle}`} className="account-link"><span className="avatar">{me.handle[0].toUpperCase()}</span><span className="truncate">@{me.handle}</span><Icon name="chevron" className="ml-auto h-4 w-4" /></Link> : <><p>나만의 독서 생활을 시작하세요.</p><Link href="/signup" className="text-accent font-semibold">무료로 가입하기 ↗</Link></>}<p className="sidebar-copyright">© 12books</p></div>
    </aside>
    <header className="mobile-header"><Brand /><Link href={me ? "/library" : "/login"} className="text-foot font-semibold text-accent">{me ? "기록하기" : "로그인"}</Link></header>
    <nav aria-label="모바일 주 메뉴" className="mobile-nav">{items.map(item => <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span></Link>)}</nav>
  </>;
}
