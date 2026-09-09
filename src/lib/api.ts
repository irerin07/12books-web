import type { ApiErrorBody, FieldError } from "./types";

/**
 * 서버가 준 에러를 그대로 들고 다니는 예외.
 *
 * 화면마다 status 숫자를 비교하는 대신 code를 본다 — 같은 400이어도 "형식이 틀렸다"와
 * "검색 결과를 그대로 보내지 않았다"는 사용자에게 다른 말을 해야 한다.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? "요청을 처리하지 못했습니다.");
    this.status = status;
    this.code = body?.code ?? "UNKNOWN";
    this.fieldErrors = body?.fieldErrors ?? [];
  }

  /** 특정 입력칸에 붙일 메시지. 없으면 null. */
  reasonFor(field: string): string | null {
    return this.fieldErrors.find((e) => e.field === field)?.reason ?? null;
  }
}

/**
 * access 토큰은 메모리에만 둔다.
 *
 * localStorage에 두면 XSS 한 번에 통째로 새고, 새로고침으로 잃는 대신 refresh 쿠키가
 * 곧바로 되살려준다(아래 ensureSession). 쿠키는 HttpOnly라 이 코드가 읽을 수 없고,
 * 그게 의도다.
 */
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type Options = {
  method?: string;
  body?: unknown;
  /** 인증이 필요 없는 요청(로그인·가입·재발급)은 재시도 고리에 넣지 않는다. */
  anonymous?: boolean;
};

async function once(path: string, options: Options): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (!options.anonymous && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(path, {
    method: options.method ?? "GET",
    headers,
    credentials: "same-origin",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
}

/**
 * 한 번 부르고, 401이면 재발급해서 딱 한 번 더 시도한다.
 *
 * access 토큰이 10분이라 화면을 열어둔 채 잠시 자리를 비우면 반드시 만나는 상황이다.
 * 여기서 조용히 이어주지 않으면 사용자는 아무 이유 없이 로그아웃된 것처럼 느낀다.
 * 재발급까지 실패하면 그때는 진짜로 세션이 끝난 것이므로 401을 그대로 올려보낸다.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  let response = await once(path, options);

  if (response.status === 401 && !options.anonymous) {
    const reissued = await reissue();
    if (reissued) response = await once(path, options);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) throw new ApiError(response.status, payload);
  return payload as T;
}

/** 성공하면 새 access 토큰을 들여놓는다. */
export async function reissue(): Promise<boolean> {
  const response = await fetch("/api/v1/auth/reissue", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!response.ok) {
    accessToken = null;
    return false;
  }
  const body = (await response.json()) as { accessToken: string };
  accessToken = body.accessToken;
  return true;
}
