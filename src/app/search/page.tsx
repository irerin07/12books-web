"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Book, BookSearchResult, Reading } from "@/lib/types";
import { Button, Cover, Empty, SignInWall, Spinner } from "@/components/ui";

export default function SearchPage() {
  const router = useRouter();
  const { me, loading } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shelving, setShelving] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      setResults(
        await api<BookSearchResult[]>(`/api/v1/books/search?q=${encodeURIComponent(query.trim())}`),
      );
    } catch (e) {
      // 카카오가 죽으면 502가 온다. 사용자가 고칠 수 있는 일이 아니므로 그대로 말해준다.
      setError(
        e instanceof ApiError && e.code === "E001"
          ? "책 검색 서비스를 지금 이용할 수 없습니다. 잠시 뒤 다시 시도해 주세요."
          : "검색하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  /**
   * 담기는 두 걸음이다 — 책을 내부에 확정하고(POST /books), 그 id로 서재에 넣는다.
   * 검색 결과를 그대로 되돌려보내야 하므로 signature까지 통째로 보낸다.
   */
  async function shelve(item: BookSearchResult) {
    const key = item.isbn13 ?? item.title;
    setShelving(key);
    setError(null);
    try {
      const book = await api<Book>("/api/v1/books", { method: "POST", body: item });
      await api<Reading>("/api/v1/readings", {
        method: "POST",
        body: { bookId: book.id, status: "WANT_TO_READ" },
      });
      router.push("/library");
    } catch (e) {
      setError(
        e instanceof ApiError && e.code === "R002"
          ? "이미 서재에 있는 책입니다."
          : "서재에 담지 못했습니다.",
      );
    } finally {
      setShelving(null);
    }
  }

  if (loading) return null;
  if (!me) return <SignInWall />;

  return (
    <div>
      <form onSubmit={search} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="제목, 저자로 검색"
          className="w-full rounded-lg border border-line bg-transparent px-4 py-2 text-sm outline-none focus:border-ink/40"
        />
        <Button type="submit" disabled={busy}>
          검색
        </Button>
      </form>

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {busy ? <Spinner /> : null}

      {results && results.length === 0 && !busy ? (
        <Empty title="결과가 없습니다" hint="다른 검색어로 찾아보세요." />
      ) : null}

      <ul className="divide-y divide-line">
        {results?.map((item) => {
          const key = item.isbn13 ?? item.title;
          return (
            <li key={key} className="flex items-center gap-3 py-3">
              <Cover src={item.thumbnailUrl} title={item.title} className="w-12 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted">
                  {[item.authors, item.publisher].filter(Boolean).join(" · ")}
                </p>
              </div>
              <Button
                variant="quiet"
                disabled={shelving === key}
                onClick={() => void shelve(item)}
              >
                {shelving === key ? "담는 중…" : "담기"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
