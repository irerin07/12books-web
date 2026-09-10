"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, FollowItem } from "@/lib/types";
import { Button, Empty, Spinner } from "./ui";
import FollowButton from "./FollowButton";

/**
 * 팔로워·팔로잉 목록. 두 화면이 같은 것을 쓴다 — 서버가 둘 다 CursorPage<FollowItemResponse>로
 * 내려주고, 다른 것은 제목과 경로뿐이다.
 *
 * 각 줄의 isFollowing은 목록 주인이 아니라 보는 사람 기준이다. 남의 팔로워 목록을 볼 때도
 * 버튼은 "내가 이 사람을 팔로우 중인가"를 따른다.
 */
export default function FollowList({ handle, kind }: { handle: string; kind: "followers" | "followings" }) {
  const { me } = useSession();
  const [items, setItems] = useState<FollowItem[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [moreBusy, setMoreBusy] = useState(false);
  const [error, setError] = useState(false);
  const path = `/api/v1/users/${handle}/${kind}`;

  useEffect(() => {
    let active = true;
    void api<CursorPage<FollowItem>>(`${path}?size=20`)
      .then(page => { if (!active) return; setItems(page.items); setCursor(page.nextCursor); setHasNext(page.hasNext); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [path]);

  async function loadMore() {
    setMoreBusy(true);
    try {
      const page = await api<CursorPage<FollowItem>>(`${path}?size=20&cursor=${cursor}`);
      setItems(prev => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor); setHasNext(page.hasNext);
    } catch { setError(true); }
    finally { setMoreBusy(false); }
  }

  /** 버튼이 눌린 줄만 갈아 끼운다. 목록을 다시 불러오면 보던 자리가 사라진다. */
  function mark(target: string, nowFollowing: boolean) {
    setItems(prev => prev?.map(item => item.handle === target ? { ...item, isFollowing: nowFollowing } : item) ?? prev);
  }

  if (error) return <Empty title="목록을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />;
  if (items === null) return <Spinner />;
  if (items.length === 0) {
    return <Empty title={kind === "followers" ? "아직 팔로워가 없어요" : "아직 팔로우한 사람이 없어요"}
      hint={kind === "followers" ? "감상평을 남기면 같은 책을 읽은 사람이 찾아옵니다." : "감상평이 마음에 드는 사람을 팔로우해 보세요."} />;
  }

  return <>
    <ul>{items.map(person => <li key={person.handle} className="follow-row">
      <Link href={`/u/${person.handle}`} className="avatar">
        {person.avatarUrl
          // 아바타는 어떤 주소든 올 수 있어 next/image의 허용 목록에 기대지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={person.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          : person.displayName.slice(0, 1)}
      </Link>
      <Link href={`/u/${person.handle}`} className="min-w-0 flex-1">
        <p className="truncate text-foot font-semibold">{person.displayName}</p>
        <p className="truncate text-cap text-faint">@{person.handle}</p>
      </Link>
      {/* 나 자신에게는 버튼을 놓지 않는다 — 서버가 F001로 막는 동작이다. */}
      {me && me.handle !== person.handle &&
        <FollowButton handle={person.handle} following={person.isFollowing}
          onChanged={now => mark(person.handle, now)} />}
    </li>)}</ul>
    {hasNext && <div className="mt-8 text-center">
      <Button variant="quiet" onClick={() => void loadMore()} disabled={moreBusy}>{moreBusy ? "불러오는 중" : "더 보기"}</Button>
    </div>}
  </>;
}
