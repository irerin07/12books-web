"use client";
import { useSession } from "@/lib/session";
import { Empty, LinkButton } from "@/components/ui";
import Feed from "@/components/Feed";
import ContextRail from "@/components/ContextRail";

/**
 * 탐색. 팔로우 관계와 상관없이 모두의 감상평이 최신순으로 흐른다.
 *
 * 홈에서 떼어낸 것은 성격이 다르기 때문이다. 홈은 내가 고른 사람들을 읽는 자리이고,
 * 여기는 아직 고르지 않은 사람을 만나는 자리다. 한 화면에 쌓으면 팔로우한 사람의 글이
 * 전체 최신에 또 나와 같은 말을 두 번 하게 된다.
 */
export default function ExplorePage() {
  const { me } = useSession();

  return <>
    <header className="page-heading"><div>
      <h1>탐색</h1>
      <p>{me ? "아직 팔로우하지 않은 사람들의 기록까지, 최근에 남겨진 감상평." : "다른 사람들이 어떤 책을 읽고 무엇을 남겼는지 둘러보세요."}</p>
    </div></header>
    <div className="content-columns"><div className="min-w-0">
      {/* 감상평 조회에도 로그인이 필요하다(SecurityConfig는 /auth/**만 연다). */}
      {me
        ? <Feed key="explore" path="/api/v1/feed/explore" empty={<Empty title="아직 남겨진 감상평이 없어요" hint="첫 기록을 남기는 사람이 되어 보세요." action={<LinkButton href="/library">기록 남기기</LinkButton>} />} />
        : <Empty title="로그인하면 볼 수 있어요" hint="다른 사람들의 감상평은 로그인한 뒤에 읽을 수 있습니다." action={<LinkButton href="/login">로그인</LinkButton>} />}
    </div><ContextRail /></div>
  </>;
}
