"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Post } from "@/lib/types";
import { Cover } from "./ui";
import Icon from "./Icon";
import { useSession } from "@/lib/session";
import PostComments from "./PostComments";
import { useCooldown } from "@/lib/cooldown";
import ReportSheet from "./ReportSheet";

function since(iso: string) {
  const written = new Date(iso);
  const minutes = Math.max(0, Math.floor((Date.now() - written.getTime()) / 60000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`;
  return written.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function PostCard({ post, following, followBusy = false, followError, onFollow, onRemoved }: {
  post: Post;
  following?: boolean;
  followBusy?: boolean;
  followError?: string;
  onFollow?: () => void;
  /** 지워진 뒤 목록에서 내리라고 알린다. 서버는 204만 주므로 화면이 직접 내린다. */
  onRemoved?: (id: number) => void;
}) {
  const { me } = useSession();
  const [revealed, setRevealed] = useState(false);
  /*
   * 하트는 낙관적으로 먼저 칠한다. 누르고 나서 서버를 기다리면 눌렀는지 아닌지가 잠깐
   * 비어 있고, 그 사이 사람은 한 번 더 누른다.
   */
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeBusy, setLikeBusy] = useState(false);
  const cooldown = useCooldown();
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  /*
   * 지우기는 두 걸음이다. 한 번 누르면 정말 지울지 그 자리에서 되묻는다.
   *
   * API에 복구 경로가 없다 — 지운 글은 단건도 목록도 P001/404이고 달려 있던 좋아요·댓글에도
   * 닿을 수 없다. 되돌릴 수 없는 것을 한 번의 실수로 지나가게 두지 않는다.
   */
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const contentId = useId();
  const pages = post.fromPage !== undefined
    ? `${post.fromPage}${post.toPage !== undefined && post.toPage !== post.fromPage ? `–${post.toPage}` : ""}쪽`
    : post.toPage !== undefined ? `${post.toPage}쪽까지` : null;
  const hidden = post.spoiler && !revealed;

  async function toggleLike() {
    if (likeBusy) return;
    const next = !liked;
    setLikeBusy(true);
    setLiked(next); setLikeCount(count => count + (next ? 1 : -1));
    try {
      await api<void>(`/api/v1/posts/${post.id}/likes`, { method: next ? "POST" : "DELETE" });
    } catch (e) {
      /*
       * P002는 이미 눌러 둔 글이다 — 실패가 아니라 원하던 상태에 이미 도달해 있다.
       * 취소는 서버가 멱등이라 애초에 실패하지 않는다.
       */
      if (!(e instanceof ApiError && e.code === "P002")) {
        setLiked(!next); setLikeCount(count => count + (next ? -1 : 1));
        /* 429면 서버가 받지 않았다. 되돌린 뒤 잠시 못 누르게 한다 — 곧장 또 누르면 또 429다. */
        cooldown.take(e);
      }
    } finally { setLikeBusy(false); }
  }
  async function remove() {
    setRemoving(true); setRemoveError(null);
    try {
      await api<void>(`/api/v1/posts/${post.id}`, { method: "DELETE" });
      onRemoved?.(post.id);
    } catch (e) {
      /* 이미 지워진 글이면 원하던 결과에 이미 도달해 있다. 목록에서 내리는 것이 맞다. */
      if (e instanceof ApiError && e.code === "P001") onRemoved?.(post.id);
      else { setRemoveError("감상평을 지우지 못했어요. 잠시 후 다시 시도해 주세요."); setRemoving(false); }
    }
  }

  const mine = me?.handle === post.author.handle;
  const long = post.content.length > 320 || post.content.split("\n").length > 7;

  return <article className="post-card" aria-label={`${post.author.displayName}님의 ${post.book.title} 감상`}>
    <header className="post-author">
      <Link href={`/u/${post.author.handle}`} className="avatar" aria-label={`${post.author.displayName} 프로필`}>
        {post.author.avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={post.author.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          : post.author.displayName.slice(0, 1)}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link href={`/u/${post.author.handle}`} className="post-author-name">{post.author.displayName}</Link>
          {me && me.handle !== post.author.handle && following !== undefined && (
            following ? <span className="text-[13px] text-muted">팔로잉</span> : onFollow && <button
              type="button" onClick={onFollow} disabled={followBusy}
              aria-label={`${post.author.displayName}님 팔로우`} aria-busy={followBusy}
              className="min-h-9 px-1 text-[13px] font-semibold text-accent hover:underline disabled:cursor-wait disabled:opacity-50"
            >{followBusy ? "팔로우 중…" : "팔로우"}</button>
          )}
          <time dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString("ko-KR")} className="post-time">· {since(post.createdAt)}</time>
        </div>
        <p className="post-reading-context">{pages ? `${pages} 읽고 남긴 생각` : "책을 읽고 남긴 생각"}</p>
      </div>
    </header>
    {followError && <p role="alert" className="mt-2 text-foot text-danger">{followError}</p>}

    <div className="post-content-area">
      {hidden ? <div className="spoiler-notice">
        <div className="flex items-center gap-2 text-headline"><Icon name="book" className="h-[18px] w-[18px] text-muted" /><span>책의 내용이 담긴 감상이에요</span></div>
        <p>스포일러를 포함하고 있어요. 읽어도 괜찮다면 펼쳐 보세요.</p>
        <button aria-expanded={false} aria-controls={contentId} onClick={() => setRevealed(true)} className="spoiler-toggle">감상 펼치기<Icon name="chevron" className="h-3.5 w-3.5" /></button>
        <div id={contentId} hidden />
      </div> : <>
        <p id={contentId} className={`post-prose ${long && !expanded ? "post-prose-clamped" : ""}`}>{post.content}</p>
        {long && <button aria-expanded={expanded} aria-controls={contentId} className="post-text-action" onClick={() => setExpanded(value => !value)}>{expanded ? "접기" : "더 읽기"}</button>}
        {post.spoiler && <button aria-expanded={true} aria-controls={contentId} className="post-text-action" onClick={() => setRevealed(false)}>스포일러 다시 가리기</button>}
      </>}
    </div>

    <Link href={`/books/${post.book.id}`} className="post-book">
      <Cover src={post.book.thumbnailUrl} title={post.book.title} className="w-[30px] shrink-0" radius="rounded-sm" />
      <div className="min-w-0 flex-1"><h2 className="post-book-title">{post.book.title}</h2><p>{post.book.authors}</p></div>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint" />
    </Link>
    <footer className="post-actions">
      <button onClick={() => void toggleLike()} disabled={likeBusy || cooldown.locked} aria-pressed={liked}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
        title={cooldown.locked ? `요청이 너무 잦아요. ${cooldown.left}초 뒤에 다시 누를 수 있어요.` : undefined}
        className={`post-action ${liked ? "is-on" : ""}`}>
        <Icon name={liked ? "heart-filled" : "heart"} className="h-[18px] w-[18px]" />
        {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
      </button>
      <button onClick={() => setShowComments(open => !open)} aria-expanded={showComments}
        aria-label="댓글" className="post-action">
        <Icon name="comment" className="h-[18px] w-[18px]" />
        {commentCount > 0 && <span className="tabular-nums">{commentCount}</span>}
      </button>
      {/*
        내 글에만 보인다. 좋아요·댓글과 나란히 두되 반대쪽 끝으로 민다 — 읽다가 누르는 것과
        내 글을 다루는 것은 다른 일이라 손이 같은 자리에서 움직이지 않게 한다.
      */}
      {mine && !confirming && <button onClick={() => setConfirming(true)}
        className="post-action ml-auto">지우기</button>}
      {/*
        내 글에는 신고가 없다 — 서버가 S003/400으로 막는 것을 버튼으로 먼저 말한다.
        로그인하지 않았으면 애초에 보낼 수 없다.
      */}
      {me && !mine && <button onClick={() => setReporting(true)} className="post-action ml-auto">신고</button>}
    </footer>

    {reporting && <ReportSheet target={`/api/v1/posts/${post.id}/reports`} what="감상평"
      onClose={() => setReporting(false)} />}

    {mine && confirming && <div className="post-confirm" role="group" aria-label="감상평 지우기">
      {/* 무엇이 남고 무엇이 사라지는지 먼저 말한다. 진도와 별점은 서재에 그대로 있다. */}
      <p>이 감상평과 달린 좋아요·댓글이 사라져요. 되돌릴 수 없어요.</p>
      <div className="post-confirm-actions">
        <button onClick={() => setConfirming(false)} disabled={removing} className="post-confirm-keep">그대로 두기</button>
        <button onClick={() => void remove()} disabled={removing} className="post-confirm-remove">
          {removing ? "지우는 중…" : "지우기"}
        </button>
      </div>
    </div>}
    {removeError && <p role="alert" className="mt-2 text-foot text-danger">{removeError}</p>}

    {showComments && <PostComments postId={post.id} postAuthor={post.author.handle}
      onCountChange={delta => setCommentCount(count => Math.max(0, count + delta))} />}
  </article>;
}
