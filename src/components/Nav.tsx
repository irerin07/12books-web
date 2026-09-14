"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import RecordSheet from "./RecordSheet";
import Icon from "./Icon";
import { refreshUnread, useUnread } from "@/lib/unread";

export function Brand({ href = "/" }: { href?: string } = {}) {
  return <Link href={href} className="brand" aria-label="12books 홈"><span className="brand-mark"><Icon name="book" className="h-5 w-5" /></span><span>12books<span>.</span></span></Link>;
}
export default function Nav() {
  const pathname = usePathname();
  const { me, homeHref } = useSession();
  const [dismissed, setDismissed] = useState(false);
  /*
   * 기록하기는 서재로 보내지 않는다. 그러면 "내 서재"와 같은 일을 하는 메뉴가 둘이 된다 —
   * 서재는 무엇을 갖고 있는지 보는 자리, 여기는 지금 읽던 책에 한 줄 남기는 자리다.
   */
  const [recording, setRecording] = useState(false);
  /*
   * 안 읽은 알림 수. 서버가 밀어 주지 않으니(실시간 전달 없음) 화면이 주기적으로 묻는다.
   *
   * 화면을 옮길 때도 다시 센다 — 알림 화면에서 읽고 나왔을 때 배지가 남아 있으면 안 되고,
   * 좋아요·댓글은 서버가 알림을 조금 뒤에 저장해서 반응 직후에는 아직 안 잡히기 때문이다.
   */
  const unread = useUnread();
  useEffect(() => {
    if (!me) return;
    void refreshUnread();
    const timer = setInterval(() => { if (!document.hidden) void refreshUnread(); }, 60_000);
    return () => clearInterval(timer);
  }, [me, pathname]);
  const items = [
    /*
     * 팔로잉은 메뉴가 아니라 홈 안의 탭이다. 홈에서 "추천 / 팔로잉"을 오갈 수 있는데
     * 사이드바에 같은 목적지를 또 두면, 같은 곳으로 가는 길이 둘이라 어느 쪽이 지금 자리인지
     * 흐려진다. 그래서 두 경로 모두에서 "홈"이 지금 자리로 켜진다.
     */
    { href: homeHref, label: "홈", icon: "home" as const, active: pathname === "/" || pathname === "/following", badge: 0 },
    { href: "/search", label: "검색", icon: "search" as const, active: pathname === "/search", badge: 0 },
    { href: "/library", label: "내 서재", icon: "books" as const, active: pathname === "/library", badge: 0 },
    { href: me ? "/notifications" : "/login", label: "알림", icon: "bell" as const, active: pathname === "/notifications", badge: unread },
    { href: me ? `/u/${me.handle}` : "/login", label: "프로필", icon: "user" as const, active: pathname.startsWith("/u/"), badge: 0 },
  ];
  return <>
    <aside className="app-sidebar" data-dismissed={dismissed}
      onPointerLeave={() => setDismissed(false)}
      onFocus={event => {
        if (event.target.matches(":focus-visible")) setDismissed(false);
      }}
      onKeyDown={event => {
        if (event.key === "Tab") setDismissed(false);
        if (event.key === "Escape") setDismissed(true);
      }}
      onClick={event => {
        if (event.target instanceof Element && event.target.closest("a")) setDismissed(true);
      }}>
      <Brand href={homeHref} />
      <div className="sidebar-menu">
      <nav aria-label="주 메뉴" className="desktop-nav">{items.map(item => <Link key={item.label} href={item.href} aria-label={item.label} aria-current={item.active ? "page" : undefined} className="nav-item"><span className="nav-icon"><Icon name={item.icon} />{!!item.badge && <span className="nav-badge" aria-hidden="true">{item.badge > 99 ? "99+" : item.badge}</span>}</span><span>{item.label}{!!item.badge && <span className="sr-only"> 안 읽음 {item.badge}건</span>}</span></Link>)}</nav>
      {me
        ? <button type="button" className="sidebar-compose" aria-label="기록하기" onClick={() => setRecording(true)}><Icon name="pen" /><span>기록하기</span></button>
        : <Link className="sidebar-compose" aria-label="기록하기" href="/login"><Icon name="pen" /><span>기록하기</span></Link>}
      </div>
      <div className="sidebar-bottom">
        <Link href={me ? `/u/${me.handle}` : "/login"} className="account-link" aria-label={me ? `${me.handle} 내 프로필` : "로그인"}>
          <span className="avatar">{me ? me.handle[0].toUpperCase() : <Icon name="user" className="h-[18px] w-[18px]" />}</span>
          <span className="truncate">{me ? `@${me.handle}` : "로그인"}</span>
          <Icon name="chevron" className="ml-auto h-4 w-4" />
        </Link>
      </div>
    </aside>
    <header className="mobile-header"><Brand href={homeHref} />{me
      ? <button type="button" onClick={() => setRecording(true)} className="text-foot font-semibold text-accent">기록하기</button>
      : <Link href="/login" className="text-foot font-semibold text-accent">로그인</Link>}</header>
    {recording && <RecordSheet onClose={() => setRecording(false)} />}
    <nav aria-label="모바일 주 메뉴" className="mobile-nav">{items.map(item => <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined}><span className="nav-icon"><Icon name={item.icon} />{!!item.badge && <span className="nav-badge" aria-hidden="true">{item.badge > 99 ? "99+" : item.badge}</span>}</span><span>{item.label}{!!item.badge && <span className="sr-only"> 안 읽음 {item.badge}건</span>}</span></Link>)}</nav>
  </>;
}
