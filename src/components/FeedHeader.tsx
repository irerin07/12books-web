import Link from "next/link";
export default function FeedHeader({ active }: { active: "home" | "following" }) {
  return <header className="feed-header"><h1 className="sr-only">{active === "home" ? "추천" : "팔로잉"}</h1><nav aria-label="피드 선택"><Link href="/" aria-current={active === "home" ? "page" : undefined}>추천</Link><Link href="/following" aria-current={active === "following" ? "page" : undefined}>팔로잉</Link></nav></header>;
}
