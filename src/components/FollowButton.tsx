"use client";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useCooldown } from "@/lib/cooldown";
import { Button } from "./ui";

/**
 * 팔로우 / 팔로잉 버튼.
 *
 * 처음 그릴 상태는 서버가 준 isFollowing이 정한다. 눌린 결과를 먼저 그리고 요청을 보내되,
 * 실패하면 되돌린다 — 누른 직후 아무 반응이 없으면 사람은 한 번 더 누른다.
 *
 * F002(이미 팔로우 중)는 실패가 아니다. 다른 기기에서 이미 팔로우했다는 뜻이므로 원하던
 * 상태에 이미 도달해 있다. 되돌리면 사용자가 방금 만든 결과를 우리가 지우는 셈이 된다.
 */
export default function FollowButton({
  handle,
  following,
  onChanged,
}: {
  handle: string;
  following: boolean;
  onChanged: (nowFollowing: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [hovering, setHovering] = useState(false);
  const cooldown = useCooldown();

  async function toggle() {
    const next = !following;
    setBusy(true);
    onChanged(next);
    try {
      await api<void>(`/api/v1/users/${handle}/follow`, { method: next ? "POST" : "DELETE" });
    } catch (e) {
      if (e instanceof ApiError && e.code === "F002") return;
      /* 429면 눌린 결과를 되돌린다 — 서버는 받지 않았다. 그 뒤 잠시 못 누르게 잠근다. */
      onChanged(!next);
      cooldown.take(e);
    } finally {
      setBusy(false);
    }
  }

  return <Button
    variant={following ? "quiet" : "primary"}
    disabled={busy || cooldown.locked}
    onClick={() => void toggle()}
    onMouseEnter={() => setHovering(true)}
    onMouseLeave={() => setHovering(false)}
    className="min-w-[92px]"
  >
    {cooldown.locked ? `${cooldown.left}초 뒤` : following ? (hovering ? "언팔로우" : "팔로잉") : "팔로우"}
  </Button>;
}
