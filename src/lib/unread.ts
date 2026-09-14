"use client";
import { useSyncExternalStore } from "react";
import { api } from "./api";

/**
 * 안 읽은 알림 수. 종 아이콘의 배지 하나를 위한 아주 작은 저장소다.
 *
 * Context를 늘리지 않은 것은 이것이 세션처럼 화면 전체가 읽는 값이 아니라, 사이드바의
 * 배지와 알림 화면 둘만 쓰는 숫자여서다. 알림을 읽으면 배지가 그 자리에서 내려가야 하므로
 * 두 곳이 같은 값을 봐야 하고, 그 정도는 구독 하나로 끝난다.
 *
 * 서버가 밀어 주지 않는다(실시간 전달 없음). 부르는 쪽이 주기적으로 refreshUnread()를 한다.
 */
let count = 0;
const listeners = new Set<() => void>();

function emit() { for (const listener of listeners) listener(); }

/** 다시 세어 온다. 실패하면 있던 숫자를 그대로 둔다 — 배지가 깜빡이는 편이 더 나쁘다. */
export async function refreshUnread() {
  try {
    const { count: next } = await api<{ count: number }>("/api/v1/notifications/unread-count");
    if (next !== count) { count = next; emit(); }
  } catch { /* 그대로 둔다 */ }
}

/** 화면이 이미 아는 결과를 먼저 반영한다. 읽음 처리 응답은 204라 숫자를 주지 않는다. */
export function setUnread(next: number) {
  const value = Math.max(0, next);
  if (value !== count) { count = value; emit(); }
}

export function useUnread() {
  return useSyncExternalStore(
    listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    () => count,
    () => 0,
  );
}
