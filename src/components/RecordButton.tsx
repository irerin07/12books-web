"use client";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { Button } from "./ui";
import RecordSheet from "./RecordSheet";
import Icon from "./Icon";

/**
 * 피드 위에 놓는 주 행동.
 *
 * 기록하기가 사이드바 아이콘 안에만 있었다. 접혀 있을 때는 라벨도 없어서, 이 앱에서 무엇을
 * 먼저 해야 하는지 화면이 말해 주지 않았다. 읽는 화면 맨 위에 채운 버튼으로 한 번 더 둔다 —
 * 남의 기록을 읽다가 "나도 남겨야지"가 되는 자리가 여기다.
 */
export default function RecordButton() {
  const { me } = useSession();
  const [open, setOpen] = useState(false);
  if (!me) return null;

  return <>
    <Button size="md" className="shrink-0 gap-1.5" onClick={() => setOpen(true)}>
      <Icon name="pen" className="h-3.5 w-3.5" />기록하기
    </Button>
    {open && <RecordSheet onClose={() => setOpen(false)} />}
  </>;
}
