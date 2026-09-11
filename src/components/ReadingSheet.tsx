"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { LibraryItem, Reading, ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABEL } from "@/lib/types";
import Link from "next/link";
import { Button, Cover } from "./ui";
import PostComposer from "./PostComposer";

const STATUSES: ReadingStatus[] = [
  "WANT_TO_READ",
  "READING",
  "FINISHED",
  "PAUSED",
  "DROPPED",
];

/**
 * 표지를 눌렀을 때 아래에서 올라오는 편집 시트.
 *
 * 별도 상세 페이지 대신 시트로 둔 것은 서버에 `GET /readings/{id}`가 없어서이기도 하지만,
 * 진도 갱신이 "책을 덮으며 몇 쪽인지 적는" 짧은 동작이라 화면을 옮길 일이 아니어서다.
 *
 * 모바일에서는 손잡이(grabber)가 달린 iOS 시트로, 데스크톱에서는 가운데 뜨는 카드로 선다.
 */
export default function ReadingSheet({
  item,
  onClose,
  onChanged,
  onRemoved,
}: {
  item: LibraryItem;
  onClose: () => void;
  onChanged: (reading: Reading) => void;
  onRemoved: (id: number) => void;
}) {
  const { reading, book } = item;
  const [currentPage, setCurrentPage] = useState(String(reading.currentPage));
  const [pageCount, setPageCount] = useState(reading.pageCount?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [onClose]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      onChanged(
        await api<Reading>(`/api/v1/readings/${reading.id}`, { method: "PATCH", body }),
      );
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "C001"
          ? "쪽수를 다시 확인해 주세요. 현재 쪽수는 총 쪽수를 넘을 수 없습니다."
          : "저장하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api<void>(`/api/v1/readings/${reading.id}`, { method: "DELETE" });
      onRemoved(reading.id);
    } catch {
      setError("서재에서 빼지 못했습니다.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_0.25s_ease] bg-black/40 backdrop-blur-[2px]"
      />

      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative max-h-[92dvh] w-full animate-[sheet-in_0.4s_var(--ease-spring)] overflow-y-auto rounded-t-xl bg-surface pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet outline-none sm:max-w-[440px] sm:rounded-xl sm:pb-6">
        {/* 손잡이. 끌어내릴 수 있다는 신호는 이것 하나면 충분하다. */}
        <div className="sticky top-0 z-10 flex justify-center bg-surface pb-1 pt-2.5 sm:hidden">
          <span className="h-[5px] w-9 rounded-full bg-fill-strong" />
        </div>

        <div className="px-5 pt-3 sm:pt-6">
          <div className="flex gap-4">
            <Cover src={book.thumbnailUrl} title={book.title} className="w-[78px] shrink-0" />
            <div className="min-w-0 pt-0.5">
              <h2 id={titleId} className="text-headline">
                {/* 같은 책을 읽은 사람들이 무엇을 남겼는지로 건너가는 길 */}
                <Link href={`/books/${book.id}`} className="hover:text-accent">{book.title}</Link>
              </h2>
              <p className="mt-1.5 text-callout text-muted">{book.authors}</p>
              {book.publisher ? (
                <p className="text-foot text-faint">{book.publisher}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2.5 ml-0.5 text-foot font-medium text-muted">지금 이 책은</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const on = reading.status === s;
                return (
                  <button
                    key={s}
                    disabled={busy}
                    aria-pressed={on}
                    onClick={() => void patch({ status: s })}
                    className={`press rounded-md border border-line px-3.5 py-2 text-callout disabled:opacity-50 ${
                      on
                        ? "bg-ink font-medium text-white"
                        : "bg-fill text-muted hover:text-ink"
                    }`}
                  >
                    {READING_STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 진도. iOS 설정 화면처럼 한 덩어리 안에 줄로 나눠 담는다. */}
          <div className="group-box mt-6">
            <label className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="text-body">현재 쪽</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={currentPage}
                onChange={(e) => setCurrentPage(e.target.value)}
                className="w-24 bg-transparent text-right text-body tabular-nums outline-none"
              />
            </label>
            <label className="flex items-center justify-between gap-4 px-4 py-3.5">
              <span className="text-body">총 쪽수</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="모름"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                className="w-24 bg-transparent text-right text-body tabular-nums outline-none placeholder:text-faint"
              />
            </label>
          </div>

          <Button
            disabled={busy}
            size="lg"
            className="mt-4 w-full"
            onClick={() => {
              const page = Number(currentPage), total = Number(pageCount);
              if (!currentPage.trim() || !Number.isSafeInteger(page) || page < 0 || (pageCount !== "" && (!Number.isSafeInteger(total) || total < 1 || page > total))) {
                setError("현재 쪽수와 총 쪽수를 확인해 주세요. 쪽수는 0 이상의 정수로 입력해 주세요.");
                return;
              }
              void patch({
                currentPage: Number(currentPage),
                // 비워 두면 보내지 않는다 — 서버는 "안 보낸 값"을 바꾸지 않는다.
                ...(pageCount === "" ? {} : { pageCount: Number(pageCount) }),
              });
            }}
          >
            {busy ? "저장 중…" : "여기까지 읽었어요"}
          </Button>

          <div className="mt-6">
            <p className="mb-2.5 ml-0.5 text-foot font-medium text-muted">별점 · 남기고 싶을 때만</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const on = (reading.rating ?? 0) >= n;
                return (
                  <button
                    key={n}
                    disabled={busy}
                    aria-label={`${n}점`}
                    aria-pressed={reading.rating === n}
                    onClick={() => void patch({ rating: n })}
                    className="press"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-7 w-7 ${on ? "text-accent" : "text-fill-strong"}`}
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          <PostComposer book={book} currentPage={reading.currentPage} />

          {error ? (
            <p className="mt-5 rounded-lg bg-danger/10 px-4 py-3 text-callout text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-2">
            <Button variant="quiet" size="lg" onClick={onClose} className="w-full">
              닫기
            </Button>
            <button
              disabled={busy}
              onClick={() => void remove()}
              className="press h-11 rounded-lg text-callout text-danger hover:bg-danger/10 disabled:opacity-40"
            >
              서재에서 빼기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
