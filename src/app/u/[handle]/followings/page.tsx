"use client";
import Link from "next/link";
import { use } from "react";
import FollowList from "@/components/FollowList";

export default function FollowingsPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  return <>
    <header className="page-heading"><div>
      <h1>팔로잉</h1>
      <p><Link href={`/u/${handle}`} className="text-accent">@{handle}</Link>님의 팔로잉 목록</p>
    </div></header>
    <FollowList handle={handle} kind="followings" />
  </>;
}
