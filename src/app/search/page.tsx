"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { parseHistory, readHistory, rememberSearch, subscribeHistory, writeHistory } from "@/lib/searchHistory";
import type { Book, BookSearchPage, BookSearchResult, Reading } from "@/lib/types";
import { Button, Cover, Empty, Spinner } from "@/components/ui";
import ResumeSheet from "@/components/ResumeSheet";
import Icon from "@/components/Icon";
import TopicArt from "@/components/TopicArt";

const topics = [
  {title:"소설",description:"이야기 속으로"},
  {title:"에세이",description:"다른 사람의 시선"},
  {title:"인문",description:"생각의 폭을 넓히는"},
  {title:"과학",description:"세상을 이해하는"},
];
/**
 * 검색 범위. 서버의 BookSearchTarget과 같은 값이다.
 *
 * 섞여 있으면 원하는 쪽이 묻힌다 — 백엔드 실측으로 "박경리"는 전체 628건인데 저자로 좁히면
 * 568건, 제목으로 좁히면 228건이다. 어느 쪽을 찾는지는 사람이 안다.
 */
const TARGETS = [
  { value: "ALL", label: "전체" },
  { value: "TITLE", label: "제목" },
  { value: "AUTHOR", label: "저자" },
] as const;
type Target = (typeof TARGETS)[number]["value"];

function readTarget(raw: string | null): Target {
  return TARGETS.some(t => t.value === raw) ? (raw as Target) : "ALL";
}

/** 검색 주소 한 곳에서 만든다. 흩어 두면 범위를 붙이는 것을 한쪽에서 잊는다. */
function searchPath(term: string, target: Target) {
  const params = new URLSearchParams({ q: term });
  if (target !== "ALL") params.set("target", target);
  return `/search?${params}`;
}

export default function SearchPage() {
  return <Suspense fallback={<Spinner />}><SearchRoute /></Suspense>;
}
function SearchRoute() {
  const params = useSearchParams();
  const term = (params.get("q") ?? "").trim();
  const target = readTarget(params.get("target"));
  /* 범위가 바뀌면 다른 검색이다. 앞의 결과가 잠깐 남아 있으면 어느 범위의 것인지 알 수 없다. */
  return <SearchContent key={`${target}:${term}`} term={term} target={target} />;
}
function SearchContent({ term, target }: { term: string; target: Target }) {
  const router = useRouter();
  const { me } = useSession();
  const [query, setQuery] = useState(term);
  const searched = term;
  const [retry, setRetry] = useState(0);
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  /* 최근 검색은 계정마다 따로 담긴다. 로그인한 사람이 없으면 보여줄 것도 없다. */
  const mine = useCallback(() => readHistory(me?.handle ?? null), [me]);
  const history = useSyncExternalStore(subscribeHistory, mine, () => "[]");
  const recent = useMemo(() => parseHistory(history), [history]);
  const [busy, setBusy] = useState(Boolean(term && me));
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  /** 카카오가 세어 준 전체 결과 수. 0이면 모른다는 뜻이라 화면에 띄우지 않는다. */
  const [total, setTotal] = useState(0);
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(Boolean(term && !me));
  const [shelving, setShelving] = useState<string | null>(null);
  /** 전에 읽다 뺀 책을 다시 담으려는 중. 무엇을 할지 고르면 그 값으로 다시 보낸다. */
  const [asking, setAsking] = useState<{ item: BookSearchResult; past: Reading } | null>(null);
  const requestId = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    return () => { requestId.current += 1; };
  }, []);
  function search(value: string) {
    const q = value.trim();
    if (!q) { input.current?.focus(); return; }
    setQuery(q);
    setError(null);
    if (!me) { setNeedsLogin(true); return; }
    if (q === term) { setBusy(true); setResults(null); setRetry(value => value + 1); }
    else router.push(searchPath(q, target));
  }
  useEffect(() => {
    if (!term || !me) return;
    const id = ++requestId.current;
    void api<BookSearchPage>(`/api/v1/books/search?q=${encodeURIComponent(term)}&target=${target}`)
      .then(found => {
        if (id !== requestId.current) return;
        setResults(found.items);
        setPage(found.page); setHasNext(found.hasNext); setTotal(found.totalCount);
        rememberSearch(me.handle, term);
      })
      .catch(e => {
        if (id !== requestId.current) return;
        setError(e instanceof ApiError && e.status === 401 ? "로그인 상태를 확인해 주세요." : "책을 검색하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => { if (id === requestId.current) setBusy(false); });
    return () => { requestId.current += 1; };
  }, [term, target, me, retry]);
  async function loadMore() {
    const next = page + 1;
    const id = requestId.current;
    setMoreBusy(true); setError(null);
    try {
      const found = await api<BookSearchPage>(`/api/v1/books/search?q=${encodeURIComponent(term)}&target=${target}&page=${next}`);
      if (id !== requestId.current) return;
      setResults(prev => [...(prev ?? []), ...found.items]);
      setHasNext(found.hasNext); setPage(found.page);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof ApiError && e.status === 401 ? "로그인 상태를 확인해 주세요." : "다음 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally { if (id === requestId.current) setMoreBusy(false); }
  }
  /**
   * 검색 결과에서 바로 담는다. 책을 내부에 확정하고(POST /books) 그 id로 서재에 넣는다.
   *
   * 전에 읽다 뺀 책이면 서버가 R003으로 막는다. 그때는 지난 기록을 가져와 이어서 읽을지
   * 새로 시작할지 묻고, 고른 값을 담아 다시 보낸다 — 서버가 대신 고르지 않는 이유가
   * 그대로 여기서 물어야 하는 이유다.
   */
  async function shelve(item: BookSearchResult, resume?: boolean) {
    const key = item.isbn13 ?? `${item.title}-${item.authors}`;
    setShelving(key); setError(null);
    try {
      const book = await api<Book>("/api/v1/books", { method: "POST", body: item });
      await api<Reading>("/api/v1/readings", {
        method: "POST",
        body: { bookId: book.id, status: "WANT_TO_READ", ...(resume === undefined ? {} : { resume }) },
      });
      router.push("/library");
    } catch (e) {
      if (e instanceof ApiError && e.code === "R003") {
        try {
          // 같은 책을 다시 확정해도 새 행이 생기지 않고 같은 id가 온다.
          const book = await api<Book>("/api/v1/books", { method: "POST", body: item });
          setAsking({ item, past: await api<Reading>(`/api/v1/books/${book.id}/reading`) });
        } catch { setError("전에 읽던 기록을 불러오지 못했습니다. 다시 시도해 주세요."); }
      } else {
        setError(e instanceof ApiError && e.code === "R002" ? "이미 서재에 담긴 책입니다." : "책을 담지 못했습니다. 다시 시도해 주세요.");
      }
    }
    finally { setShelving(null); }
  }
  const askedTitle = asking?.item.title ?? "";

  return <>
    {asking && <ResumeSheet past={asking.past} title={askedTitle} busy={shelving !== null}
      onPick={resume => void shelve(asking.item, resume)} onClose={() => setAsking(null)} />}
    <div className="content-columns">
      <header className="page-heading"><div><h1>검색</h1></div></header>
      <div className="min-w-0">
      <form role="search" onSubmit={e => { e.preventDefault(); void search(query); }} className="search-box"><Icon name="search" className="h-5 w-5 shrink-0 text-accent" /><input ref={input} value={query} onChange={e => setQuery(e.target.value)} maxLength={100} aria-label="책 제목 또는 작가" placeholder="책 제목 또는 작가 검색" />{query && <button type="button" aria-label="검색어 지우기" onClick={() => { setQuery(""); input.current?.focus(); }} className="p-1 text-faint"><Icon name="close" className="h-4 w-4" /></button>}<Button type="submit" disabled={busy}>검색</Button></form>
      {/*
        범위 토글. 검색창 바로 아래에 둔다 — 무엇을 찾는지 정하고 나서 치는 것이 아니라,
        쳐 보고 너무 많으면 좁히는 순서가 실제 사람의 순서다.

        이미 검색한 뒤라면 누르는 즉시 그 범위로 다시 찾는다. 검색어를 또 치게 하지 않는다.
      */}
      <div className="mt-3 flex justify-center"><div className="segmented">
        {TARGETS.map(option => <button key={option.value} type="button"
          data-on={target === option.value} aria-pressed={target === option.value}
          onClick={() => { const q = query.trim() || term; if (q) router.push(searchPath(q, option.value)); }}
          className="segmented-item px-4 py-2 text-callout font-medium">
          {option.label}
        </button>)}
      </div></div>
      {needsLogin && <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-white px-4 py-3"><p className="text-foot text-muted">책 검색은 로그인 후 이용할 수 있어요.</p><Link href="/login" className="text-foot font-semibold text-accent">로그인하기 →</Link></div>}
      {error && <div role="alert" className="mt-4 rounded-lg bg-danger/5 p-4 text-foot text-danger">{error}</div>}
      {busy && <Spinner />}
      {results !== null && !busy ? <section className="mt-7"><div className="section-heading"><h2>검색 결과 <span className="ml-1 text-accent">{total > 0 ? total : results.length}</span></h2><button onClick={() => router.push("/search")} className="text-cap text-muted">탐색으로 돌아가기</button></div>{results.length === 0 ? <Empty title={`‘${searched}’ 검색 결과가 없어요`} hint="제목의 일부나 작가 이름으로 다시 찾아보세요." /> : <ul>{results.map((item, index) => { const key = item.isbn13 ?? `${item.title}-${item.authors}`; return <li className="search-result" key={`${key}-${index}`}><Cover src={item.thumbnailUrl} title={item.title} className="w-[66px] shrink-0 sm:w-[72px]" /><div className="min-w-0 flex-1"><h3 className="text-headline leading-relaxed">{item.title}</h3><p className="mt-1.5 text-foot text-muted">{item.authors}</p><p className="mt-1 text-cap text-faint">{[item.publisher,item.publishedAt?.slice(0,4)].filter(Boolean).join(" · ")}</p><Button variant="quiet" onClick={() => void shelve(item)} disabled={shelving !== null} className="mt-3 gap-1.5"><Icon name="plus" className="h-3.5 w-3.5" />{shelving === key ? "담는 중" : "서재에 담기"}</Button></div></li>; })}</ul>}{hasNext && <div className="mt-8 text-center"><Button variant="quiet" onClick={() => void loadMore()} disabled={moreBusy}>{moreBusy ? "불러오는 중" : "더 보기"}</Button></div>}</section> : !busy && <>
        {recent.length > 0 && <section className="mt-6"><div className="section-heading"><h2>최근 검색</h2><button className="text-cap text-muted" onClick={() => writeHistory(me?.handle ?? null, [])}>전체 삭제</button></div><div className="flex flex-wrap gap-2">{recent.map(term => <button className="keyword" key={term} onClick={() => void search(term)}><Icon name="clock" className="h-3.5 w-3.5" />{term}</button>)}</div></section>}
        <section className="mt-8"><div className="section-heading"><h2>주제 키워드로 검색</h2></div><div className="topic-grid">{topics.map((topic, i) => <button key={topic.title} onClick={() => void search(topic.title)} className="topic-card"><div className="topic-copy"><strong>{topic.title}</strong><span>{topic.description}</span><Icon name="arrow" className="mt-5 h-4 w-4 text-muted" /></div><TopicArt variant={i} /></button>)}</div></section>
        <section className="mt-8 border-t border-line pt-6"><div className="section-heading"><h2>관심 있는 주제로</h2></div><div className="flex flex-wrap gap-2">{["한국문학","철학","심리학","예술","여행","자연"].map(term => <button key={term} className="keyword" onClick={() => void search(term)}>{term}<Icon name="arrow" className="h-3 w-3" /></button>)}</div></section>
      </>}
    </div></div>
  </>;
}
