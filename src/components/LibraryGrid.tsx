"use client";
import { Cover } from "./ui";
import { READING_STATUS_LABEL, type LibraryItem } from "@/lib/types";
export default function LibraryGrid({items,onSelect}:{items:LibraryItem[];onSelect?:(item:LibraryItem)=>void}) {
  return <ul className="shelf-grid">{items.map(item=>{
    const {reading,book}=item;
    const ratio=reading.pageCount?Math.min(100,Math.max(0,reading.currentPage/reading.pageCount*100)):null;
    const content=<><div className="shelf-book-stage"><Cover src={book.thumbnailUrl} title={book.title} /></div><div className="pt-3"><h3 className="line-clamp-2 text-callout font-semibold">{book.title}</h3><p className="mt-1 truncate text-cap text-muted">{book.authors}</p><div className="mt-2.5 flex flex-wrap items-center justify-between gap-1"><span className="status-tag" data-reading={reading.status==="READING"}>{READING_STATUS_LABEL[reading.status]}</span>{reading.status==="READING"&&<span className="text-[11px] tabular-nums text-muted">{reading.currentPage}쪽</span>}</div>{ratio!==null&&reading.status==="READING"&&<div className="mt-2.5 h-[3px] overflow-hidden rounded-full bg-fill"><div className="h-full rounded-full bg-accent" style={{width:`${ratio}%`}} /></div>}</div></>;
    return <li key={reading.id}>{onSelect?<button onClick={()=>onSelect(item)} className="block w-full text-left" aria-label={`${book.title} 읽기 기록 열기`}>{content}</button>:content}</li>;
  })}</ul>;
}
