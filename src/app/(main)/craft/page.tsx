'use client';

import { useRouter } from 'next/navigation';
import { FileText, Palette, MessageSquare, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { MenuCard } from '@/components/ui';

export default function CraftPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { traitCount, isLoading: isLoadingTraits } = useTraits();
  usePageHeader({ title: 'つくる' });

  const craftMenuItems = [
    {
      title: 'じぶんキャッチコピー',
      description: 'SNSプロフィールにそのまま使える一行を生成',
      icon: Sparkles,
      iconColor: 'text-amber-600',
      bgGradient: 'from-amber-200 to-orange-200',
      buttonGradient: 'from-amber-500 to-orange-500',
      href: '/craft/catchcopy',
      minTraits: 3,
    },
    {
      title: '自分画像生成',
      description: '特徴データからイメージ画像を生成',
      icon: Palette,
      iconColor: 'text-purple-600',
      bgGradient: 'from-purple-200 to-pink-200',
      buttonGradient: 'from-purple-500 to-pink-500',
      href: '/craft/self-image',
      minTraits: 5,
    },
    {
      title: '自分AIと話す',
      description: '特徴を学んだAIと対話して新しい視点を得る',
      icon: MessageSquare,
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-200 to-cyan-200',
      buttonGradient: 'from-blue-500 to-cyan-500',
      href: '/craft/talk-with-self',
      minTraits: 10,
    },
    {
      title: '自己PRページ',
      description: '転職・就活で使える自己PR文を生成',
      icon: FileText,
      iconColor: 'text-sky-600',
      bgGradient: 'from-sky-200 to-blue-200',
      buttonGradient: 'from-sky-500 to-blue-500',
      href: '/craft/create?type=self-pr',
      minTraits: 0,
    },
    {
      title: 'SNS用プロフィール',
      description: 'SNSプロフィール欄に使える自己紹介文',
      icon: FileText,
      iconColor: 'text-emerald-600',
      bgGradient: 'from-emerald-200 to-teal-200',
      buttonGradient: 'from-emerald-500 to-teal-500',
      href: '/craft/create?type=sns-profile',
      minTraits: 0,
    },
  ];

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            集めた特徴からアウトプットを生成
          </p>
        </div>

        {isLoadingTraits ? (
          <div className="glass-card mb-6 p-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
              <p className="text-sm text-gray-600">特徴データを読み込み中...</p>
            </div>
          </div>
        ) : traitCount === 0 ? (
          <div className="glass-card mb-6 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-emerald-700">
              特徴データがありません
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              まずはインタビューを受けて、あなたの特徴を発見しましょう。
            </p>
            <button
              onClick={() => router.push('/dig')}
              className="btn-gradient-primary rounded-xl px-6 py-2 font-semibold text-white"
            >
              ほるに行く
            </button>
          </div>
        ) : (
          <>
            {/* Trait summary */}
            <div className="glass-card mb-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  蓄積された特徴: <span className="font-bold text-emerald-600">{traitCount}個</span>
                </span>
                <button
                  onClick={() => router.push('/mypage')}
                  className="text-sm text-emerald-600 underline"
                >
                  詳細を見る
                </button>
              </div>
            </div>

            {/* Menu cards */}
            <div className="mb-6 space-y-4">
              {craftMenuItems.map((item) => {
                const isGuest = user?.isAnonymous;
                const isLocked = item.minTraits > 0 && (traitCount < item.minTraits || isGuest);
                const disabledMessage = isGuest && item.minTraits > 0
                  ? 'ログインが必要です'
                  : `特徴${item.minTraits}個以上必要（${traitCount}/${item.minTraits}）`;

                return (
                  <MenuCard
                    key={item.href}
                    title={item.title}
                    description={item.description}
                    icon={item.icon}
                    iconColor={item.iconColor}
                    bgGradient={item.bgGradient}
                    buttonGradient={item.buttonGradient}
                    href={item.href}
                    disabled={isLocked}
                    disabledMessage={disabledMessage}
                  />
                );
              })}
            </div>

            {/* アウトプット履歴リンク */}
            <div className="mb-6 text-center">
              <button
                onClick={() => router.push('/craft/history')}
                className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-emerald-600"
              >
                アウトプット履歴を見る
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
