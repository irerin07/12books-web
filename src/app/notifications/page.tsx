"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { AppNotification, CursorPage } from "@/lib/types";
import { refreshUnread, setUnread, useUnread } from "@/lib/unread";
import { Button, Empty, LinkButton, PageTitle, Spinner } from "@/components/ui";

function since(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/** 무슨 일이 있었는지. 서버는 type만 주고 문구는 화면이 정한다. */
const SAID: Record<AppNotification["type"], string> = {
  POST_LIKED: "님이 내 감상평을 좋아해요",
  POST_COMMENTED: "님이 내 감상평에 댓글을 남겼어요",
  FOLLOWED: "님이 나를 팔로우해요",
};

/**
 * 알림.
 *
 * 읽어도 목록에서 사라지지 않는다 — 서버가 read만 true로 바꾼다. "방금 뭐였지"를 다시 볼 수
 * 있어야 해서다. 그래서 이 화면은 읽은 것과 안 읽은 것을 지우는 대신 구분해 보여준다.
 *
 * 반응 직후에는 알림이 아직 없을 수 있다. 서버가 좋아요·댓글 처리와 알림 저장을 떼어 놨기
 * 때문이고, 그 대신 반응 자체는 느려지지 않는다. 화면이 할 일은 조금 뒤에 다시 부르는 것뿐이다.
 */
export default function NotificationsPage() {
  const { me } = useSession();
  const unread = useUnread();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [allBusy, setAllBusy] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const loading = useRef(false);

  useEffect(() => {
    if (!me) return;
    let active = true;
    void api<CursorPage<AppNotification>>("/api/v1/notifications?size=20")
      .then(page => { if (!active) return; setItems(page.items); setCursor(page.nextCursor); setHasNext(page.hasNext); })
      .catch(() => { if (active) setError(true); });
    void refreshUnread();
    return () => { active = false; };
  }, [me]);

  const loadMore = useCallback(async () => {
    if (loading.current || !hasNext || cursor === null) return;
    loading.current = true; setMoreError(false);
    try {
      const page = await api<CursorPage<AppNotification>>(`/api/v1/notifications?size=20&cursor=${cursor}`);
      setItems(prev => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor); setHasNext(page.hasNext);
    } catch { setMoreError(true); }
    finally { loading.current = false; }
  }, [cursor, hasNext]);

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

  /*
   * 읽음은 낙관적으로 먼저 칠한다. 누르면 곧바로 다른 화면으로 떠나기 때문에 응답을 기다릴
   * 자리가 없다. N001은 없거나 남의 알림이라는 뜻이라 되돌릴 것도 없다.
   */
  function markRead(item: AppNotification) {
    if (item.read) return;
    setItems(prev => prev?.map(n => (n.id === item.id ? { ...n, read: true } : n)) ?? prev);
    setUnread(unread - 1);
    void api<void>(`/api/v1/notifications/${item.id}/read`, { method: "PATCH" })
      .catch(e => { if (!(e instanceof ApiError && e.code === "N001")) void refreshUnread(); });
  }

  async function readAll() {
    setAllBusy(true);
    try {
      await api<void>("/api/v1/notifications/read-all", { method: "POST" });
      setItems(prev => prev?.map(n => ({ ...n, read: true })) ?? prev);
      setUnread(0);
    } catch { void refreshUnread(); }
    finally { setAllBusy(false); }
  }

  if (!me) return <Empty title="로그인하면 볼 수 있어요" hint="알림은 로그인한 뒤에 확인할 수 있습니다."
    action={<LinkButton href="/login">로그인</LinkButton>} />;

  return <>
    <PageTitle aside={items?.some(n => !n.read)
      ? <Button variant="quiet" disabled={allBusy} onClick={() => void readAll()}>
          {allBusy ? "읽는 중…" : "모두 읽음"}
        </Button>
      : undefined}>알림</PageTitle>

    {error ? <Empty title="알림을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />
      : items === null ? <Spinner />
      : items.length === 0 ? <Empty title="아직 알림이 없어요"
          hint="누군가 내 감상평에 좋아요나 댓글을 남기면, 또 나를 팔로우하면 여기에 모여요." />
      : <ul className="notice-list">{items.map(item => {
          /*
            글이 지워졌거나 팔로우 알림이면 갈 곳이 글이 아니다. 없는 데를 가리키는 줄을
            누를 수 있게 두면 404로 데려간다.
          */
          const href = item.type === "FOLLOWED" ? `/u/${item.actor.handle}`
            : item.post ? `/posts/${item.post.id}` : null;
          const body = <>
            <span className="avatar" aria-hidden="true">
              {item.actor.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={item.actor.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                : item.actor.displayName.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="notice-said">
                <b>{item.actor.displayName}</b>{SAID[item.type]}
                <time dateTime={item.createdAt} className="notice-time"> · {since(item.createdAt)}</time>
              </span>
              {item.type !== "FOLLOWED" && <span className="notice-quote">
                {item.post ? item.post.content : "지워진 감상평이에요"}
              </span>}
            </span>
            {!item.read && <span className="notice-dot" aria-label="안 읽음" />}
          </>;

          return <li key={item.id} className="notice-row" data-unread={!item.read}>
            {href
              ? <Link href={href} onClick={() => markRead(item)} className="notice-hit">{body}</Link>
              : <button type="button" onClick={() => markRead(item)} className="notice-hit">{body}</button>}
          </li>;
        })}</ul>}

    {hasNext && <div ref={sentinel} className="pt-4">
      {moreError
        ? <div className="py-8 text-center">
            <p className="text-foot text-muted">다음 알림을 불러오지 못했어요.</p>
            <Button variant="quiet" className="mt-3" onClick={() => void loadMore()}>다시 시도</Button>
          </div>
        : <Spinner />}
    </div>}
  </>;
}
