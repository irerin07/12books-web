"use client";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { useSession } from "@/lib/session";
export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useSession();
  if (["/login", "/signup"].includes(pathname)) return <>{children}</>;
  return <><Nav /><div className="app-body"><main id="main-content" key={pathname} className="page-container">{loading ? <div role="status" aria-label="불러오는 중" className="space-y-5"><div className="h-8 w-36 animate-pulse rounded bg-fill" /><div className="h-14 animate-pulse rounded-xl bg-fill" /><div className="h-60 animate-pulse rounded-xl bg-fill" /></div> : children}</main></div></>;
}
