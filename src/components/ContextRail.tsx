"use client";
import Link from "next/link";
import { useSession } from "@/lib/session";
import Icon from "./Icon";

export default function ContextRail() {
  const { me } = useSession();
  return <aside className="context-rail space-y-5">
    <section className="panel side-panel"><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-fill text-accent"><Icon name="books" /></span><h2>{me ? "내 서재에 담아 두세요" : "읽고 싶은 책부터 한 권"}</h2><p className="mt-2">{me ? "관심 있는 책을 모으고, 읽는 중인 책의 페이지를 기록하세요." : "책을 담고 읽은 페이지를 기록하는 나만의 공간을 만들어 보세요."}</p><Link href={me ? "/library" : "/signup"} className="mt-5 flex items-center justify-between rounded-lg bg-accent px-3.5 py-2.5 text-foot font-semibold text-white">{me ? "내 서재 열기" : "무료로 시작하기"}<Icon name="arrow" className="h-4 w-4" /></Link>{!me && <p className="mt-3 text-center">이미 계정이 있나요? <Link href="/login" className="text-accent font-medium">로그인</Link></p>}</section>
    <section className="px-1 pt-2"><h2 className="mb-4 text-foot font-semibold">책을 고른 다음에는</h2><div className="space-y-5">{[{icon:"plus" as const,title:"서재에 담기",text:"읽고 싶은 책을 한곳에"},{icon:"book" as const,title:"내 속도로 읽기",text:"잠시 멈춰도 괜찮아요"},{icon:"pen" as const,title:"읽은 페이지 기록",text:"오늘 읽은 만큼만"}].map(step=><div key={step.title} className="flex gap-3"><Icon name={step.icon} className="mt-0.5 h-4 w-4 shrink-0 text-faint" /><div><p className="text-foot font-medium">{step.title}</p><p className="mt-1 text-cap text-muted">{step.text}</p></div></div>)}</div></section>
    <p className="border-t border-line pt-5 text-[11px] text-faint">12books · 나의 독서 생활</p>
  </aside>;
}
