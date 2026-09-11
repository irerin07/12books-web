"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { Button } from "./ui";

/* 서버가 받는 길이(UpdateProfileRequest). 넘기면 C001로 돌아온다. */
const MAX = { displayName: 50, bio: 200, avatarUrl: 500 };

/**
 * 프로필 수정.
 *
 * handle과 email은 받지 않는다 — 서버가 애초에 그 필드를 받지 않으므로 화면에도 칸이 없다.
 * 바꿀 수 없는 것을 회색으로 띄워 두면 "왜 안 바뀌지"를 한 번 겪게 된다.
 *
 * 빈 칸은 "지움"으로 보낸다. 소개를 지우려는 사람에게 다른 길이 없기 때문이다. 다만 이름은
 * 공백만으로 둘 수 없어(서버 규칙) 비우면 보내지 않는다 — 지우려는 게 아니라 실수에 가깝다.
 */
export default function ProfileEditSheet({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [onClose]);

  async function save() {
    setBusy(true); setError(null);
    try {
      onSaved(await api<Profile>("/api/v1/me", {
        method: "PATCH",
        body: {
          // 이름만은 비우면 보내지 않는다. 서버가 공백만을 거부하므로 실수로 지운 것에 가깝다.
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
          bio: bio.trim(),
          avatarUrl: avatarUrl.trim(),
        },
      }));
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e : "프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  const reason = (field: string) => (error instanceof ApiError ? error.reasonFor(field) : null);

  return <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
    <button aria-label="닫기" onClick={onClose} className="absolute inset-0 animate-[fade-in_0.25s_ease] bg-black/40 backdrop-blur-[2px]" />

    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="relative max-h-[92dvh] w-full animate-[sheet-in_0.4s_var(--ease-spring)] overflow-y-auto rounded-t-3xl bg-surface pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sheet outline-none sm:max-w-[440px] sm:rounded-3xl sm:pb-6">
      <div className="sticky top-0 z-10 flex justify-center bg-surface pb-1 pt-2.5 sm:hidden">
        <span className="h-[5px] w-9 rounded-full bg-fill-strong" />
      </div>

      <div className="px-5 pt-3 sm:pt-6">
        <h2 id={titleId} className="text-headline">프로필 수정</h2>
        {/* 바꿀 수 없는 것은 칸이 아니라 설명으로 둔다. */}
        <p className="mt-1.5 text-foot text-muted">@{profile.handle}</p>

        <label className="mt-6 block">
          <span className="mb-2 ml-0.5 block text-foot font-medium text-muted">이름</span>
          <input value={displayName} onChange={e => setDisplayName(e.target.value)}
            maxLength={MAX.displayName} className="field" aria-label="이름" />
          {reason("displayName") && <p className="mt-1.5 text-foot text-danger">{reason("displayName")}</p>}
        </label>

        <label className="mt-5 block">
          <span className="mb-2 ml-0.5 block text-foot font-medium text-muted">소개</span>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
            maxLength={MAX.bio} placeholder="어떤 책을 좋아하는지 한두 줄로" className="field resize-y" aria-label="소개" />
          <span className="mt-1 block text-right text-cap tabular-nums text-faint">{bio.length} / {MAX.bio}</span>
          {reason("bio") && <p className="text-foot text-danger">{reason("bio")}</p>}
        </label>

        <label className="mt-3 block">
          <span className="mb-2 ml-0.5 block text-foot font-medium text-muted">아바타 주소</span>
          <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} inputMode="url"
            maxLength={MAX.avatarUrl} placeholder="https://" className="field" aria-label="아바타 주소" />
          {reason("avatarUrl") && <p className="mt-1.5 text-foot text-danger">{reason("avatarUrl")}</p>}
        </label>

        {typeof error === "string" && <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-callout text-danger">{error}</p>}
        {error instanceof ApiError && error.fieldErrors.length === 0 &&
          <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-callout text-danger">{error.message}</p>}

        <div className="mt-7 flex gap-2">
          <Button variant="quiet" size="lg" className="flex-1" onClick={onClose}>그만두기</Button>
          <Button size="lg" className="flex-1" disabled={busy} onClick={() => void save()}>
            {busy ? "저장 중…" : "저장"}
          </Button>
        </div>
      </div>
    </div>
  </div>;
}
