"use client";
import type { Reading } from "@/lib/types";
import { Button } from "./ui";

/**
 * 전에 읽다 뺀 책을 다시 담을 때 무엇을 할지 묻는다.
 *
 * 서버가 대신 고르지 않는 이유가 그대로 이 화면의 이유다 — 되살리면 지운 줄 알았던 진도가
 * 돌아오고, 0쪽부터 시작하면 읽은 기록이 사라진 것처럼 보인다. 어느 쪽이든 묻지 않으면
 * 사용자를 놀라게 한다.
 *
 * 그래서 지난 진도를 먼저 보여주고 고르게 한다. "200쪽까지 읽으셨어요"를 읽고 나면
 * 두 선택지가 각각 무엇을 뜻하는지 설명하지 않아도 안다.
 */
export default function ResumeSheet({ past, title, busy, onPick, onClose }: {
  past: Reading;
  title: string;
  busy: boolean;
  onPick: (resume: boolean) => void;
  onClose: () => void;
}) {
  const read = past.pageCount
    ? `${past.currentPage} / ${past.pageCount}쪽`
    : `${past.currentPage}쪽`;

  return <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
    <button aria-label="닫기" onClick={onClose} className="absolute inset-0 animate-[fade-in_0.25s_ease] bg-black/40 backdrop-blur-[2px]" />
    <div role="dialog" aria-modal="true" aria-label="다시 담기"
      className="relative w-full animate-[sheet-in_0.4s_var(--ease-spring)] rounded-t-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet sm:max-w-[420px] sm:rounded-3xl sm:pb-5">
      <h2 className="text-headline">전에 읽던 책이에요</h2>
      {/*
        제목과 진도를 한 문장으로 엮지 않는다. "사피엔스을(를)"처럼 조사가 어긋나고,
        받침을 따져 고르는 코드를 화면에 두는 것은 이 한 줄이 감당할 일이 아니다.
      */}
      <p className="mt-3 text-body">{title}</p>
      <p className="mt-1 text-callout text-muted">
        {read}까지 읽으셨어요.{past.rating ? ` 별점 ${past.rating}점도 남아 있어요.` : ""}
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Button size="lg" className="w-full" disabled={busy} onClick={() => onPick(true)}>
          이어서 읽기
        </Button>
        <Button variant="quiet" size="lg" className="w-full" disabled={busy} onClick={() => onPick(false)}>
          처음부터 새로 읽기
        </Button>
        {/* 새로 읽기를 골라도 지난 기록은 지워지지 않는다. 서재에 보이지 않을 뿐이다. */}
        <p className="mt-1 text-center text-cap text-faint">새로 읽어도 지난 기록은 그대로 남아요.</p>
        <button onClick={onClose} disabled={busy} className="press mt-1 h-10 rounded-lg text-callout text-muted">
          그만두기
        </button>
      </div>
    </div>
  </div>;
}
