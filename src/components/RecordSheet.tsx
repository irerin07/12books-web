"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { CursorPage, LibraryItem } from "@/lib/types";
import { Button, Cover, Empty, LinkButton, Spinner } from "./ui";
import PostComposer from "./PostComposer";

/**
 * 기록하기. 읽는 중인 책을 고르면 그 자리에서 감상평을 쓴다.
 *
 * "내 서재"와 같은 곳으로 보내면 두 메뉴가 같은 일을 한다. 서재는 무엇을 갖고 있는지 보는
 * 자리이고, 여기는 지금 읽던 책에 한 줄 남기는 자리다 — 서재를 열고 표지를 찾아 누르는
 * 두 걸음을 없애는 것이 이 시트의 전부다.
 *
 * 읽는 중인 책만 보여준다. "읽고 싶다"에 담아 둔 책에 오늘 읽은 생각을 남길 일은 드물고,
 * 목록이 길어지면 고르는 일이 다시 일이 된다.
 */
export default function RecordSheet({ onClose }: { onClose: () => void }) {
  const { me } = useSession();
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState<LibraryItem | null>(null);

  useEffect(() => {
    if (!me) return;
    let active = true;
    void api<CursorPage<LibraryItem>>(`/api/v1/users/${me.handle}/library?status=READING&size=20`)
      .then(page => { if (active) setItems(page.items); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [me]);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function keydown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); };
  }, [onClose]);

  return <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
    <button aria-label="닫기" onClick={onClose} className="absolute inset-0 animate-[fade-in_0.25s_ease] bg-black/40 backdrop-blur-[2px]" />

    <div role="dialog" aria-modal="true" aria-label="기록하기"
      className="relative max-h-[88dvh] w-full animate-[sheet-in_0.4s_var(--ease-spring)] overflow-y-auto rounded-t-xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet sm:max-w-[440px] sm:rounded-xl sm:pb-5">
      {picked ? <>
        <button onClick={() => setPicked(null)} className="text-foot text-muted hover:text-ink">← 다른 책 고르기</button>
        <div className="mt-4 flex items-center gap-3">
          <Cover src={picked.book.thumbnailUrl} title={picked.book.title} className="w-[44px] shrink-0" radius="rounded-sm" />
          <div className="min-w-0">
            <p className="text-headline">{picked.book.title}</p>
            <p className="mt-0.5 text-foot text-muted">{picked.reading.currentPage}쪽까지 읽었어요</p>
          </div>
        </div>
        <PostComposer book={picked.book} currentPage={picked.reading.currentPage} startOpen />
      </> : <>
        <h2 className="text-headline">어떤 책을 읽으셨나요</h2>
        <p className="mt-1.5 text-foot text-muted">읽는 중인 책에 바로 기록할 수 있어요.</p>

        {error ? <Empty title="책을 불러오지 못했어요" hint="잠시 후 다시 시도해 주세요." />
          : items === null ? <Spinner />
          : items.length === 0 ? <Empty title="읽는 중인 책이 없어요"
              hint="서재의 책을 ‘읽는 중’으로 바꾸면 여기에 나타나요."
              action={<LinkButton href="/library">내 서재 열기</LinkButton>} />
          : <ul className="mt-4 space-y-1">{items.map(item => <li key={item.reading.id}>
              <button onClick={() => setPicked(item)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-fill">
                <Cover src={item.book.thumbnailUrl} title={item.book.title} className="w-[40px] shrink-0" radius="rounded-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-foot font-semibold">{item.book.title}</span>
                  <span className="block truncate text-cap text-muted">
                    {item.reading.currentPage}{item.reading.pageCount ? ` / ${item.reading.pageCount}` : ""}쪽
                  </span>
                </span>
              </button>
            </li>)}</ul>}

        <Button variant="quiet" className="mt-6 w-full" onClick={onClose}>닫기</Button>
      </>}
    </div>
  </div>;
}
