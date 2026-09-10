"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CursorPage, Post } from "@/lib/types";
import { Button, Empty, Spinner } from "./ui";
import PostCard from "./PostCard";

/**
 * 감상평이 흐르는 목록. 팔로잉 타임라인과 탐색 피드가 같은 것을 쓴다 —
 * 서버가 두 곳 모두 CursorPage<PostResponse>로 내려주므로 화면이 나뉠 이유가 없다.
 *
 * 커서는 서버가 준 nextCursor를 그대로 돌려보낸다. 마지막 글의 id를 화면에서 골라 보내면
 * 서버가 정렬을 바꾸는 순간 조용히 어긋난다.
 */
export default function Feed({ path, empty }: { path: string; empty: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState(false);

  /* path는 쓰는 곳마다 고정이라 여기서 상태를 되돌리지 않는다. 바뀔 일이 생기면
     부르는 쪽이 key={path}로 새로 세운다 — 검색 화면이 검색어에 쓰는 방식과 같다. */
  useEffect(() => {
    let active = true;
    void api<CursorPage<Post>>(`${path}?size=20`)
      .then(page => { if (!active) return; setPosts(page.items); setCursor(page.nextCursor); setHasNext(page.hasNext); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [path]);

  async function loadMore() {
    setMoreBusy(true);
    try {
      const page = await api<CursorPage<Post>>(`${path}?size=20&cursor=${cursor}`);
      setPosts(prev => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor); setHasNext(page.hasNext);
    } catch { setError(true); }
    finally { setMoreBusy(false); }
  }

  if (error) return <Empty title="감상평을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />;
  if (posts === null) return <Spinner />;
  if (posts.length === 0) return <>{empty}</>;

  return <>
    <div>{posts.map(post => <PostCard key={post.id} post={post} />)}</div>
    {hasNext && <div className="mt-8 text-center">
      <Button variant="quiet" onClick={() => void loadMore()} disabled={moreBusy}>{moreBusy ? "불러오는 중" : "더 보기"}</Button>
    </div>}
  </>;
}
