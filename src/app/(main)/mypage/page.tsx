'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { TraitCard } from '@/components/interview';
import { TRAIT_CATEGORY_LABELS } from '@/types';
import { ArrowRight } from 'lucide-react';
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function MyPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { traits, isLoading, deleteTrait, traitCount, categoryBreakdown } = useTraits();
  usePageHeader({ title: 'じぶん' });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingTraitLabel, setDeletingTraitLabel] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const isGuest = user?.isAnonymous ?? false;
  const displayName = userProfile?.nickname || user?.displayName || (isGuest ? 'ゲスト' : user?.email?.split('@')[0]);

  const filteredTraits =
    selectedCategory === 'all'
      ? traits
      : traits.filter((t) => t.category === selectedCategory);

  const handleDeleteTrait = async (traitLabel: string) => {
    setDeletingTraitLabel(traitLabel);
    try {
      await deleteTrait(traitLabel);
      setShowDeleteConfirm(null);
    } catch {
      alert('特徴の削除に失敗しました。もう一度お試しください。');
    } finally {
      setDeletingTraitLabel(null);
    }
  };

  return (
    <>
      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {/* Profile summary */}
          <div className="glass-card mb-6 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 text-2xl shadow-md">
                {userProfile?.nickname ? '😊' : '👤'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {displayName}さん
                </h2>
                {userProfile?.occupation && (
                  <p className="text-sm text-gray-600">{userProfile.occupation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Guest login prompt */}
          {isGuest && (
            <div className="glass-card mb-6 p-4">
              <p className="mb-2 text-sm font-semibold text-emerald-700">ゲストモードでご利用中</p>
              <p className="mb-3 text-xs text-gray-600">ログインすると特徴データが保存されます。</p>
              <button
                onClick={() => router.push('/login?mode=signup')}
                className="btn-gradient-secondary rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                ログインして保存する
              </button>
            </div>
          )}

          {/* Craft CTA */}
          {traitCount > 0 && (
            <button
              onClick={() => router.push('/craft')}
              className="mb-4 flex w-full items-center justify-between rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 transition-all hover:bg-emerald-50"
            >
              <span className="text-sm text-emerald-700">この特徴を使って表現しよう</span>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                つくる <ArrowRight size={14} />
              </span>
            </button>
          )}

          {/* Trait stats */}
          <div className="glass-card mb-4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                蓄積された特徴: <span className="font-bold text-emerald-600">{traitCount}個</span>
              </span>
              <button
                onClick={() => router.push('/dig')}
                className="text-sm text-emerald-600 underline"
              >
                もっとほる
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="glass-card p-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                <p className="text-gray-600">読み込み中...</p>
              </div>
            </div>
          ) : traits.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="mb-4 text-5xl">🏷️</div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                まだ特徴がありません
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                スワイプ診断やインタビューで、あなたの特徴を発見しましょう
              </p>
              <button
                onClick={() => router.push('/dig')}
                className="btn-gradient-primary rounded-xl px-6 py-2 font-semibold text-white"
              >
                特徴をほりにいく
              </button>
            </div>
          ) : (
            <>
              {/* Category filter */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/50 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  すべて ({traitCount})
                </button>
                {categoryBreakdown
                  .filter((cat) => cat.count > 0)
                  .map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedCategory === cat.key
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/50 text-gray-700 hover:bg-white/80'
                      }`}
                    >
                      {cat.label} ({cat.count})
                    </button>
                  ))}
              </div>

              {/* Trait cards */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTraits.map((trait) => (
                  <div key={trait.id} className="flex flex-col">
                    <button
                      onClick={() => router.push(`/mypage/${trait.id}`)}
                      className="text-left"
                    >
                      <TraitCard trait={trait} size="full" />
                    </button>
                    <div className="flex justify-end mt-1 px-1">
                      <button
                        onClick={() => setShowDeleteConfirm(trait.label)}
                        disabled={deletingTraitLabel === trait.label}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6">
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">
              特徴を削除しますか？
            </h2>
            <p className="mb-2 text-center text-sm text-gray-600">
              「{showDeleteConfirm}」を削除します。
            </p>
            <p className="mb-6 text-center text-xs text-gray-500">
              この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 font-semibold text-gray-700 transition-all hover:bg-emerald-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDeleteTrait(showDeleteConfirm)}
                disabled={deletingTraitLabel !== null}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 font-semibold text-white shadow-md hover:bg-red-600 disabled:opacity-50"
              >
                {deletingTraitLabel ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
