"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem, ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABEL } from "@/lib/types";
import LibraryGrid from "@/components/LibraryGrid";
import ReadingSheet from "@/components/ReadingSheet";
import { Button, Empty, SignInWall, Spinner } from "@/components/ui";

const FILTERS: { value: ReadingStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "READING", label: READING_STATUS_LABEL.READING },
  { value: "WANT_TO_READ", label: READING_STATUS_LABEL.WANT_TO_READ },
  { value: "FINISHED", label: READING_STATUS_LABEL.FINISHED },
  { value: "PAUSED", label: READING_STATUS_LABEL.PAUSED },
  { value: "DROPPED", label: READING_STATUS_LABEL.DROPPED },
];

export default function LibraryPage() {
  const { me, loading } = useSession();
  const [status, setStatus] = useState<ReadingStatus | "">("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState<LibraryItem | null>(null);

  /** 상태만 바꾸지 않는 순수 조회. 효과와 버튼이 함께 쓴다. */
  const fetchPage = useCallback(
    async (next: number | null) => {
      const params = new URLSearchParams({ size: "24" });
      if (status) params.set("status", status);
      if (next !== null) params.set("cursor", String(next));
      return api<CursorPage<LibraryItem>>(`/api/v1/users/${me!.handle}/library?${params}`);
    },
    [me, status],
  );

  /**
   * 첫 장을 읽는다. 필터를 빠르게 바꾸면 이전 요청이 늦게 도착해 새 결과를 덮을 수 있어
   * 취소 표시를 둔다 — 늦게 온 응답은 버린다.
   */
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    void (async () => {
      const page = await fetchPage(null);
      if (cancelled) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setHasNext(page.hasNext);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [me, fetchPage]);

  async function loadMore() {
    setBusy(true);
    const page = await fetchPage(cursor);
    setItems((prev) => [...prev, ...page.items]);
    setCursor(page.nextCursor);
    setHasNext(page.hasNext);
    setBusy(false);
  }

  if (loading) return null;
  if (!me) return <SignInWall />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">내 서재</h1>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${
              status === f.value
                ? "border-ink bg-ink text-canvas"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 && !busy ? (
        <Empty
          title="아직 담은 책이 없습니다"
          hint="검색에서 책을 찾아 서재에 담아 보세요."
          action={
            <Link href="/search" className="text-sm font-semibold text-accent">
              책 찾으러 가기
            </Link>
          }
        />
      ) : (
        <LibraryGrid items={items} onSelect={setSelected} />
      )}

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

      {busy ? <Spinner /> : null}

      {hasNext && !busy ? (
        <div className="flex justify-center py-6">
          <Button variant="quiet" onClick={() => void loadMore()}>
            더 보기
          </Button>
        </div>
      ) : null}
    </div>
  );
}
