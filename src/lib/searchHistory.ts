/**
 * 최근 검색어 보관.
 *
 * 계정마다 다른 칸에 담는다. 열쇠 하나에 몰아 담으면 같은 탭에서 계정을 바꿨을 때 앞사람이
 * 무엇을 찾았는지 뒷사람이 그대로 본다 — 검색어는 무슨 책에 관심이 있는지, 때로는 어떤 처지에
 * 있는지까지 드러내는 기록이다.
 *
 * 칸을 나누는 것만으로는 부족해서 로그아웃할 때 지우기까지 한다. 나눠 두면 남의 눈에 띄지는
 * 않지만, 브라우저에는 여전히 남아 있다.
 *
 * sessionStorage인 것은 그대로 둔다. 탭을 닫으면 사라지는 편이 이 기록의 수명에 맞다.
 */
const PREFIX = "12books-searches";
const CHANGED = "12books-search-change";

/** 보관할 최대 개수. 서버가 정하는 값이 아니라 이 화면이 보여줄 줄 수다. */
export const HISTORY_SIZE = 5;

function keyFor(handle: string) {
  return `${PREFIX}:${handle}`;
}

export function subscribeHistory(callback: () => void) {
  window.addEventListener(CHANGED, callback);
  return () => window.removeEventListener(CHANGED, callback);
}

/**
 * 담긴 그대로의 문자열을 준다. useSyncExternalStore의 스냅숏이라 값이 같으면 같은 문자열이어야
 * 하는데, 여기서 배열로 풀면 매번 새 객체가 되어 무한히 다시 그린다.
 */
export function readHistory(handle: string | null) {
  if (!handle) return "[]";
  try { return sessionStorage.getItem(keyFor(handle)) ?? "[]"; } catch { return "[]"; }
}

export function parseHistory(raw: string): string[] {
  try {
    const saved: unknown = JSON.parse(raw);
    return Array.isArray(saved) ? saved.filter((q): q is string => typeof q === "string").slice(0, HISTORY_SIZE) : [];
  } catch { return []; }
}

export function writeHistory(handle: string | null, values: string[]) {
  if (!handle) return;
  try {
    sessionStorage.setItem(keyFor(handle), JSON.stringify(values.slice(0, HISTORY_SIZE)));
    window.dispatchEvent(new Event(CHANGED));
  } catch { /* 기록은 곁다리다. 못 담아도 검색은 되어야 한다. */ }
}

/** 방금 친 검색어를 맨 앞으로. 같은 말을 두 줄 차지하게 두지 않는다. */
export function rememberSearch(handle: string | null, term: string) {
  if (!handle) return;
  const previous = parseHistory(readHistory(handle)).filter(q => q !== term);
  writeHistory(handle, [term, ...previous]);
}

/** 로그아웃이 지우고 간다. 누가 무엇을 찾았는지가 브라우저에 남지 않게. */
export function clearAllHistory() {
  try {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith(PREFIX));
    keys.forEach(key => sessionStorage.removeItem(key));
    window.dispatchEvent(new Event(CHANGED));
  } catch { /* 지울 수 없으면 그만이다. 로그아웃 자체를 막을 일은 아니다. */ }
}
