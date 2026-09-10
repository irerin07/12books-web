"use client";
import Link from "next/link";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { Cover } from "./ui";
import Icon from "./Icon";

/**
 * 얼마나 지났는지. 초 단위까지 세지 않는다 — 감상평은 분 단위로 다투는 글이 아니다.
 * 하루가 넘으면 날짜로 적는다. "8일 전"은 사람이 다시 계산해야 하는 표현이다.
 */
function since(iso: string) {
  const written = new Date(iso);
  const minutes = Math.floor((Date.now() - written.getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / 1440)}일 전`;
  return written.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * 피드에 한 줄로 놓이는 감상평.
 *
 * 스포일러는 서버가 본문을 지우지 않고 플래그만 준다. 가리는 일은 화면 몫이라 여기서 덮고,
 * 누르면 열린다 — 서버가 지워 버리면 작성자 본인도 자기 글을 못 보게 된다.
 */
export default function PostCard({ post }: { post: Post }) {
  const [revealed, setRevealed] = useState(false);
  const pages = post.fromPage
    ? `${post.fromPage}${post.toPage && post.toPage !== post.fromPage ? `–${post.toPage}` : ""}쪽`
    : null;

  return <article className="post-card">
    <header className="flex items-center gap-3">
      <Link href={`/u/${post.author.handle}`} className="avatar">
        {post.author.avatarUrl
          // 아바타는 어떤 주소든 올 수 있어 next/image의 허용 목록에 기대지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={post.author.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          : post.author.displayName.slice(0, 1)}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${post.author.handle}`} className="text-foot font-semibold">{post.author.displayName}</Link>
        <p className="text-cap text-faint">@{post.author.handle} · {since(post.createdAt)}</p>
      </div>
    </header>

    <div className="post-body">
      <Cover src={post.book.thumbnailUrl} title={post.book.title} className="w-[52px] shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="text-foot font-semibold">{post.book.title}</h3>
        <p className="mt-0.5 text-cap text-muted">{post.book.authors}{pages ? ` · ${pages}` : ""}</p>

        {post.spoiler && !revealed
          ? <button onClick={() => setRevealed(true)} className="spoiler-veil">
              <Icon name="book" className="h-4 w-4" />스포일러가 있어요 · 눌러서 보기
            </button>
          : <p className="mt-3 text-callout leading-loose whitespace-pre-line">{post.content}</p>}
      </div>
    </div>

    {/*
      좋아요와 댓글은 백엔드 Phase 6에서 생긴다. 그때까지는 서버가 세어 준 수를 읽기만 한다 —
      누를 수 없는 버튼을 미리 놓으면 눌러 본 사람에게 아무 일도 일어나지 않는다.
    */}
    {post.likeCount + post.commentCount > 0 && <footer className="post-counts">
      {post.likeCount > 0 && <span>좋아요 {post.likeCount}</span>}
      {post.commentCount > 0 && <span>댓글 {post.commentCount}</span>}
    </footer>}
  </article>;
}
