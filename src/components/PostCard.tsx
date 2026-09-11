"use client";
import Link from "next/link";
import { useId, useState } from "react";
import type { Post } from "@/lib/types";
import { Cover } from "./ui";
import Icon from "./Icon";
import { useSession } from "@/lib/session";

function since(iso: string) {
  const written = new Date(iso);
  const minutes = Math.max(0, Math.floor((Date.now() - written.getTime()) / 60000));
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`;
  return written.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function PostCard({ post, following, followBusy = false, followError, onFollow }: {
  post: Post;
  following?: boolean;
  followBusy?: boolean;
  followError?: string;
  onFollow?: () => void;
}) {
  const { me } = useSession();
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const pages = post.fromPage !== undefined
    ? `${post.fromPage}${post.toPage !== undefined && post.toPage !== post.fromPage ? `–${post.toPage}` : ""}쪽`
    : post.toPage !== undefined ? `${post.toPage}쪽까지` : null;
  const hidden = post.spoiler && !revealed;
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
      <Cover src={post.book.thumbnailUrl} title={post.book.title} className="w-[48px] shrink-0" radius="rounded-sm" />
      <div className="min-w-0 flex-1"><h2 className="post-book-title">{post.book.title}</h2><p>{post.book.authors}</p><span className="post-book-more">이 책의 다른 기록</span></div>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-faint" />
    </Link>
    {post.likeCount + post.commentCount > 0 && <footer className="post-counts">
      {post.likeCount > 0 && <span>좋아요 {post.likeCount}</span>}
      {post.commentCount > 0 && <span>댓글 {post.commentCount}</span>}
    </footer>}
  </article>;
}
