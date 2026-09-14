"use client";
import { use, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Post } from "@/lib/types";
import { Empty, LinkButton, Spinner } from "@/components/ui";
import PostCard from "@/components/PostCard";

/**
 * 감상평 한 건.
 *
 * 알림이 데려올 곳이 필요해서 생겼다 — "누가 내 글에 댓글을 남겼어요"를 눌렀는데 피드
 * 어딘가에서 그 글을 찾아야 한다면 알림이 일을 절반만 하는 셈이다.
 *
 * 지워진 글은 P001/404다. 목록에서도 사라지므로 "없음"이 아니라 "지워졌음"으로 말한다 —
 * 알림에서 왔다면 방금까지 있던 글이다.
 */
export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [gone, setGone] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void api<Post>(`/api/v1/posts/${id}`)
      .then(found => { if (active) setPost(found); })
      .catch(e => {
        if (!active) return;
        if (e instanceof ApiError && e.code === "P001") setGone(true); else setError(true);
      });
    return () => { active = false; };
  }, [id]);

  if (gone) return <Empty title="지워진 감상평이에요"
    hint="글쓴이가 지웠어요. 달려 있던 좋아요와 댓글도 함께 사라졌습니다."
    action={<LinkButton href="/">홈으로</LinkButton>} />;
  if (error) return <Empty title="감상평을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />;
  if (!post) return <Spinner />;

  /* 여기서 지우면 이 화면이 가리키던 것이 없어진다. 목록처럼 한 줄만 내릴 수는 없다. */
  return <PostCard post={post} onRemoved={() => setGone(true)} />;
}
