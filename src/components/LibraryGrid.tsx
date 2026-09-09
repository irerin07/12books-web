"use client";

import { Cover } from "./ui";
import { READING_STATUS_LABEL, type LibraryItem } from "@/lib/types";

/**
 * 표지 그리드. 인스타의 사진 격자와 같은 자리이지만 표지는 2:3이라 비율만 다르다.
 *
 * 진행률 막대를 타일 아래쪽에 얇게 얹는다 — 숫자를 크게 쓰면 "몇 % 읽었나"가 표지보다
 * 먼저 보이는데, 이 제품에서 자랑스러워야 할 것은 책이지 숫자가 아니다.
 */
export default function LibraryGrid({
  items,
  onSelect,
}: {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-1 sm:gap-2">
      {items.map(({ reading, book }) => {
        const ratio =
          reading.pageCount && reading.pageCount > 0
            ? Math.min(1, reading.currentPage / reading.pageCount)
            : null;

        return (
          <li key={reading.id}>
            <button
              onClick={() => onSelect({ reading, book })}
              className="block w-full text-left"
            >
              <div className="relative">
                <Cover src={book.thumbnailUrl} title={book.title} className="rounded-sm" />

                {reading.status === "FINISHED" ? (
                  <span className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    완독
                  </span>
                ) : null}

                {ratio !== null && reading.status !== "FINISHED" ? (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-black/25">
                    <div className="h-full bg-white/90" style={{ width: `${ratio * 100}%` }} />
                  </div>
                ) : null}
              </div>

              <p className="mt-1 truncate text-[11px] leading-tight text-ink sm:text-xs">
                {book.title}
              </p>
              <p className="truncate text-[11px] text-muted">
                {READING_STATUS_LABEL[reading.status]}
                {reading.rating ? ` · ★${reading.rating}` : ""}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
