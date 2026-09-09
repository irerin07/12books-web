"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem, Profile } from "@/lib/types";
import LibraryGrid from "@/components/LibraryGrid";
import ReadingSheet from "@/components/ReadingSheet";
import { Button, Empty, Spinner } from "@/components/ui";

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
  const finished = items.filter((i) => i.reading.status === "FINISHED").length;
  const reading = items.filter((i) => i.reading.status === "READING").length;

  return (
    <div>
      <header className="flex items-center gap-6 py-4 sm:gap-10 sm:py-8">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-black/5 sm:h-32 sm:w-32 dark:bg-white/10">
          {profile.avatarUrl ? (
            // 아바타는 어떤 주소든 올 수 있어 next/image의 허용 목록에 기대지 않는다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <h1 className="truncate text-lg">{profile.handle}</h1>
            {isMine ? (
              <Button variant="quiet" onClick={() => void logout()}>
                로그아웃
              </Button>
            ) : null}
          </div>

          <dl className="mt-4 flex gap-6 text-sm">
            <div className="flex gap-1">
              <dt className="text-muted">담은 책</dt>
              <dd className="font-semibold">{items.length}{hasNext ? "+" : ""}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-muted">완독</dt>
              <dd className="font-semibold">{finished}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-muted">읽는 중</dt>
              <dd className="font-semibold">{reading}</dd>
            </div>
          </dl>

          <p className="mt-3 text-sm font-semibold">{profile.displayName}</p>
          {profile.bio ? <p className="text-sm whitespace-pre-line">{profile.bio}</p> : null}
        </div>
      </header>

      <div className="border-t border-line pt-4">
        {items.length === 0 && !busy ? (
          <Empty title="아직 서재가 비어 있습니다" />
        ) : (
          <LibraryGrid items={items} onSelect={isMine ? setSelected : () => {}} />
        )}
      </div>

      {busy ? <Spinner /> : null}

      {hasNext && !busy ? (
        <div className="flex justify-center py-6">
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
