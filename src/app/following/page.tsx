"use client";
import { useSession } from "@/lib/session";
import { Empty, LinkButton } from "@/components/ui";
import FeedHeader from "@/components/FeedHeader";
import Feed from "@/components/Feed";

/**
 * 팔로잉. 내가 고른 사람들의 글만 흐른다.
 *
 * 홈과 나눈 것은 섞인 피드에서는 "내가 고른 사람"과 "서버가 보여준 사람"이 구분되지 않기
 * 때문이다. 여기서는 그 구분이 목록 자체의 뜻이라 글마다 표시를 달 필요도 없다.
 *
 * 아무도 팔로우하지 않으면 비어 있다. 그때 홈으로 돌려보내는 것은 거기서 사람을 만나기
 * 때문이다 — 섞인 피드가 아직 모르는 사람을 데려온다.
 */
export default function FollowingPage() {
  const { me } = useSession();

  return <>
    <div className="content-columns">
      <FeedHeader active="following" />
      <div className="min-w-0">
      {/* 감상평 조회에도 로그인이 필요하다(SecurityConfig는 /auth/**만 연다). */}
      {me
        ? <Feed key="following" path="/api/v1/feed/following" empty={<Empty
            title="아직 팔로우한 사람이 없어요"
            hint="홈에서 마음에 드는 기록을 남긴 사람을 팔로우하면, 그 사람의 글이 여기로 모입니다."
            action={<LinkButton href="/">홈에서 둘러보기</LinkButton>} />} />
        : <Empty title="로그인하면 볼 수 있어요" hint="팔로우한 사람들의 감상평은 로그인한 뒤에 읽을 수 있습니다." action={<LinkButton href="/login">로그인</LinkButton>} />}
    </div></div>
  </>;
}
