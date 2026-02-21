import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'じぶんレアリティ診断 | じぶんクラフト',
  description: 'あなたの特徴の組み合わせは日本人口の何%？AIが分析するレアリティ診断。SSR・SR・R・Nランクで判定。無料・登録不要で始められます。',
  openGraph: {
    title: 'じぶんレアリティ診断 | じぶんクラフト',
    description: 'あなたの特徴の組み合わせは日本人口の何%？AIが分析するレアリティ診断。SSR・SR・R・Nランクで判定。',
    url: 'https://mecraft.life/craft/rarity',
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
    title: 'じぶんレアリティ診断 | じぶんクラフト',
    description: 'あなたの特徴の組み合わせは日本人口の何%？AIが分析するレアリティ診断。SSR・SR・R・Nランクで判定。',
    images: ['https://mecraft.life/image/mecraft_logo.png'],
  },
};

export default function RarityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
