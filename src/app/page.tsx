"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem } from "@/lib/types";
import { Cover, Empty, SignInWall, Spinner } from "@/components/ui";

/**
 * 홈. 인스타라면 팔로우 피드가 오는 자리인데 아직 서버에 글도 팔로우도 없다.
 * 그때까지는 "지금 읽고 있는 책"과 "올해 얼마나 왔나"를 둔다 — 열자마자 이어 읽을 수
 * 있는 것이 혼자 쓰는 단계에서 가장 쓸모 있다.
 */
export default function HomePage() {
  const { me, loading } = useSession();
  const [reading, setReading] = useState<LibraryItem[]>([]);
  const [finishedThisYear, setFinishedThisYear] = useState<LibraryItem[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    void (async () => {
      const year = new Date().getFullYear();
      const [current, finished] = await Promise.all([
        api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=READING&size=12`),
        api<CursorPage<LibraryItem>>(
          `/api/v1/users/${me.handle}/library?status=FINISHED&finishedYear=${year}&size=12`,
        ),
      ]);
      if (cancelled) return;
      setReading(current.items);
      setFinishedThisYear(finished.items);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  if (loading) return null;
  if (!me) return <SignInWall />;
  if (busy) return <Spinner />;

  const year = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {finishedThisYear.length > 0 ? (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">{year}년에 읽은 책</h2>
            <Link href="/library" className="text-xs text-accent">
              서재 전체
            </Link>
          </div>
          <ul className="flex gap-2 overflow-x-auto pb-2">
            {finishedThisYear.map(({ reading: r, book }) => (
              <li key={r.id} className="w-20 shrink-0">
                <Cover src={book.thumbnailUrl} title={book.title} className="rounded-md" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold">읽는 중</h2>
          <Link href="/library" className="text-xs text-accent">
            서재 전체
          </Link>
        </div>

        {reading.length === 0 ? (
          <Empty
            title="지금 읽는 책이 없습니다"
            hint="서재에서 책을 골라 '읽는 중'으로 바꿔 보세요."
            action={
              <Link href="/search" className="text-sm font-semibold text-accent">
                책 찾으러 가기
              </Link>
            }
          />
        ) : (
          <ul className="flex gap-3 overflow-x-auto pb-2">
            {reading.map(({ reading: r, book }) => {
              const ratio =
                r.pageCount && r.pageCount > 0 ? Math.min(1, r.currentPage / r.pageCount) : null;
              return (
                <li key={r.id} className="w-28 shrink-0">
                  <Link href="/library">
                    <div className="relative">
                      <Cover src={book.thumbnailUrl} title={book.title} className="rounded-md" />
                      {ratio !== null ? (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
                          <div className="h-full bg-white/90" style={{ width: `${ratio * 100}%` }} />
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs">{book.title}</p>
                    <p className="text-[11px] text-muted">
                      {r.pageCount ? `${r.currentPage} / ${r.pageCount}쪽` : `${r.currentPage}쪽`}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
