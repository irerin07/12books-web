/** 백엔드 응답 모양. 서버의 DTO와 1:1로 맞춘다. */

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
  avatarUrl: string | null;
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
  isbn13: string | null;
  title: string;
  authors: string;
  publisher: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
};

export type Reading = {
  id: number;
  bookId: number;
  status: ReadingStatus;
  currentPage: number;
  pageCount: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  rating: number | null;
};

export type LibraryItem = {
  reading: Reading;
  book: Book;
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
  avatarUrl: string | null;
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
  readingId: number | null;
  content: string;
  fromPage: number | null;
  toPage: number | null;
  spoiler: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  /**
   * 보는 사람이 이 글의 작성자를 팔로우 중인지. 홈 피드에만 실린다.
   *
   * 없을 수 있다(`?`)는 것이 핵심이다. 책별·사람별 목록에서는 서버가 이 관계를 계산하지
   * 않아 응답에서 아예 빠진다 — 그 자리에서 undefined를 false로 읽으면 "팔로우 안 한 사람"
   * 이라고 잘못 말하게 된다.
   */
  followingAuthor?: boolean;
};
