import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'じぶんキャッチコピー生成 | じぶんクラフト',
  description: 'AIがあなただけのキャッチコピーを生成。SNSプロフィールにそのまま使える、世界に1つの一行。',
  openGraph: {
    title: 'じぶんキャッチコピー生成 | じぶんクラフト',
    description: 'AIがあなただけのキャッチコピーを生成。SNSプロフィールにそのまま使える、世界に1つの一行。',
    url: 'https://mecraft.life/craft/catchcopy',
    siteName: 'じぶんクラフト',
    images: [
      {
        url: 'https://mecraft.life/image/mecraft_logo.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'じぶんキャッチコピー生成 | じぶんクラフト',
    description: 'AIがあなただけのキャッチコピーを生成。SNSプロフィールにそのまま使える、世界に1つの一行。',
    images: ['https://mecraft.life/image/mecraft_logo.png'],
  },
};

export default function CatchcopyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
