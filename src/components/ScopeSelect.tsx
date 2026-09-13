"use client";
import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * 검색 범위 고르개.
 *
 * native select를 쓰지 않는다. 열린 목록을 브라우저가 OS 위젯으로 그려서 CSS가 닿지 않고,
 * 윈도우에서는 각진 회색 목록이 화면 위에 겹쳐 떴다. 직접 짜면 목록까지 우리 것이 된다.
 *
 * 대신 native가 공짜로 주던 것을 다시 만들어야 한다 — 키보드 이동, 바깥 클릭 닫기,
 * 닫을 때 초점 되돌리기, 화면 낭독기가 읽을 역할. 아래가 그것들이다.
 */
export default function ScopeSelect<T extends string>({ value, options, onChange, label }: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (next: T) => void;
  /** 화면에 글자로 적지 않는 이름. 낭독기가 무엇을 고르는 자리인지 말해 준다. */
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const current = options.find(option => option.value === value) ?? options[0];

  /* 바깥을 누르면 닫는다. click이 아니라 pointerdown이라야 누르는 순간 닫힌다. */
  useEffect(() => {
    if (!open) return;
    function down(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [open]);

  /* 열리면 지금 고른 항목에 초점을 준다 — 어디서부터 움직이는지가 분명해야 한다. */
  useEffect(() => {
    if (!open) return;
    const selected = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    (selected ?? list.current?.querySelector<HTMLElement>('[role="option"]'))?.focus();
  }, [open]);

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function pick(next: T) {
    onChange(next);
    close();
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => { event.preventDefault(); items[to]?.focus(); };

    if (event.key === "Escape") { event.preventDefault(); close(); }
    else if (event.key === "ArrowDown") move(Math.min(index + 1, items.length - 1));
    else if (event.key === "ArrowUp") move(Math.max(index - 1, 0));
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(items.length - 1);
    else if (event.key === "Tab") close(false);
  }

  return <div className="scope-select" ref={root}>
    <button ref={trigger} type="button" className="scope-trigger"
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-label={`${label}: ${current.label}`}
      onClick={() => setOpen(value => !value)}
      onKeyDown={event => {
        // 닫힌 채로 아래 화살표를 누르면 바로 열린다. native select와 같은 버릇이다.
        if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); }
      }}>
      <span>{current.label}</span>
      <Icon name="chevron" className={`h-3 w-3 shrink-0 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
    </button>

    {open && <ul ref={list} id={listId} role="listbox" aria-label={label}
      className="scope-list" onKeyDown={onListKeyDown}>
      {options.map(option => <li key={option.value}>
        <button type="button" role="option" tabIndex={-1}
          aria-selected={option.value === value}
          className="scope-option"
          onClick={() => pick(option.value)}
          onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(option.value); } }}>
          {option.label}
        </button>
      </li>)}
    </ul>}
  </div>;
}
