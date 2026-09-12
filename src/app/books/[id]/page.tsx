"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Book, Reading } from "@/lib/types";
import { Button, Cover, Empty, LinkButton, Spinner } from "@/components/ui";
import ResumeSheet from "@/components/ResumeSheet";
import Icon from "@/components/Icon";
import Feed from "@/components/Feed";
import PostComposer from "@/components/PostComposer";

/**
 * 책 한 권과 그 책에 남겨진 감상평.
 *
 * 같은 책을 읽은 사람이 만나는 자리다. 홈에서 감상평을 보고 "이 책 뭐지" 하고 들어오면
 * 다른 사람들의 기록이 함께 있고, 거기서 팔로우할 사람을 찾게 된다.
 *
 * 소개·목차·쪽수는 서버에 없다(Phase 6.5). 표지·제목·저자·출판사뿐이라 화면도 그만큼만 잡는다 —
 * 없는 것을 위해 자리를 비워 두면 비어 보이기만 한다.
 */
export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me } = useSession();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shelving, setShelving] = useState(false);
  /**
   * 이 책에 대한 내 기록. 담기 버튼을 그리기 전에 묻는다.
   *
   * null은 아직 모름, "none"은 담은 적 없음(R001)이다. 기록이 있으면 inBookshelf로
   * "지금 서재에 있음"과 "전에 읽다 뺐음"이 갈린다.
   */
  const [mine, setMine] = useState<Reading | "none" | null>(null);
  const [asking, setAsking] = useState(false);
  const [shelfError, setShelfError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api<Reading>(`/api/v1/books/${id}/reading`)
      .then(reading => { if (active) setMine(reading); })
      // 담은 적 없는 책이다. 실패가 아니라 "아직 없음"이라는 답이다.
      .catch(() => { if (active) setMine("none"); });
    void api<Book>(`/api/v1/books/${id}`)
      .then(found => { if (active) setBook(found); })
      .catch(e => { if (active) setError(e instanceof ApiError && e.code === "B001" ? "없는 책이에요." : "책을 불러오지 못했어요."); });
    return () => { active = false; };
  }, [id]);

  /**
   * 담는다. resume은 전에 읽던 기록이 있을 때만 쓰인다 — 처음 담는 책에는 보내지 않는다.
   *
   * R003은 "물어보고 다시 오라"는 뜻이다. 미리 물어보고 왔더라도 그 사이에 상태가 바뀔 수
   * 있으니(다른 기기에서 뺐거나 담았거나) 여기서도 받아서 시트를 연다.
   */
  async function shelve(resume?: boolean) {
    if (!book) return;
    setShelving(true); setShelfError(null);
    try {
      const created = await api<Reading>("/api/v1/readings", {
        method: "POST",
        body: { bookId: book.id, status: "WANT_TO_READ", ...(resume === undefined ? {} : { resume }) },
      });
      setMine(created); setAsking(false);
    } catch (e) {
      if (e instanceof ApiError && e.code === "R002") {
        // 이미 담긴 책은 실패가 아니다. 원하던 상태에 이미 도달해 있다.
        setMine(prev => (prev && prev !== "none" ? { ...prev, inBookshelf: true } : prev));
        setAsking(false);
      } else if (e instanceof ApiError && e.code === "R003") {
        setAsking(true);
      } else {
        setShelfError("서재에 담지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    } finally { setShelving(false); }
  }

  if (error) return <div className="content-columns"><Empty title={error} action={<LinkButton href="/search">책 찾기</LinkButton>} /></div>;
  if (!book) return <Spinner />;

  const published = book.publishedAt?.slice(0, 4);
  const past = mine && mine !== "none" ? mine : null;
  const shelved = past?.inBookshelf === true;
  const previouslyRead = past !== null && !past.inBookshelf;

  return <>
    <div className="content-columns">
      <header className="flex gap-5">
        <Cover src={book.thumbnailUrl} title={book.title} className="w-[104px] shrink-0" priority />
        <div className="min-w-0 flex-1">
          <h1 className="text-title leading-snug">{book.title}</h1>
          <p className="mt-2 text-callout text-muted">{book.authors}</p>
          <p className="mt-0.5 text-foot text-faint">{[book.publisher, published].filter(Boolean).join(" · ")}</p>
          {/*
            버튼이 세 갈래다 — 담김 / 다시 담기 / 담기. 무엇을 누르는지 미리 알려주는 것이
            핵심이라, 기록을 물어보기 전에는 아무것도 그리지 않는다.
          */}
          {me && mine !== null && <div className="mt-4">
            <Button variant="quiet" disabled={shelving || shelved}
              onClick={() => void (previouslyRead ? setAsking(true) : shelve())} className="gap-1.5">
              <Icon name={shelved ? "check" : "plus"} className="h-3.5 w-3.5" />
              {shelved ? "서재에 있음" : shelving ? "담는 중" : previouslyRead ? "다시 담기" : "서재에 담기"}
            </Button>
          </div>}
          {shelfError && <p className="mt-2 text-foot text-danger">{shelfError}</p>}
        </div>
      </header>

      {/*
        감상평을 쓰면 서버가 이 책을 "읽는 중"으로 서재에 자동으로 담는다. 그래서 여기서는
        담기를 먼저 요구하지 않는다 — 쓰려는 사람을 한 걸음 더 걷게 할 이유가 없다.
      */}
      {me && <PostComposer book={book} currentPage={0} />}

      <div className="mt-10">
        <div className="section-heading"><h2>이 책의 감상평</h2></div>
        {me
          ? <Feed key={`book:${id}`} path={`/api/v1/books/${id}/posts`} empty={
              <Empty title="아직 남겨진 감상평이 없어요" hint="이 책에 대한 첫 기록을 남겨 보세요." />} />
          : <Empty title="로그인하면 볼 수 있어요" action={<LinkButton href="/login">로그인</LinkButton>} />}
      </div>

      {asking && past && <ResumeSheet past={past} title={book.title} busy={shelving}
        onPick={resume => void shelve(resume)} onClose={() => setAsking(false)} />}

      <p className="mt-8 text-center text-foot">
        <Link href="/search" className="text-muted hover:text-accent">다른 책 찾아보기</Link>
      </p>
    </div>
  </>;
}
