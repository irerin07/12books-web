"use client";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { Empty, LinkButton } from "@/components/ui";
import Icon from "@/components/Icon";

import FeedHeader from "@/components/FeedHeader";
import Feed from "@/components/Feed";

export default function HomePage() {
  const { me } = useSession();
  if (!me) return <div className="guest-home">
    <header className="guest-top"><span>책을 읽는 사람들의 공간</span><Link href="/login">로그인 <Icon name="arrow" className="h-4 w-4" /></Link></header>
    <section className="guest-intro">
      <p className="guest-eyebrow">읽는 사이, 남는 생각.</p>
      <h1>다 읽지 않아도,<br />이야기는 시작됩니다.</h1>
      <p className="guest-description">오늘 읽은 몇 페이지, 마음에 남은 두세 문장.<br />책을 읽는 순간을 기록하고, 다른 독자와 나누세요.</p>
      <div className="guest-actions"><LinkButton href="/signup">12books 시작하기</LinkButton><Link href="/search">책 둘러보기 <Icon name="arrow" className="h-4 w-4" /></Link></div>
    </section>
    <section className="guest-features" aria-label="12books에서 할 수 있는 일">
      {[{title:"읽은 만큼 기록하기",text:"47쪽부터 92쪽까지. 완독을 기다리지 않고 지금의 감상을 남겨요."},{title:"책으로 연결되기",text:"같은 책을 읽는 사람을 발견하고, 마음에 드는 독자를 팔로우해요."},{title:"취향이 쌓이는 서재",text:"읽고 싶은 책과 읽어 온 책을 모아 나만의 서재를 만들어요."}].map((item,i)=><div key={item.title}><span className="guest-index">0{i+1}</span><h2>{item.title}</h2><p>{item.text}</p></div>)}
    </section>
    <footer className="guest-footer">한 페이지부터, 나의 속도로.</footer>
  </div>;
  return <>
    <div className="content-columns">
      <FeedHeader active="home" />
      <div className="min-w-0">
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
    </div></div>
  </>;
}
