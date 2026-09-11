import Link from "next/link";
import { Brand } from "./Nav";
export default function AuthFrame({children}:{children:React.ReactNode}) {
return <div className="auth-page"><header className="auth-header"><Brand /><Link href="/">홈으로 →</Link></header><main className="auth-main"><aside className="auth-intro"><p>읽는 사이, 남는 생각.</p><h2>책을 읽고,<br />나를 남기는 곳.</h2><p>오늘 읽은 페이지의 감상을 기록하고<br />당신의 취향과 닮은 독자를 만나세요.</p><div className="auth-note">한 페이지부터, 나의 속도로.</div></aside><div className="auth-form">{children}</div></main><footer className="auth-footer">© 12books</footer></div>;
}
