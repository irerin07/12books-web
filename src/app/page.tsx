"use client";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { Empty, LinkButton } from "@/components/ui";
import Icon from "@/components/Icon";
import BookArt from "@/components/BookArt";
import ContextRail from "@/components/ContextRail";
import Feed from "@/components/Feed";

export default function HomePage() {
  const { me } = useSession();
  if (!me) return <div className="content-columns"><div className="min-w-0">
    <section className="welcome-banner"><div><span className="mb-3 inline-block text-cap font-semibold text-accent">나의 독서 생활, 12books</span><h1>읽고 있는 책과<br />조금 더 가까이.</h1><p className="mt-4">읽고 싶은 책을 모으고,<br />오늘 읽은 페이지를 남겨 보세요.</p><Link href="/signup" className="mt-6 inline-flex items-center gap-4 rounded-lg bg-accent px-5 py-3 text-callout font-semibold text-white">내 서재 시작하기<Icon name="arrow" className="h-4 w-4" /></Link></div><BookArt /></section>
    <section className="mt-8"><div className="section-heading"><h2>한 권으로 시작하는 독서 기록</h2><Link href="/search" className="text-foot text-accent">책 찾아보기 →</Link></div>{[{title:"읽고 싶은 책을 발견하세요",text:"제목, 작가, 관심 있는 분야로 책을 찾을 수 있어요."},{title:"지금 읽는 책을 서재에 놓으세요",text:"읽고 싶은 책부터 다 읽은 책까지, 상태별로 정리해요."},{title:"오늘 읽은 페이지를 남기세요",text:"완독을 기다릴 필요 없이, 지금 읽은 만큼 기록하세요."}].map((step,i)=><div className="step-row" key={step.title}><span className="step-number">{i+1}</span><div><h3 className="text-headline">{step.title}</h3><p className="mt-1.5 text-foot text-muted">{step.text}</p></div></div>)}</section>
    {/*
      탐색 피드도 인증이 필요하다(SecurityConfig는 /auth/**만 연다). 그래서 손님에게는
      남의 감상평을 보여줄 수 없고, 대신 무엇이 기다리는지만 말한다 — 지어낸 예시를 놓으면
      가입한 순간 방금 본 글들이 사라진다.
    */}
    <div className="mt-7 flex items-center gap-3 rounded-lg bg-fill px-4 py-3"><Icon name="book" className="h-4 w-4 shrink-0 text-accent" /><p className="text-foot text-muted">가입하면 다른 사람들의 감상평을 읽고, 마음에 드는 사람을 팔로우할 수 있어요.</p></div>
  </div><ContextRail /></div>;
  return <>
    <header className="page-heading"><div><h1>홈</h1><p>팔로우한 사람들의 감상평과, 아직 모르는 사람들의 기록.</p></div><LinkButton href="/library"><Icon name="pen" className="mr-1.5 h-4 w-4" />기록 남기기</LinkButton></header>
    <div className="content-columns"><div className="min-w-0">
      {/*
        홈은 피드 하나만 한다. 읽는 책은 서재로 갔다 — 성격이 다른 것을 한 화면에 쌓으면
        어느 것도 제대로 읽히지 않는다.

        서버가 팔로잉 글과 아닌 글을 섞어 주므로 팔로우가 0명이어도 비지 않는다.
        다만 내 글은 여기 없다. 내가 쓴 것은 내 프로필에서 본다.
      */}
      <Feed key="home" path="/api/v1/feed" empty={<Empty
        title="아직 남겨진 감상평이 없어요"
        hint="첫 기록을 남기는 사람이 되어 보세요."
        action={<LinkButton href="/library">기록 남기기</LinkButton>} />} />
    </div><ContextRail /></div>
  </>;
}
