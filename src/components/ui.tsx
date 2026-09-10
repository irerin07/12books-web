"use client";
import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import Icon from "./Icon";

export function Button({children,variant="primary",size="md",...props}:React.ButtonHTMLAttributes<HTMLButtonElement>&{variant?:"primary"|"quiet"|"plain";size?:"md"|"lg"}) {
  const look={primary:"bg-accent text-white hover:bg-accent-hover",quiet:"border border-line bg-white text-ink hover:bg-fill",plain:"text-accent hover:bg-fill"}[variant];
  return <button {...props} className={`press inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${size==="lg"?"h-11 px-5 text-callout":"h-9 px-3.5 text-foot"} ${look} ${props.className??""}`}>{children}</button>;
}
export function LinkButton({href,children}:{href:string;children:React.ReactNode}) {
  return <Link href={href} className="press inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-accent px-4 text-foot font-semibold text-white hover:bg-accent-hover">{children}</Link>;
}
export function FieldGroup({children}:{children:React.ReactNode}) {return <div className="space-y-5">{children}</div>;}
export function Field({label,error,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string;error?:string|null}) {
  const id=useId();
  return <div><label htmlFor={id} className="mb-2 block text-foot font-semibold">{label}</label><input {...props} id={id} aria-invalid={!!error} aria-describedby={error?`${id}-error`:undefined} className={`field ${props.className??""}`} />{error&&<p id={`${id}-error`} className="mt-1.5 text-cap text-danger">{error}</p>}</div>;
}
export function Cover({src,title,className="",radius="rounded-md"}:{src:string|null;title:string;className?:string;radius?:string}) {
  const [failedSrc,setFailedSrc]=useState<string|null>(null);
  return <div className={`relative aspect-[2/3] overflow-hidden bg-[#e6eade] shadow-raise ${radius} ${className}`}>
    {src&&failedSrc!==src ? <Image src={src} alt="" fill sizes="(max-width:768px) 25vw, 160px" className="object-cover" onError={()=>setFailedSrc(src)} /> : <div className="absolute inset-0 flex flex-col justify-between border-l-[5px] border-black/10 px-3 py-4"><span className="line-clamp-4 text-[12px] font-semibold leading-relaxed text-[#59634e]">{title}</span><Icon name="book" className="h-4 w-4 text-[#859279]" /></div>}
    <span className={`pointer-events-none absolute inset-0 inset-hairline ${radius}`} />
  </div>;
}
export function Empty({title,hint,action}:{title:string;hint?:string;action?:React.ReactNode}) {
  return <div className="empty-state"><span className="empty-symbol"><Icon name="books" className="h-6 w-6" /></span><p className="text-headline">{title}</p>{hint&&<p className="mt-2 max-w-[320px] text-foot text-muted">{hint}</p>}{action&&<div className="mt-5">{action}</div>}</div>;
}
export function Spinner(){return <div className="flex items-center justify-center gap-2 py-12 text-foot text-muted" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />불러오는 중</div>;}
export function SignInWall(){return <Empty title="로그인하고 내 서재를 만나세요" hint="책을 담고 읽은 페이지를 기록할 수 있어요." action={<LinkButton href="/login">로그인</LinkButton>} />;}
export function PageTitle({children,aside}:{children:React.ReactNode;aside?:React.ReactNode}){return <header className="page-heading"><h1>{children}</h1>{aside}</header>;}
export function SectionHeader({title,href,linkLabel}:{title:string;href?:string;linkLabel?:string}){return <div className="section-heading"><h2>{title}</h2>{href&&<Link href={href} className="text-foot text-accent">{linkLabel}</Link>}</div>;}
