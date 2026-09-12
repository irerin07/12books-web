import { api } from "./api";
import type { Profile } from "./types";

/** 홈의 두 탭. 경로를 문자열로 흩어 두면 한쪽만 고치는 날이 온다. */
export const FEED = { recommend: "/", following: "/following" } as const;

/**
 * 이 사람의 기본 피드.
 *
 * 고른 사람들이 있으면 팔로잉이 기본이다. 팔로우를 해 둔 이유가 화면에 반영되어야 한다.
 * 아무도 없으면 팔로잉은 빈 화면이고 거기서는 사람을 만날 수도 없으니 추천으로 보낸다.
 *
 * 묻는 데 실패하면 추천이다. 기본 탭을 정하려다 화면 자체를 막을 일은 아니다.
 */
export async function defaultFeedPath(handle: string): Promise<string> {
  try {
    const me = await api<Profile>(`/api/v1/users/${handle}`);
    return me.followingCount > 0 ? FEED.following : FEED.recommend;
  } catch {
    return FEED.recommend;
  }
}
