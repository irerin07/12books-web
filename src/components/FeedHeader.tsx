import Link from "next/link";
export default function FeedHeader({ active, action }: {
  active: "home" | "following";
  /** 이 화면의 주 행동. 탭 옆에 둔다 — 읽는 자리와 쓰는 자리가 한눈에 같이 보여야 한다. */
  action?: React.ReactNode;
}) {
  return <header className="feed-header"><h1 className="sr-only">{active === "home" ? "추천" : "팔로잉"}</h1><nav aria-label="피드 선택"><Link href="/" aria-current={active === "home" ? "page" : undefined}>추천</Link><Link href="/following" aria-current={active === "following" ? "page" : undefined}>팔로잉</Link></nav>{action}</header>;
}
