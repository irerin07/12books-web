"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
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
  /*
   * 첫 장이 실패한 것과 다음 장이 실패한 것을 나눈다. 하나로 묶어 두면 스크롤 중 한 번의
   * 실패가 읽고 있던 목록을 통째로 지운다 — 버튼을 누를 때는 드물었지만, 저절로 부르게 되면
   * 흔한 일이 된다.
   */
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  /** 목록 끝의 감시점. 여기가 보이면 다음 장을 부른다. */
  const sentinel = useRef<HTMLDivElement | null>(null);
  /** 상태가 아니라 ref다. 화면을 다시 그리기 전에도 두 번째 호출을 막아야 한다. */
  const loading = useRef(false);
  const [relationships, setRelationships] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [followErrors, setFollowErrors] = useState<Record<string, string>>({});
  const inFlight = useRef(new Set<string>());

  async function follow(handle: string) {
    if (inFlight.current.has(handle)) return;
    inFlight.current.add(handle);
    setPending(prev => ({ ...prev, [handle]: true }));
    setFollowErrors(prev => ({ ...prev, [handle]: "" }));
    try {
      await api<void>(`/api/v1/users/${encodeURIComponent(handle)}/follow`, { method: "POST" });
      setRelationships(prev => ({ ...prev, [handle]: true }));
    } catch (e) {
      if (e instanceof ApiError && e.code === "F002") {
        setRelationships(prev => ({ ...prev, [handle]: true }));
      } else {
        setFollowErrors(prev => ({ ...prev, [handle]: "팔로우하지 못했어요. 다시 시도해 주세요." }));
      }
    } finally {
      inFlight.current.delete(handle);
      setPending(prev => ({ ...prev, [handle]: false }));
    }
  }

  /* path는 쓰는 곳마다 고정이라 여기서 상태를 되돌리지 않는다. 바뀔 일이 생기면
     부르는 쪽이 key={path}로 새로 세운다 — 검색 화면이 검색어에 쓰는 방식과 같다. */
  useEffect(() => {
    let active = true;
    void api<CursorPage<Post>>(`${path}?size=20`)
      .then(page => { if (!active) return; setPosts(page.items); setCursor(page.nextCursor); setHasNext(page.hasNext); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [path]);

  const loadMore = useCallback(async () => {
    if (loading.current || !hasNext || cursor === null) return;
    loading.current = true;
    setMoreBusy(true); setMoreError(false);
    try {
      const page = await api<CursorPage<Post>>(`${path}?size=20&cursor=${cursor}`);
      setPosts(prev => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor); setHasNext(page.hasNext);
    } catch { setMoreError(true); }
    finally { loading.current = false; setMoreBusy(false); }
  }, [path, cursor, hasNext]);

  /*
   * 바닥에 닿기 전에 미리 부른다(600px). 닿고 나서 부르면 기다리는 시간이 그대로 보여서,
   * 스크롤이 멈췄다가 이어지는 것처럼 느껴진다.
   *
   * 실패했을 때는 감시를 걸지 않는다. 그대로 두면 화면에 머무는 동안 같은 요청을 끝없이
   * 되풀이한다 — 그때는 사람이 다시 시도를 누르게 한다.
   */
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNext || moreError) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) void loadMore(); },
      { rootMargin: "600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasNext, moreError]);

  if (error) return <Empty title="감상평을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />;
  if (posts === null) return <Spinner />;
  if (posts.length === 0) return <>{empty}</>;

  return <>
    <div>{posts.map(post => <PostCard key={post.id} post={post}
      following={relationships[post.author.handle] ?? post.followingAuthor ?? (path === "/api/v1/feed/following" ? true : undefined)}
      followBusy={pending[post.author.handle] ?? false}
      followError={followErrors[post.author.handle]}
      onFollow={() => void follow(post.author.handle)} />)}</div>
    {hasNext && <div ref={sentinel} className="pt-4">
      {moreError
        ? <div className="py-8 text-center">
            <p className="text-foot text-muted">다음 글을 불러오지 못했어요.</p>
            <Button variant="quiet" className="mt-3" onClick={() => void loadMore()} disabled={moreBusy}>다시 시도</Button>
          </div>
        : <Spinner />}
    </div>}
  </>;
}
