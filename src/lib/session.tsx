"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, getAccessToken, reissue, setAccessToken } from "./api";

type Me = { userId: number; handle: string };

type Session = {
  me: Me | null;
  /** 첫 재발급 시도가 끝나기 전에는 "로그인 안 됨"과 구분해야 한다. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

/**
 * 토큰의 payload에서 나를 읽는다.
 *
 * 서명을 검증하지 않는다 — 그건 서버의 몫이고, 여기서는 화면에 이름을 띄우기 위한
 * 용도일 뿐이다. 위조된 토큰을 들고 와도 API가 401을 줄 뿐이라 얻을 게 없다.
 */
function readMe(token: string): Me | null {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(""),
      ),
    ) as { sub: string; handle: string };
    return { userId: Number(json.sub), handle: json.handle };
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  /** 새로고침하면 메모리의 access 토큰은 사라진다. 쿠키로 조용히 되살린다. */
  const refresh = useCallback(async () => {
    const ok = await reissue();
    const token = getAccessToken();
    return ok && token ? readMe(token) : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const who = await refresh();
      if (cancelled) return;
      setMe(who);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const body = await api<{ accessToken: string }>("/api/v1/auth/login", {
      method: "POST",
      body: { email, password },
      anonymous: true,
    });
    setAccessToken(body.accessToken);
    setMe(readMe(body.accessToken));
  }, []);

  /**
  * 로그아웃은 토큰을 지우는 것으로 끝나지 않는다. 화면도 떠나야 한다.
  *
  * 지우기만 하면 보고 있던 화면이 그대로 남는다 — 프로필에서 로그아웃하면 방금 나간 사람의
  * 프로필이 계속 떠 있고, 새로고침해야 비로소 사라진다. 로그인 화면이 아니라 홈으로 보내는
  * 것은 홈이 손님을 위한 소개 화면을 이미 갖고 있어서다.
  *
  * push가 아니라 replace인 것은 뒤로 가기 때문이다. 쌓아 두면 뒤로 가기 한 번에 로그인이
  * 필요한 화면으로 돌아가고, 그 화면은 401만 받는다.
  */
  const logout = useCallback(async () => {
    try {
      await api<void>("/api/v1/auth/logout", { method: "POST", anonymous: true });
    } finally {
      setAccessToken(null);
      setMe(null);
      router.replace("/");
    }
  }, [router]);

  const reload = useCallback(async () => {
    setMe(await refresh());
  }, [refresh]);

  const value = useMemo<Session>(
    () => ({ me, loading, login, logout, refresh: reload }),
    [me, loading, login, logout, reload],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider 안에서만 쓸 수 있습니다");
  return session;
}
