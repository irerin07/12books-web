import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "12books",
  description: "읽은 분량만큼 기록하고 나누는 독서 기록",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-canvas text-ink">
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
