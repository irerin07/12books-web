/**
 * 백엔드 응답 모양. 서버의 DTO와 1:1로 맞춘다.
 *
 * `?`와 `| null`을 구분해서 쓴다. 서버가 @JsonInclude(NON_NULL)을 붙인 DTO는 값이 없으면
 * 필드를 통째로 빼고 보내므로 `?`(undefined)이고, 붙이지 않은 DTO는 `null`이 그대로 온다.
 * 둘을 뭉뚱그리면 `=== null` 같은 비교가 조용히 빗나간다.
 *
 * NON_NULL이 붙은 것: Book · Reading · Post · UserSummary · FollowItem
 * 붙지 않은 것: Profile · BookSearchResult
 */

export type ReadingStatus =
  | "WANT_TO_READ"
  | "READING"
  | "FINISHED"
  | "PAUSED"
  | "DROPPED";

export const READING_STATUS_LABEL: Record<ReadingStatus, string> = {
  WANT_TO_READ: "읽고 싶다",
  READING: "읽는 중",
  FINISHED: "완독",
  PAUSED: "잠시 멈춤",
  DROPPED: "그만둠",
};

export type Profile = {
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  /** 보는 사람이 이 사람을 팔로우 중인지. 내 프로필에서는 항상 false다. */
  isFollowing: boolean;
};

/**
 * 팔로워·팔로잉 목록의 한 줄. 백엔드 FollowItemResponse와 1:1이다.
 *
 * UserSummary와 필드가 겹치지만 따로 두는 이유는 서버가 나눠 둔 이유와 같다 — 피드의
 * 작성자에는 이 관계가 계산되지 않으므로, 그 자리에 isFollowing이 있으면 거짓말이 된다.
 */
export type FollowItem = {
  handle: string;
  displayName: string;
  avatarUrl?: string;
  isFollowing: boolean;
};

export type BookSearchResult = {
  isbn13: string | null;
  title: string;
  authors: string;
  publisher: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  /** 서버가 붙인 서명. 등록할 때 그대로 되돌려보내야 한다. */
  signature: string;
};

/**
 * 검색 결과 한 페이지. 백엔드 BookSearchPage와 1:1이다.
 *
 * 내부 목록의 CursorPage와 items·hasNext 이름이 같지만 커서가 아니라 쪽번호다 —
 * 원본(카카오)이 쪽번호로 넘기기 때문이고, 서버가 커서를 지어내지 않기로 한 결과다.
 */
export type BookSearchPage = {
  items: BookSearchResult[];
  page: number;
  hasNext: boolean;
  /** 카카오가 알려준 전체 결과 수. 모르면 0이다. */
  totalCount: number;
};

export type Book = {
  id: number;
  isbn13?: string;
  title: string;
  authors: string;
  publisher?: string;
  thumbnailUrl?: string;
  /** 2017-05-10 모양. 모르면 아예 오지 않는다. */
  publishedAt?: string;
};

export type Reading = {
  id: number;
  bookId: number;
  status: ReadingStatus;
  /** 0은 "아직 안 읽음"이다. 모르는 값이 아니라 진짜 0이라 항상 실려 온다. */
  currentPage: number;
  pageCount?: number;
  startedAt?: string;
  finishedAt?: string;
  rating?: number;
};

export type LibraryItem = {
  reading: Reading;
  book: Book;
};

/** 감상평에 달린 댓글 한 건. 백엔드 CommentResponse와 1:1이다. 대댓글은 없다. */
export type Comment = {
  id: number;
  author: UserSummary;
  content: string;
  createdAt: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: number | null;
  hasNext: boolean;
};

export type Goal = {
  year: number;
  targetCount: number;
  finishedCount: number;
};

export type FieldError = { field: string; reason: string };

/** 서버의 에러 계약: { code, message, fieldErrors } */
export type ApiErrorBody = {
  code: string;
  message: string;
  fieldErrors: FieldError[];
};

/** 목록에 함께 실리는 최소한의 사람 정보. 백엔드 UserSummaryResponse와 1:1이다. */
export type UserSummary = {
  handle: string;
  displayName: string;
  avatarUrl?: string;
};

/**
 * 감상평 한 건. 백엔드 PostResponse와 1:1이다.
 *
 * likeCount·commentCount는 지금도 실려 오지만 누를 곳은 아직 없다 — 좋아요와 댓글은
 * 백엔드 Phase 6에서 생긴다. 숫자만 보여주고 버튼은 그때 만든다.
 */
export type Post = {
  id: number;
  author: UserSummary;
  book: Book;
  readingId?: number;
  content: string;
  fromPage?: number;
  toPage?: number;
  spoiler: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  /**
   * 보는 사람이 이 글에 좋아요를 눌렀는지. 하트의 처음 상태를 그대로 쓴다.
   *
   * 감상평이 실리는 모든 응답에 들어 있다 — 목록·단건·책별·사람별 어디서도 빠지지 않으므로
   * 화면마다 다르게 다룰 필요가 없다.
   */
  likedByMe: boolean;
};
