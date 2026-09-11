"use client";
import Link from "next/link";
import { use } from "react";
import FollowList from "@/components/FollowList";

export default function FollowingsPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = use(params);
  return <>
    <header className="page-heading"><div>
      <h1>팔로잉</h1>
    </div><Link href={`/u/${handle}`} className="text-foot text-muted hover:text-accent">@{handle}</Link></header>
    <FollowList handle={handle} kind="followings" />
  </>;
}
