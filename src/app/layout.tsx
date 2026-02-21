import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "じぶんクラフト - AIで自分の特徴を掘り出そう",
  description: "スワイプ診断・AIインタビューで自分の特徴を集めて、キャッチコピー・自己PR・レアリティ診断を生成。就活生・自己分析したい人に。",
  icons: {
    icon: "/image/mecraft_fav.png",
    apple: "/image/mecraft_fav.png",
  },
  openGraph: {
    title: "じぶんクラフト - AIで自分の特徴を掘り出そう",
    description: "スワイプ診断・AIインタビューで自分の特徴を集めて、キャッチコピー・自己PR・レアリティ診断を生成。就活生・自己分析したい人に。",
    url: "https://mecraft.life",
    siteName: "じぶんクラフト",
    images: [
      {
        url: "https://mecraft.life/image/mecraft_logo.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "じぶんクラフト - AIで自分の特徴を掘り出そう",
    description: "スワイプ診断・AIインタビューで自分の特徴を集めて、キャッチコピー・自己PR・レアリティ診断を生成。",
    images: ["https://mecraft.life/image/mecraft_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5781326713622626"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
