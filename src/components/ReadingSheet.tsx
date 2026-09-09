"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { LibraryItem, Reading, ReadingStatus } from "@/lib/types";
import { READING_STATUS_LABEL } from "@/lib/types";
import { Button, Cover } from "./ui";

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
    <div className="fixed inset-0 z-20 flex items-end justify-center sm:items-center" role="dialog">
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 sm:max-w-md sm:rounded-2xl">
        <div className="flex gap-4">
          <Cover src={book.thumbnailUrl} title={book.title} className="w-20 shrink-0 rounded" />
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">{book.title}</h2>
            <p className="mt-1 text-sm text-muted">{book.authors}</p>
            {book.publisher ? <p className="text-xs text-muted">{book.publisher}</p> : null}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs text-muted">상태</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => void patch({ status: s })}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  reading.status === s
                    ? "border-ink bg-ink text-canvas"
                    : "border-line text-muted hover:text-ink"
                }`}
              >
                {READING_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-muted">현재 쪽</span>
            <input
              type="number"
              min={0}
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink/40"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-muted">총 쪽수</span>
            <input
              type="number"
              min={1}
              placeholder="모름"
              value={pageCount}
              onChange={(e) => setPageCount(e.target.value)}
              className="w-full rounded-lg border border-line bg-transparent px-3 py-2 text-sm outline-none focus:border-ink/40"
            />
          </label>
          <Button
            disabled={busy}
            onClick={() =>
              void patch({
                currentPage: Number(currentPage),
                // 비워 두면 보내지 않는다 — 서버는 "안 보낸 값"을 바꾸지 않는다.
                ...(pageCount === "" ? {} : { pageCount: Number(pageCount) }),
              })
            }
          >
            저장
          </Button>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs text-muted">별점</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                disabled={busy}
                aria-label={`${n}점`}
                onClick={() => void patch({ rating: n })}
                className={`text-2xl leading-none transition ${
                  (reading.rating ?? 0) >= n ? "text-ink" : "text-line"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <div className="mt-6 flex justify-between">
          <button
            disabled={busy}
            onClick={() => void remove()}
            className="text-sm text-danger"
          >
            서재에서 빼기
          </button>
          <Button variant="quiet" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
