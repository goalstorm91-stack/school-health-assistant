import type { Metadata } from "next";
import "./globals.css";
import "./health.css";
import "./typography.css";

export const metadata: Metadata = {
  title: "보건교사 업무 비서",
  description: "초등학교 보건교사를 위한 업무 공간",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head><link rel="preload" href="/fonts/PretendardVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

