"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem, ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABEL } from "@/lib/types";
import LibraryGrid from "@/components/LibraryGrid";
import ReadingSheet from "@/components/ReadingSheet";
import { Button, Cover, Empty, LinkButton, Spinner } from "@/components/ui";
import Icon from "@/components/Icon";
import BookArt from "@/components/BookArt";

const FILTERS: {value:ReadingStatus|"";label:string}[] = [{value:"",label:"전체"},{value:"READING",label:"읽는 중"},{value:"WANT_TO_READ",label:"읽고 싶은"},{value:"FINISHED",label:"읽은 책"},{value:"PAUSED",label:"잠시 멈춘"},{value:"DROPPED",label:"그만 읽은"}];
type Shelf = CursorPage<LibraryItem> & {key:string; error?:string};
export default function LibraryPage() {
  const { me } = useSession();
  const [status,setStatus]=useState<ReadingStatus|"">("");
  const [shelf,setShelf]=useState<Shelf|null>(null);
  const [selected,setSelected]=useState<LibraryItem|null>(null);
  const [moreBusy,setMoreBusy]=useState(false);
  const [attempt,setAttempt]=useState(0);
  /*
   * 서재 맨 위의 두 줄. 아래 격자와 다른 질문에 답한다 — 격자는 "무엇을 갖고 있나",
   * 이 두 줄은 "지금 어디까지 왔나"다. 홈에 있던 것을 여기로 옮겼다.
   */
  const [reading,setReading]=useState<LibraryItem[]>([]);
  const [finished,setFinished]=useState<LibraryItem[]>([]);
  const [topBusy,setTopBusy]=useState(true);
  const key=`${me?.handle}:${status}:${attempt}`;
  const activeKey=useRef(key);
  const fetchPage=useCallback((cursor:number|null)=>{
    const params=new URLSearchParams({size:"24"});
    if(status) params.set("status",status);
    if(cursor!==null) params.set("cursor",String(cursor));
    return api<CursorPage<LibraryItem>>(`/api/v1/users/${me!.handle}/library?${params}`);
  },[me,status]);
  useEffect(()=>{
    activeKey.current=key;
    if(!me) return;
    let active=true;
    void fetchPage(null).then(page=>{if(active)setShelf({...page,key});}).catch(()=>{if(active)setShelf({key,items:[],hasNext:false,nextCursor:null,error:"서재를 불러오지 못했습니다."});});
    return ()=>{active=false;};
  },[key,me,fetchPage]);
  useEffect(()=>{
    if(!me) return;
    let active=true;
    void Promise.all([
      api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=READING&size=12`),
      api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=FINISHED&finishedYear=${new Date().getFullYear()}&size=12`),
    ]).then(([current,done])=>{if(active){setReading(current.items);setFinished(done.items);}})
      // 맨 위 두 줄이 실패해도 서재 격자는 제 몫을 한다. 여기서 화면 전체를 세우지 않는다.
      .catch(()=>{})
      .finally(()=>{if(active)setTopBusy(false);});
    return ()=>{active=false;};
  },[me]);
  /** 상태가 바뀌면 두 줄에서 넣고 빼는 규칙. 격자와 따로 관리해야 화면이 어긋나지 않는다. */
  function restack(item:LibraryItem){
    const year=String(new Date().getFullYear());
    setReading(items=>[...items.filter(i=>i.reading.id!==item.reading.id),...(item.reading.status==="READING"?[item]:[])]);
    setFinished(items=>[...items.filter(i=>i.reading.id!==item.reading.id),...(item.reading.status==="FINISHED"&&item.reading.finishedAt?.startsWith(year)?[item]:[])]);
  }
  async function loadMore(){
    if(!shelf||moreBusy)return;
    setMoreBusy(true);
    try {const page=await fetchPage(shelf.nextCursor);if(activeKey.current===key)setShelf(prev=>prev?.key===key?{...page,key,items:[...prev.items,...page.items]}:prev);}
    catch {if(activeKey.current===key)setShelf(prev=>prev?{...prev,error:"추가 책을 불러오지 못했습니다. 다시 시도해 주세요."}:prev);}
    finally {setMoreBusy(false);}
  }
  const current=shelf?.key===key?shelf:null;
  return <>
    <header className="page-heading"><div><h1>내 서재</h1><p>{me ? "읽고 싶은 책부터 오래 기억할 책까지." : "관심 있는 책을 모으고, 읽는 과정을 기록하세요."}</p></div><LinkButton href={me?"/search":"/signup"}><Icon name="plus" className="mr-1.5 h-4 w-4" />{me?"책 담기":"시작하기"}</LinkButton></header>
    {!me ? <><section className="welcome-banner"><div><h2 className="text-title font-semibold">아직 비어 있는, 나만의 서재</h2><p className="mt-3">책 한 권을 담는 것부터 시작해 보세요.<br />읽는 중 · 읽고 싶은 · 읽은 책으로 정리할 수 있어요.</p><Link href="/login" className="mt-5 inline-flex items-center gap-2 text-callout font-semibold text-accent">로그인하고 서재 만들기<Icon name="arrow" className="h-4 w-4" /></Link></div><BookArt /></section><div className="mt-6 grid gap-4 sm:grid-cols-3">{[{name:"읽고 싶은 책",icon:"plus" as const,text:"다음에 읽을 책을 미리 담아 두세요."},{name:"읽는 중인 책",icon:"book" as const,text:"현재 페이지를 기록하며 이어 읽으세요."},{name:"다 읽은 책",icon:"check" as const,text:"함께한 책들이 나만의 서재가 됩니다."}].map(step=><div key={step.name} className="panel p-5"><Icon name={step.icon} className="mb-4 h-5 w-5 text-accent" /><h3 className="text-headline">{step.name}</h3><p className="mt-2 text-foot text-muted">{step.text}</p></div>)}</div></> : <>
      {topBusy ? <Spinner /> : <>
        {reading.length>0 && <section className="mb-9"><div className="section-heading"><h2>지금 읽는 책 <span className="ml-1 text-accent">{reading.length}</span></h2></div><ul className="space-y-3">{reading.map(item=><li key={item.reading.id} className="reading-row"><Cover src={item.book.thumbnailUrl} title={item.book.title} className="w-[64px] shrink-0" /><div className="min-w-0 flex-1"><span className="status-tag" data-reading="true">읽는 중</span><h3 className="mt-2 text-headline">{item.book.title}</h3><p className="mt-1 text-cap text-muted">{item.book.authors}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-cap tabular-nums text-muted">{item.reading.currentPage}{item.reading.pageCount ? ` / ${item.reading.pageCount}` : ""}쪽</span><Button variant="quiet" className="gap-1.5" onClick={()=>setSelected(item)}><Icon name="pen" className="h-3.5 w-3.5" />페이지 기록</Button></div></div></li>)}</ul></section>}
        {finished.length>0 && <section className="mb-9"><div className="section-heading"><h2>올해 읽은 책 <span className="ml-1 text-accent">{finished.length}</span></h2></div><div className="flex gap-5 overflow-x-auto pb-3">{finished.map(item=><button key={item.reading.id} onClick={()=>setSelected(item)} className="w-[82px] shrink-0 text-left"><Cover src={item.book.thumbnailUrl} title={item.book.title} /><p className="mt-2 line-clamp-2 text-cap">{item.book.title}</p></button>)}</div></section>}
      </>}
      <div className="mb-6 overflow-x-auto"><div className="segmented min-w-max">{FILTERS.map(filter=><button key={filter.value} data-on={status===filter.value} aria-pressed={status===filter.value} onClick={()=>setStatus(filter.value)} className="segmented-item shrink-0 text-callout font-medium">{filter.label}</button>)}</div></div>
      {current && <div className="mb-5 flex items-center justify-between text-cap text-muted"><span>{current.items.length}{current.hasNext?"+":""}권</span><span className="flex items-center gap-1.5"><Icon name="grid" className="h-3.5 w-3.5" />표지 보기</span></div>}
      {current?.error && <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-danger/5 p-4 text-foot text-danger">{current.error}<button onClick={()=>setAttempt(a=>a+1)} className="shrink-0 underline">다시 시도</button></div>}
      {!current ? <Spinner /> : current.items.length ? <LibraryGrid items={current.items} onSelect={setSelected} /> : !current.error && <Empty title={status?`${READING_STATUS_LABEL[status]} 책이 없어요`:"첫 번째 책을 담아 보세요"} hint={status?"책의 읽기 상태를 변경하면 여기에 표시됩니다.":"검색에서 책을 찾아 내 서재에 추가할 수 있어요."} action={<LinkButton href="/search">책 찾기</LinkButton>} />}
      {current?.hasNext && <div className="mt-8 text-center"><Button variant="quiet" onClick={()=>void loadMore()} disabled={moreBusy}>{moreBusy?"불러오는 중":"더 보기"}</Button></div>}
    </>}
    {selected && <ReadingSheet item={selected} onClose={()=>setSelected(null)} onChanged={reading=>{restack({...selected,reading});setShelf(prev=>prev?{...prev,items:prev.items.flatMap(item=>item.reading.id===reading.id?(!status||reading.status===status?[{...item,reading}]:[]):[item])}:prev);setSelected({...selected,reading});}} onRemoved={id=>{setReading(items=>items.filter(i=>i.reading.id!==id));setFinished(items=>items.filter(i=>i.reading.id!==id));setShelf(prev=>prev?{...prev,items:prev.items.filter(item=>item.reading.id!==id)}:prev);setSelected(null);}} />}
  </>;
}
