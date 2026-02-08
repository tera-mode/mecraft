'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTraits } from '@/contexts/TraitsContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { getEnabledOutputTypes, OutputTypeConfig } from '@/lib/outputTypes';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

function CreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();
  const { traits, traitCount, isLoading: isLoadingTraits } = useTraits();
  const [selectedType, setSelectedType] = useState<OutputTypeConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState('');

  const outputTypes = getEnabledOutputTypes();
  const typeParam = searchParams.get('type');
  const isDirectAccess = !!typeParam;

  useEffect(() => {
    if (typeParam) {
      const found = outputTypes.find((t) => t.id === typeParam);
      if (found) setSelectedType(found);
    }
  }, [typeParam]);

  usePageHeader({
    title: selectedType?.name || 'テキスト生成',
    showBackButton: true,
    onBack: () => router.push('/craft'),
  });

  const handleSelectType = (type: OutputTypeConfig) => {
    setSelectedType(type);
    setGeneratedContent('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!selectedType || traitCount === 0) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/generate-output', {
        method: 'POST',
        body: JSON.stringify({
          type: selectedType.id,
          traits,
          userProfile: userProfile
            ? {
                nickname: userProfile.nickname,
                occupation: userProfile.occupation,
              }
            : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate output');

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      console.error('Error generating output:', err);
      setError('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedType || !generatedContent || !user) return;

    try {
      const response = await authenticatedFetch('/api/outputs', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          type: selectedType.id,
          content: generatedContent,
          traits,
          interviewIds: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to save output');

      const data = await response.json();
      router.push(`/craft/${data.outputId}`);
    } catch (err) {
      console.error('Error saving output:', err);
      setError('保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 特徴データの状態 */}
        {isLoadingTraits ? (
          <div className="glass-card mb-6 p-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
              <p className="text-sm text-gray-600">特徴データを読み込み中...</p>
            </div>
          </div>
        ) : traitCount === 0 ? (
          <div className="glass-card mb-6 p-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-sky-700">
              特徴データがありません
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              まずはインタビューを受けて、あなたの特徴を発見しましょう。
            </p>
            <button
              onClick={() => router.push('/dig/interview/select-mode')}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2 font-semibold text-white shadow-md"
            >
              インタビューを始める
            </button>
          </div>
        ) : (
          <>
            {/* 直接アクセス時: 説明 + 生成ボタンのみ */}
            {isDirectAccess && selectedType ? (
              <div className="glass-card mb-6 p-6 text-center">
                <p className="mb-2 text-sm text-gray-600">{selectedType.description}</p>
                <p className="mb-4 text-xs text-gray-400">
                  {selectedType.minLength}〜{selectedType.maxLength}文字 ／ 特徴 {traitCount}個で生成
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      生成中...
                    </span>
                  ) : (
                    `${selectedType.name}を生成`
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* 特徴サマリー */}
                <div className="glass-card mb-6 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      蓄積された特徴: <span className="font-bold text-sky-600">{traitCount}個</span>
                    </span>
                  </div>
                </div>

                {/* アウトプットタイプ選択 */}
                <div className="mb-6 grid gap-3 md:grid-cols-2">
                  {outputTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleSelectType(type)}
                      className={`glass-card flex items-start gap-4 p-4 text-left transition-all ${
                        selectedType?.id === type.id
                          ? 'ring-2 ring-sky-400 shadow-lg'
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-200 to-blue-200 text-xl">
                        {type.icon}
                      </div>
                      <div>
                        <h3 className="mb-0.5 font-bold text-gray-900">{type.name}</h3>
                        <p className="text-xs text-gray-600">{type.description}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {type.minLength}〜{type.maxLength}文字
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 生成ボタン */}
                {selectedType && (
                  <div className="mb-6 text-center">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-3 font-bold text-white shadow-lg disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          生成中...
                        </span>
                      ) : (
                        `${selectedType.name}を生成`
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* エラー表示 */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* 生成結果 */}
            {generatedContent && (
              <div className="glass-card p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900">生成結果</h3>
                <div className="mb-4 rounded-xl bg-white/50 p-4">
                  <p className="whitespace-pre-wrap text-gray-800">{generatedContent}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{generatedContent.length}文字</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="rounded-xl border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-sky-50 disabled:opacity-50"
                    >
                      再生成
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      保存する
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CreateOutputPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
            <p className="text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <CreateContent />
    </Suspense>
  );
}
