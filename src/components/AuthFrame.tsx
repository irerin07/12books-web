import Link from "next/link";
import { Brand } from "./Nav";
import BookArt from "./BookArt";
export default function AuthFrame({children}:{children:React.ReactNode}) {
  return <div className="auth-layout"><aside className="auth-story"><Brand /><div><BookArt /><h2>책 한 권에서 시작하는<br />나의 독서 생활.</h2><p className="mt-4 text-callout leading-7 text-muted">읽고 싶은 책을 모으고,<br />오늘 읽은 페이지를 기록하세요.</p></div><p className="text-cap text-muted">© 12books</p></aside><div className="flex min-h-dvh items-center justify-center px-6 py-12"><div className="w-full max-w-[360px]"><Link href="/" className="mb-8 inline-block text-foot text-muted">← 홈으로</Link>{children}</div></div></div>;
}
