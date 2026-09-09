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
