import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'じぶん画像生成 | じぶんクラフト',
  description: 'あなたの特徴データからAIがイメージ画像を自動生成。Imagen 4による高品質なイラスト。',
  openGraph: {
    title: 'じぶん画像生成 | じぶんクラフト',
    description: 'あなたの特徴データからAIがイメージ画像を自動生成。Imagen 4による高品質なイラスト。',
    url: 'https://mecraft.life/craft/self-image',
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
    title: 'じぶん画像生成 | じぶんクラフト',
    description: 'あなたの特徴データからAIがイメージ画像を自動生成。Imagen 4による高品質なイラスト。',
    images: ['https://mecraft.life/image/mecraft_logo.png'],
  },
};

export default function SelfImageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
