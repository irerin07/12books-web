"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Comment, CursorPage } from "@/lib/types";
import { Button } from "./ui";

/** 서버가 받는 댓글 길이(CommentCreateRequest). 넘기면 C001로 돌아온다. */
const MAX = 500;

/**
 * 감상평에 달린 댓글. 1단계뿐이라 대댓글이 없다.
 *
 * 서버는 최신순(id 내림차순)으로 준다. 그대로 둔다 — 뒤집으면 "더 보기"로 받아 온 옛 댓글이
 * 위로 끼어들어, 읽던 자리가 매번 아래로 밀린다.
 *
 * 지울 수 있는지는 화면이 판단한다. 댓글 작성자이거나 글 작성자이면 된다는 규칙이고,
 * 서버가 그 값을 실어 주지 않는 것도 같은 규칙이 두 곳에 생기지 않게 하려는 것이다.
 */
export default function PostComments({ postId, postAuthor, onCountChange }: {
  postId: number;
  postAuthor: string;
  onCountChange: (delta: number) => void;
}) {
  const { me } = useSession();
  const [items, setItems] = useState<Comment[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api<CursorPage<Comment>>(`/api/v1/posts/${postId}/comments?size=20`)
      .then(page => { if (!active) return; setItems(page.items); setCursor(page.nextCursor); setHasNext(page.hasNext); })
      .catch(() => { if (active) setError("댓글을 불러오지 못했어요."); });
    return () => { active = false; };
  }, [postId]);

  async function loadMore() {
    try {
      const page = await api<CursorPage<Comment>>(`/api/v1/posts/${postId}/comments?size=20&cursor=${cursor}`);
      setItems(prev => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor); setHasNext(page.hasNext);
    } catch { setError("다음 댓글을 불러오지 못했어요."); }
  }

  async function write() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await api<Comment>(`/api/v1/posts/${postId}/comments`, { method: "POST", body: { content } });
      // 서버가 최신순으로 주므로 새 댓글은 맨 위다.
      setItems(prev => [created, ...(prev ?? [])]);
      setDraft(""); onCountChange(1);
    } catch (e) {
      setError(e instanceof ApiError && e.code === "P001"
        ? "지워진 감상평이에요."
        : e instanceof ApiError ? e.reasonFor("content") ?? e.message : "댓글을 남기지 못했어요.");
    } finally { setBusy(false); }
  }

  async function remove(id: number) {
    setError(null);
    try {
      await api<void>(`/api/v1/comments/${id}`, { method: "DELETE" });
      setItems(prev => prev?.filter(c => c.id !== id) ?? prev);
      onCountChange(-1);
    } catch (e) {
      // 이미 지워진 댓글이면 목록에서 내리는 것이 맞다. 화면이 뒤처져 있었을 뿐이다.
      if (e instanceof ApiError && e.code === "P003") {
        setItems(prev => prev?.filter(c => c.id !== id) ?? prev);
      } else setError("댓글을 지우지 못했어요.");
    }
  }

  return <section className="post-comments" aria-label="댓글">
    {me && <div className="comment-write">
      <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={2} maxLength={MAX}
        placeholder="이 감상에 한마디" aria-label="댓글 쓰기" className="field resize-y" />
      <div className="mt-2 flex items-center justify-end gap-3">
        <span className="text-cap tabular-nums text-faint">{draft.length} / {MAX}</span>
        <Button variant="quiet" disabled={busy || !draft.trim()} onClick={() => void write()}>
          {busy ? "남기는 중" : "남기기"}
        </Button>
      </div>
    </div>}

    {error && <p role="alert" className="mt-3 text-foot text-danger">{error}</p>}

    {items === null ? <p className="mt-4 text-foot text-muted">불러오는 중</p>
      : items.length === 0 ? <p className="mt-4 text-foot text-muted">아직 댓글이 없어요.</p>
      : <ul className="mt-4 space-y-4">{items.map(comment => <li key={comment.id} className="comment-row">
          <Link href={`/u/${comment.author.handle}`} className="avatar">
            {comment.author.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={comment.author.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              : comment.author.displayName.slice(0, 1)}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-foot"><Link href={`/u/${comment.author.handle}`} className="font-semibold">{comment.author.displayName}</Link></p>
            <p className="mt-0.5 text-callout whitespace-pre-line">{comment.content}</p>
          </div>
          {/* 내 댓글이거나 내 글에 달린 댓글이면 지울 수 있다. */}
          {me && (me.handle === comment.author.handle || me.handle === postAuthor) &&
            <button onClick={() => void remove(comment.id)} className="shrink-0 self-start text-cap text-muted hover:text-danger">지우기</button>}
        </li>)}</ul>}

    {hasNext && <div className="mt-4 text-center">
      <Button variant="quiet" onClick={() => void loadMore()}>이전 댓글 더 보기</Button>
    </div>}
  </section>;
}
