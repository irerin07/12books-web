"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem } from "@/lib/types";
import { Button, Cover, Empty, LinkButton, Spinner } from "@/components/ui";
import Icon from "@/components/Icon";
import BookArt from "@/components/BookArt";
import ContextRail from "@/components/ContextRail";
import ReadingSheet from "@/components/ReadingSheet";

export default function HomePage() {
  const { me } = useSession();
  const [reading, setReading] = useState<LibraryItem[]>([]);
  const [finished, setFinished] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  useEffect(() => {
    if (!me) return;
    let active = true;
    void Promise.all([
      api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=READING&size=12`),
      api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=FINISHED&finishedYear=${new Date().getFullYear()}&size=12`),
    ]).then(([current, done]) => { if (active) { setReading(current.items); setFinished(done.items); } })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [me]);
  if (!me) return <div className="content-columns"><div className="min-w-0">
    <section className="welcome-banner"><div><span className="mb-3 inline-block text-cap font-semibold text-accent">나의 독서 생활, 12books</span><h1>읽고 있는 책과<br />조금 더 가까이.</h1><p className="mt-4">읽고 싶은 책을 모으고,<br />오늘 읽은 페이지를 남겨 보세요.</p><Link href="/signup" className="mt-6 inline-flex items-center gap-4 rounded-lg bg-accent px-5 py-3 text-callout font-semibold text-white">내 서재 시작하기<Icon name="arrow" className="h-4 w-4" /></Link></div><BookArt /></section>
    <section className="mt-8"><div className="section-heading"><h2>한 권으로 시작하는 독서 기록</h2><Link href="/search" className="text-foot text-accent">책 찾아보기 →</Link></div>{[{title:"읽고 싶은 책을 발견하세요",text:"제목, 작가, 관심 있는 분야로 책을 찾을 수 있어요."},{title:"지금 읽는 책을 서재에 놓으세요",text:"읽고 싶은 책부터 다 읽은 책까지, 상태별로 정리해요."},{title:"오늘 읽은 페이지를 남기세요",text:"완독을 기다릴 필요 없이, 지금 읽은 만큼 기록하세요."}].map((step,i)=><div className="step-row" key={step.title}><span className="step-number">{i+1}</span><div><h3 className="text-headline">{step.title}</h3><p className="mt-1.5 text-foot text-muted">{step.text}</p></div></div>)}</section>
    <div className="mt-7 flex items-center gap-3 rounded-lg bg-fill px-4 py-3"><Icon name="book" className="h-4 w-4 shrink-0 text-accent" /><p className="text-foot text-muted">감상을 나누고 같은 책의 독자를 만나는 기능도 준비하고 있어요.</p></div>
  </div><ContextRail /></div>;
  return <>
    <header className="page-heading"><div><h1>나의 독서 생활</h1><p>@{me.handle}님, 읽던 책을 이어가 볼까요?</p></div><LinkButton href="/search"><Icon name="plus" className="mr-1.5 h-4 w-4" />책 담기</LinkButton></header>
    <div className="content-columns"><div className="min-w-0"><div className="section-heading"><h2>지금 읽는 책 <span className="ml-1 text-accent">{reading.length || ""}</span></h2><Link href="/library" className="text-cap text-muted">서재 전체 →</Link></div>
      {busy ? <Spinner /> : error ? <Empty title="책을 불러오지 못했어요" hint="잠시 후 서재에서 다시 확인해 주세요." action={<LinkButton href="/library">서재 열기</LinkButton>} /> : reading.length === 0 ? <Empty title="지금 읽는 책을 추가해 보세요" hint="서재의 책을 ‘읽는 중’으로 바꾸면 여기서 바로 기록할 수 있어요." action={<LinkButton href="/library">내 서재에서 선택</LinkButton>} /> : <ul className="space-y-3">{reading.map(item=><li key={item.reading.id} className="reading-row"><Cover src={item.book.thumbnailUrl} title={item.book.title} className="w-[64px] shrink-0" /><div className="min-w-0 flex-1"><span className="status-tag" data-reading="true">읽는 중</span><h3 className="mt-2 text-headline">{item.book.title}</h3><p className="mt-1 text-cap text-muted">{item.book.authors}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-cap tabular-nums text-muted">{item.reading.currentPage}{item.reading.pageCount ? ` / ${item.reading.pageCount}` : ""}쪽</span><Button variant="quiet" className="gap-1.5" onClick={()=>setSelected(item)}><Icon name="pen" className="h-3.5 w-3.5" />페이지 기록</Button></div></div></li>)}</ul>}
      {!busy && finished.length > 0 && <section className="mt-8"><div className="section-heading"><h2>올해 읽은 책</h2><Link href="/library" className="text-cap text-muted">더 보기 →</Link></div><div className="flex gap-5 overflow-x-auto pb-3">{finished.map(item=><button key={item.reading.id} onClick={()=>setSelected(item)} className="w-[82px] shrink-0 text-left"><Cover src={item.book.thumbnailUrl} title={item.book.title} /><p className="mt-2 line-clamp-2 text-cap">{item.book.title}</p></button>)}</div></section>}
    </div><ContextRail /></div>
    {selected && <ReadingSheet item={selected} onClose={()=>setSelected(null)} onChanged={r=>{ const updated={...selected,reading:r}; setReading(items=>[...items.filter(item=>item.reading.id!==r.id),...(r.status==="READING"?[updated]:[])]); setFinished(items=>[...items.filter(item=>item.reading.id!==r.id),...(r.status==="FINISHED"&&r.finishedAt?.startsWith(String(new Date().getFullYear()))?[updated]:[])]); setSelected(updated); }} onRemoved={id=>{setReading(items=>items.filter(item=>item.reading.id!==id));setFinished(items=>items.filter(item=>item.reading.id!==id));setSelected(null);}} />}
  </>;
}
