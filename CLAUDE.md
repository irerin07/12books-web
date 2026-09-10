# 12books-web

[12books](https://github.com/irerin07/12books) 백엔드의 웹 클라이언트. Next.js.

백엔드 저장소의 `spec.md`(제품 요구사항)와 `plan.md`(Phase 로드맵)가 이 앱이 무엇을 보여줄지
결정한다. **API에 없는 화면은 만들지 않는다** — 없는 것을 목업으로 채우면 나중에 진짜 API로
바꾸는 일이 통째로 남는다.

## 환경

Windows / PowerShell. Node 24, npm.

```powershell
npm run dev        # http://localhost:3000
npm run verify     # 린트 + 타입 검사 + 빌드 (CI가 도는 것과 같다)
```

**백엔드가 :8080에 떠 있어야 화면이 채워진다.** `next.config.ts`의 rewrites가 `/api/*`를
그쪽으로 넘긴다. 다른 주소면 `BACKEND_ORIGIN` 환경변수로 바꾼다.

## 불변 규칙

백엔드 저장소와 같은 네 가지다. 훅과 GitHub ruleset이 실제로 강제한다.

### 1. main에 직접 쓰지 않는다

모든 변경은 브랜치에서 시작한다. 브랜치명은 `feat/…`, `fix/…`, `chore/…`.
기능 하나를 시작할 때는 `/feature <설명>`을 쓴다.

### 2. 커밋 메시지에 트레일러를 붙이지 않는다

한국어 본문만 쓴다. `Co-Authored-By`, `Claude-Session`, `Generated with` 같은 줄을 넣지 않는다.
제목은 `feat|fix|chore|refactor|test|docs: 요약`. 본문은 **무엇이 아니라 왜**를 쓴다.

### 3. 승인 없이 머지되지 않는다

`build`와 `review-gate` 둘 다 초록이어야 머지된다. `review-gate`는 사용자가 PR에
`/approve <head 커밋 SHA>` 코멘트를 남겨야 초록이 된다. 새 커밋을 push하면 다시 잠긴다.

### 4. 서버가 정한 계약을 화면이 다시 정하지 않는다

에러 메시지·검증 규칙·기본값은 백엔드가 소유한다. 화면은 서버가 준 `code`를 보고 사람이 읽을
말로 옮길 뿐, 자기만의 규칙을 새로 만들지 않는다. 예를 들어 비밀번호 길이를 여기서 다시 검사해
서버와 어긋나면, 서버가 규칙을 바꿀 때 조용히 틀린 안내가 남는다.

## 코드 규약

**API 호출은 `src/lib/api.ts`를 지난다.** `fetch`를 화면에서 직접 부르지 않는다. 401이면
refresh 쿠키로 재발급하고 한 번 재시도하는 로직이 거기 한 곳에만 있어야 한다.

**access 토큰은 메모리에만 둔다.** `localStorage`에 넣지 않는다 — XSS 한 번에 통째로 샌다.
새로고침으로 잃는 것은 refresh 쿠키가 되살린다.

**에러는 `code`로 갈라 말한다.** 상태 코드 숫자만 보고 "실패했습니다"로 뭉치지 않는다.
같은 400이어도 `C001`(입력 형식)과 `B002`(검색 결과를 그대로 보내지 않음)는 사용자가 할 일이
다르다. `ApiError.reasonFor(field)`로 입력칸 옆에 붙일 말을 꺼낸다.

**서버 타입은 `src/lib/types.ts`에 모은다.** 백엔드 DTO와 1:1로 맞추고, 화면에서 임의로
필드를 지어내지 않는다.

**표지가 주인공이다.** 색은 파랑 하나만 쓰고, 숫자와 배지는 표지보다 작게 둔다. 진행률을 크게
띄우고 싶은 유혹이 있는데, 이 제품이 자랑스러워야 할 것은 책이지 달성률이 아니다
(`spec.md`의 "서재는 자랑스러워야 한다").

## 디자인 기준

인스타그램의 골격을 참고한다 — 데스크톱 좌측 아이콘 사이드바, 모바일 상단바 + 하단 탭,
935px 중앙 정렬, 아주 옅은 경계선, 프로필의 "아바타 + 숫자 줄 + 격자".

다만 사진이 아니라 **표지(2:3)** 를 다루므로 격자 비율과 카드 구성이 다르다. 인스타를 그대로
베끼는 것이 목표가 아니라, 이미지가 주인공인 화면에서 검증된 배치를 빌리는 것이다.

## 하지 않는 것

- **API에 없는 화면.** 피드·좋아요·댓글·팔로우는 백엔드 Phase 4~6에서 생긴다. 그때 만든다.
- **목업 데이터.** 화면을 미리 보려고 가짜 데이터를 넣지 않는다.
- **상태 관리 라이브러리.** 지금 필요한 공유 상태는 세션 하나뿐이라 Context로 충분하다.
  서버 상태 캐싱이 실제로 아쉬워질 때 다시 본다.
- 요청받지 않은 최적화·문서·리팩터링.

## 최초 1회 세팅

```powershell
npm install
git config core.hooksPath .githooks   # main 직접 push 차단
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
