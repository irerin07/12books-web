"use client";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Book, Post } from "@/lib/types";
import { Button } from "./ui";

/** 서버가 받는 본문 길이 상한(PostCreateRequest). 넘겨 보내면 C001로 돌아온다. */
const MAX_CONTENT = 1000;

/**
 * 감상평 쓰기.
 *
 * 읽던 책의 시트 안에 둔다. 따로 화면을 만들면 "무슨 책에 대해 쓸 것인지"부터 다시 고르게 되는데,
 * 방금 쪽수를 적은 자리에서는 그 답이 이미 정해져 있다 — spec.md의 "기록의 문턱은 최대한 낮게".
 *
 * 읽은 구간은 비워 둘 수 있다. 서버도 bookId와 본문만 요구한다. 끝 쪽만 채워 두는 것은
 * "여기까지 읽고 이런 생각을 했다"가 가장 흔한 모양이어서다.
 *
 * readingId는 보내지 않는다. 서버가 (나, 책)으로 찾아 붙이거나 만든다 — 화면이 보내게 하면
 * 남의 기록 id를 실어 보내는 경로가 열린다.
 */
export default function PostComposer({ book, currentPage }: { book: Book; currentPage: number }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState(currentPage > 0 ? String(currentPage) : "");
  const [spoiler, setSpoiler] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setBusy(true); setError(null);
    try {
      await api<Post>("/api/v1/posts", {
        method: "POST",
        body: {
          bookId: book.id,
          content: content.trim(),
          // 빈 칸은 보내지 않는다. 0을 보내면 "1쪽 이상"이라는 서버 규칙에 걸린다.
          ...(fromPage.trim() ? { fromPage: Number(fromPage) } : {}),
          ...(toPage.trim() ? { toPage: Number(toPage) } : {}),
          spoiler,
        },
      });
      setContent(""); setOpen(false); setDone(true);
    } catch (e) {
      setError(e instanceof ApiError
        ? e.reasonFor("content") ?? e.reasonFor("pageRangeOrdered") ?? e.reasonFor("fromPage") ?? e.reasonFor("toPage") ?? e.message
        : "감상평을 남기지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  if (!open) {
    return <div className="mt-7">
      <p className="mb-2.5 ml-0.5 text-foot font-medium text-muted">감상 · 남기고 싶을 때만</p>
      <Button variant="quiet" className="w-full" onClick={() => { setOpen(true); setDone(false); }}>
        {done ? "한 번 더 쓰기" : "감상평 쓰기"}
      </Button>
      {done && <p className="mt-2 text-center text-foot text-accent">감상평을 남겼어요. 타임라인에서 볼 수 있어요.</p>}
    </div>;
  }

  const tooLong = content.length > MAX_CONTENT;
  return <div className="mt-7">
    <p className="mb-2.5 ml-0.5 text-foot font-medium text-muted">감상 · 남기고 싶을 때만</p>

    <textarea
      value={content}
      onChange={e => setContent(e.target.value)}
      rows={5}
      autoFocus
      placeholder="여기까지 읽고 어떤 생각이 들었나요?"
      className="field resize-y"
      aria-label="감상평 본문"
    />
    <p className={`mt-1.5 text-right text-cap tabular-nums ${tooLong ? "text-danger" : "text-faint"}`}>
      {content.length} / {MAX_CONTENT}
    </p>

    <div className="group-box mt-3">
      <label className="flex items-center justify-between gap-4 px-4 py-3.5">
        <span className="text-body">읽은 구간 · 비워 둬도 괜찮아요</span>
        <span className="flex items-center gap-1.5 text-body tabular-nums">
          <input type="number" min={1} inputMode="numeric" placeholder="처음" value={fromPage}
            onChange={e => setFromPage(e.target.value)} aria-label="시작 쪽"
            className="w-16 bg-transparent text-right outline-none placeholder:text-faint" />
          <span className="text-faint">–</span>
          <input type="number" min={1} inputMode="numeric" placeholder="끝" value={toPage}
            onChange={e => setToPage(e.target.value)} aria-label="끝 쪽"
            className="w-16 bg-transparent text-right outline-none placeholder:text-faint" />
        </span>
      </label>
      <label className="flex items-center justify-between gap-4 px-4 py-3.5">
        <span className="text-body">스포일러가 있어요</span>
        <input type="checkbox" checked={spoiler} onChange={e => setSpoiler(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-accent)]" />
      </label>
    </div>

    {error && <p className="mt-3 rounded-lg bg-danger/10 px-4 py-3 text-callout text-danger">{error}</p>}

    <div className="mt-3 flex gap-2">
      <Button variant="quiet" size="lg" className="flex-1" onClick={() => { setOpen(false); setError(null); }}>
        그만두기
      </Button>
      <Button size="lg" className="flex-1" disabled={busy || !content.trim() || tooLong} onClick={() => void submit()}>
        {busy ? "올리는 중…" : "남기기"}
      </Button>
    </div>
  </div>;
}
