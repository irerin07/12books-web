"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "./api";

/**
 * 429를 받은 뒤 버튼을 잠가 두는 시간.
 *
 * 서버가 Retry-After로 "몇 초 뒤에 오라"고 알려주므로 화면이 할 일은 그동안 못 누르게 하고
 * 남은 시간을 보여주는 것뿐이다. 자동으로 다시 부르지 않는다 — 곧장 되부르면 또 429다.
 *
 * 사람이 손으로 누르는 속도로는 닿지 않는 한도(가장 빡빡한 것이 분당 30개)라서, 여기에
 * 걸리는 것은 대개 뭔가 잘못 돌고 있다는 신호다. 그때 조용히 재시도하면 신호마저 지운다.
 */
export function useCooldown() {
  const [left, setLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const start = useCallback((seconds: number) => {
    setLeft(seconds);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setLeft(value => {
        if (value <= 1 && timer.current) { clearInterval(timer.current); timer.current = null; }
        return Math.max(0, value - 1);
      });
    }, 1000);
  }, []);

  /**
   * 429였으면 잠그고 true를 준다. 부르는 쪽은 이 한 줄로 끝낸다:
   *
   *   catch (e) { if (cooldown.take(e)) return; …평소의 오류 처리… }
   */
  const take = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || !error.rateLimited) return false;
    start(error.retryAfter);
    return true;
  }, [start]);

  return { left, take, locked: left > 0 };
}
