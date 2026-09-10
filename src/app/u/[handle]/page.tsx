"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem, Profile } from "@/lib/types";
import LibraryGrid from "@/components/LibraryGrid";
import ReadingSheet from "@/components/ReadingSheet";
import { Button, Empty, Spinner } from "@/components/ui";
import FollowButton from "@/components/FollowButton";

/**
 * 프로필. 인스타의 프로필과 같은 골격이다 — 아바타, 숫자 몇 개, 소개, 그리고 격자.
 * 다만 여기 걸리는 것은 사진이 아니라 표지이고, 숫자는 팔로워가 아니라 읽은 권수다.
 */
export default function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const { me, logout } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  const fetchPage = useCallback(
    async (next: number | null) => {
      const params = new URLSearchParams({ size: "24" });
      if (next !== null) params.set("cursor", String(next));
      return api<CursorPage<LibraryItem>>(`/api/v1/users/${handle}/library?${params}`);
    },
    [handle],
  );

  /** handle이 바뀌면 프로필과 첫 장을 처음부터 다시 읽는다. */
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [who, page] = await Promise.all([
          api<Profile>(`/api/v1/users/${handle}`),
          fetchPage(null),
        ]);
        if (cancelled) return;
        setProfile(who);
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasNext(page.hasNext);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof ApiError && e.status === 404
            ? "없는 사용자입니다."
            : "프로필을 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, fetchPage]);

  async function loadMore() {
    setBusy(true);
    const page = await fetchPage(cursor);
    setItems((prev) => [...prev, ...page.items]);
    setCursor(page.nextCursor);
    setHasNext(page.hasNext);
    setBusy(false);
  }

  if (error) return <Empty title={error} />;
  if (!profile) return <Spinner />;

  const isMine = me?.handle === profile.handle;



  return (
    <div>
      {/* 인스타의 프로필 골격 — 아바타, 숫자 줄, 소개, 격자. 다만 담기는 것은 표지다. */}
      <header className="panel flex items-center gap-5 p-6 sm:p-8">
        <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full bg-fill shadow-card ring-1 ring-line sm:h-[88px] sm:w-[88px]">
          {profile.avatarUrl ? (
            // 아바타는 어떤 주소든 올 수 있어 next/image의 허용 목록에 기대지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-title text-faint">
              {profile.displayName.slice(0, 1)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title">
            {profile.displayName}
          </h1>
          <p className="mt-1 truncate text-callout text-muted">@{profile.handle}</p>
          {profile.bio ? (
            <p className="mt-3 text-body whitespace-pre-line">{profile.bio}</p>
          ) : null}
          {/*
            숫자 줄. 팔로워·팔로잉은 눌러서 목록으로 갈 수 있고, 서재 권수는 갈 곳이 없어
            글자로만 둔다 — 누를 수 없는 것을 링크처럼 보이게 하지 않는다.
          */}
          <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-foot">
            <Link href={`/u/${profile.handle}/followers`} className="hover:text-accent">
              <dt className="inline text-muted">팔로워 </dt>
              <dd className="inline font-semibold tabular-nums">{profile.followerCount}</dd>
            </Link>
            <Link href={`/u/${profile.handle}/followings`} className="hover:text-accent">
              <dt className="inline text-muted">팔로잉 </dt>
              <dd className="inline font-semibold tabular-nums">{profile.followingCount}</dd>
            </Link>
          </dl>

          <div className="mt-5 flex gap-2">
            {isMine ? (
              <Button variant="quiet" onClick={() => void logout()}>
                로그아웃
              </Button>
            ) : me ? (
              /* 팔로워 수는 버튼을 누른 그 자리에서 함께 움직인다. 다시 불러오지 않는다. */
              <FollowButton
                handle={profile.handle}
                following={profile.isFollowing}
                onChanged={(now) =>
                  setProfile((prev) =>
                    prev
                      ? { ...prev, isFollowing: now, followerCount: prev.followerCount + (now ? 1 : -1) }
                      : prev,
                  )
                }
              />
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-8"><div className="section-heading"><h2>서재</h2><span className="text-cap text-muted">{items.length}{hasNext ? "+" : ""}권</span></div>
        {items.length === 0 && !busy ? (
          <Empty title="아직 서재가 비어 있습니다" />
        ) : (
          <LibraryGrid items={items} onSelect={isMine ? setSelected : undefined} />
        )}
      </div>

      {busy ? <Spinner /> : null}

      {hasNext && !busy ? (
        <div className="flex justify-center py-8">
          <Button variant="quiet" onClick={() => void loadMore()}>
            더 보기
          </Button>
        </div>
      ) : null}

      {selected ? (
        <ReadingSheet
          item={selected}
          onClose={() => setSelected(null)}
          onChanged={(reading) => {
            setItems((prev) =>
              prev.map((it) => (it.reading.id === reading.id ? { ...it, reading } : it)),
            );
            setSelected((prev) => (prev ? { ...prev, reading } : prev));
          }}
          onRemoved={(id) => {
            setItems((prev) => prev.filter((it) => it.reading.id !== id));
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
