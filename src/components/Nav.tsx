"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";

type Item = { href: string; label: string; icon: React.ReactNode };

/** 선이 얇은 단색 아이콘. 표지 이미지가 주인공이라 UI는 뒤로 물러나야 한다. */
function Icon({ path, filled }: { path: string; filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const HOME = "M3 10.2 12 3l9 7.2V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z";
const SEARCH = "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2-4.35-4.35";
const SHELF = "M4 3h4v18H4zM10 3h4v18h-4zM17.5 3.6l3.4.9-4 17-3.4-1z";
const PERSON = "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM3.5 21a8.5 8.5 0 0 1 17 0";

export default function Nav() {
  const pathname = usePathname();
  const { me } = useSession();

  const items: Item[] = [
    { href: "/", label: "홈", icon: <Icon path={HOME} filled={pathname === "/"} /> },
    {
      href: "/search",
      label: "검색",
      icon: <Icon path={SEARCH} filled={false} />,
    },
    {
      href: "/library",
      label: "내 서재",
      icon: <Icon path={SHELF} filled={pathname === "/library"} />,
    },
    {
      href: me ? `/u/${me.handle}` : "/login",
      label: "프로필",
      icon: <Icon path={PERSON} filled={pathname.startsWith("/u/")} />,
    },
  ];

  return (
    <>
      {/* 데스크톱: 왼쪽 고정 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-[72px] border-r border-line px-3 py-6 md:flex md:flex-col xl:w-60 xl:px-4">
        <Link href="/" className="mb-8 block px-2 text-xl font-semibold tracking-tight">
          <span className="xl:hidden">12</span>
          <span className="hidden xl:inline">12books</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 rounded-lg px-2 py-3 transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              {item.icon}
              <span className="hidden text-[15px] xl:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* 모바일: 상단 로고 + 하단 탭 */}
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-line bg-canvas px-4 md:hidden">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          12books
        </Link>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex h-14 items-center justify-around border-t border-line bg-canvas md:hidden">
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-label={item.label} className="p-2">
            {item.icon}
          </Link>
        ))}
      </nav>
    </>
  );
}
