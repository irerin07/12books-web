"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useCooldown } from "@/lib/cooldown";
import { Button, SheetClose } from "./ui";

/** 서버의 ReportReason과 같은 값이다. 문구는 화면이 정한다. */
const REASONS = [
  { value: "SPOILER", label: "스포일러", hint: "가리지 않고 결말이나 반전을 적었어요" },
  { value: "SPAM", label: "스팸·광고", hint: "홍보나 도배예요" },
  { value: "ABUSE", label: "욕설·비방", hint: "다른 사람을 공격해요" },
  { value: "SEXUAL", label: "선정적", hint: "성적인 내용이에요" },
  { value: "OTHER", label: "기타", hint: "위에 없는 이유예요" },
] as const;

const MAX_DETAIL = 500;

/**
 * 신고. 글·댓글·사람 셋이 같은 모양이라 한 곳에서 다룬다.
 *
 * 처리 결과는 알려주지 않는다 — 신고자에게 "내렸습니다"를 보여주면 누가 누구를 신고했는지가
 * 역으로 드러난다. 그래서 이 시트가 할 말은 "접수됐습니다"까지다.
 *
 * 자세한 설명은 선택이다. 사유를 고르고 나서 또 쓰라고 요구하면 신고를 포기하게 된다.
 */
export default function ReportSheet({ target, what, onClose }: {
  /** 신고를 받는 곳. 예: `/api/v1/posts/91/reports` */
  target: string;
  /** 무엇을 신고하는지. 제목 한 줄에 쓴다. */
  what: "감상평" | "댓글" | "사용자";
  onClose: () => void;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"] | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const cooldown = useCooldown();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [onClose]);

  async function send() {
    if (!reason) return;
    setBusy(true); setError(null);
    try {
      await api<void>(target, { method: "POST", body: { reason, ...(detail.trim() ? { detail: detail.trim() } : {}) } });
      setDone("접수됐습니다. 검토 결과는 따로 알려드리지 않아요.");
    } catch (e) {
      if (cooldown.take(e)) setError(null);
      /* 이미 신고한 대상이다. 원하던 결과에 이미 도달해 있으므로 실패로 말하지 않는다. */
      else if (e instanceof ApiError && e.code === "S002") setDone("이미 신고한 대상이에요.");
      else if (e instanceof ApiError) setError(e.reasonFor("detail") ?? e.message);
      else setError("신고를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
    <button aria-label="닫기" onClick={onClose} className="absolute inset-0 animate-[fade-in_0.25s_ease] bg-black/40 backdrop-blur-[2px]" />

    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="relative max-h-[88dvh] w-full animate-[sheet-in_0.4s_var(--ease-spring)] overflow-y-auto rounded-t-xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet outline-none sm:max-w-[440px] sm:rounded-xl sm:pb-5">
      <SheetClose onClose={onClose} />

      {done ? <>
        <h2 id={titleId} className="text-headline pr-8">신고를 받았어요</h2>
        <p className="mt-2 text-callout text-muted">{done}</p>
        <Button size="lg" className="mt-6 w-full" onClick={onClose}>닫기</Button>
      </> : <>
        <h2 id={titleId} className="text-headline pr-8">이 {what}을 신고할게요</h2>
        <p className="mt-1.5 text-foot text-muted">어떤 점이 문제인지 하나만 골라 주세요.</p>

        <div role="radiogroup" aria-labelledby={titleId} className="mt-5 space-y-1">
          {REASONS.map(option => {
            const on = reason === option.value;
            return <button key={option.value} type="button" role="radio" aria-checked={on}
              onClick={() => setReason(option.value)}
              className={`report-reason ${on ? "is-on" : ""}`}>
              <span className="report-reason-mark" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-callout font-semibold">{option.label}</span>
                <span className="block text-cap text-muted">{option.hint}</span>
              </span>
            </button>;
          })}
        </div>

        {/* 선택이다. 라벨에 그렇게 적어 두지 않으면 비워 두어도 되는지 알 수 없다. */}
        <label className="mt-5 block">
          <span className="mb-2 ml-0.5 block text-foot font-medium text-muted">자세한 설명 · 선택</span>
          <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3} maxLength={MAX_DETAIL}
            placeholder="검토에 도움이 될 내용이 있으면 적어 주세요." className="field resize-y" aria-label="자세한 설명" />
          <span className="mt-1 block text-right text-cap tabular-nums text-faint">{detail.length} / {MAX_DETAIL}</span>
        </label>

        {cooldown.locked && <p role="alert" className="mt-1 text-foot text-danger">
          신고가 너무 잦았어요. {cooldown.left}초 뒤에 다시 보낼 수 있어요.
        </p>}
        {error && <p role="alert" className="mt-1 text-foot text-danger">{error}</p>}

        <Button size="lg" className="mt-4 w-full" disabled={!reason || busy || cooldown.locked} onClick={() => void send()}>
          {cooldown.locked ? `${cooldown.left}초 뒤에 다시` : busy ? "보내는 중…" : "신고 보내기"}
        </Button>
        <p className="mt-3 text-center text-cap text-faint">검토 결과는 따로 알려드리지 않아요.</p>
      </>}
    </div>
  </div>;
}
