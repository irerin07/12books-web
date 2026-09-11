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
import Feed from "@/components/Feed";
import ProfileEditSheet from "@/components/ProfileEditSheet";
import { LinkButton } from "@/components/ui";

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
  /*
   * 서재와 감상평을 한 화면에 쌓지 않고 나눈다. 둘 다 길어지는 목록이라 이어 붙이면
   * 아래쪽은 아무도 닿지 않는다. 인스타 프로필의 격자 전환과 같은 자리다.
   */
  const [tab, setTab] = useState<"library" | "posts">("library");
  const [editing, setEditing] = useState(false);

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
      <header className="profile-heading">
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

          <div className="mt-5 flex flex-wrap gap-2">
            {isMine ? (
              <>
                <Button variant="quiet" onClick={() => setEditing(true)}>
                  프로필 수정
                </Button>
                <Button variant="quiet" onClick={() => void logout()}>
                  로그아웃
                </Button>
              </>
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

      <div className="mt-8 overflow-x-auto"><div className="segmented min-w-max">
        {([["library", "서재"], ["posts", "감상평"]] as const).map(([value, label]) => (
          <button key={value} data-on={tab === value} aria-pressed={tab === value}
            onClick={() => setTab(value)} className="segmented-item shrink-0 text-callout font-medium">
            {label}
          </button>
        ))}
      </div></div>

      {tab === "library" ? (
        <div className="mt-6"><div className="section-heading"><h2>서재</h2><span className="text-cap text-muted">{items.length}{hasNext ? "+" : ""}권</span></div>
          {items.length === 0 && !busy ? (
            <Empty title={isMine ? "아직 서재가 비어 있어요" : "아직 담은 책이 없어요"} hint={isMine ? "검색에서 책을 찾아 담아 보세요." : undefined} action={isMine ? <LinkButton href="/search">책 찾기</LinkButton> : undefined} />
          ) : (
            <LibraryGrid items={items} onSelect={isMine ? setSelected : undefined} />
          )}

          {busy ? <Spinner /> : null}

          {hasNext && !busy ? (
            <div className="flex justify-center py-8">
              <Button variant="quiet" onClick={() => void loadMore()}>
                더 보기
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        /*
          이 목록에는 followingAuthor가 실리지 않는다. 서버가 사람별 목록에서는 그 관계를
          계산하지 않기 때문이고, PostCard도 값이 없으면 "추천"을 붙이지 않는다.

          내 프로필에서 부르면 "내 글만 보기"가 된다 — 홈과 팔로잉이 본인 글을 빼므로
          지금은 내가 쓴 것을 볼 수 있는 유일한 자리다.
        */
        <div className="mt-6">
          <Feed key={`posts:${handle}`} path={`/api/v1/users/${handle}/posts`} empty={
            <Empty title="아직 남긴 감상평이 없어요"
              hint={isMine ? "읽던 책의 시트에서 지금 생각을 남겨 보세요." : "이 사람이 감상평을 남기면 여기에 쌓입니다."}
              action={isMine ? <LinkButton href="/library">기록 남기기</LinkButton> : undefined} />
          } />
        </div>
      )}

      {editing && profile ? (
        <ProfileEditSheet
          profile={profile}
          onClose={() => setEditing(false)}
          /* 저장한 값이 곧 화면이다. 다시 불러오면 서재 격자까지 처음부터 그려진다. */
          onSaved={(updated) => setProfile(updated)}
        />
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
