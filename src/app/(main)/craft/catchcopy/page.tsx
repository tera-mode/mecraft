'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useTraits } from '@/contexts/TraitsContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { Output } from '@/types';

export default function CatchcopyPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { traits, traitCount, isLoading: isLoadingTraits } = useTraits();
  usePageHeader({ title: 'じぶんキャッチコピー', showBackButton: true, onBack: () => router.push('/craft') });

  const [history, setHistory] = useState<Output[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canGenerate = traitCount >= 3;

  // 24h制限チェック
  const isWithin24h = (dateStr: string) => {
    const generated = new Date(dateStr).getTime();
    return Date.now() - generated < 24 * 60 * 60 * 1000;
  };

  const latestEntry = history[0];
  const isRateLimited = latestEntry?.createdAt && isWithin24h(latestEntry.createdAt as unknown as string);

  // 次回生成可能時刻
  const getNextAvailableTime = () => {
    if (!latestEntry?.createdAt) return null;
    const created = new Date(latestEntry.createdAt as unknown as string).getTime();
    return new Date(created + 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    if (user && !user.isAnonymous) {
      loadHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await authenticatedFetch(`/api/outputs?userId=${user?.uid}`);
      if (response.ok) {
        const data = await response.json();
        const catchcopyOutputs = (data.outputs || []).filter(
          (o: Output) => o.type === 'catchcopy' && o.status !== 'archived'
        );
        setHistory(catchcopyOutputs);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate || isRateLimited) return;

    setIsGenerating(true);
    setError('');
    setPreview(null);

    try {
      const response = await authenticatedFetch('/api/generate-output', {
        method: 'POST',
        body: JSON.stringify({
          type: 'catchcopy',
          traits,
          userProfile: userProfile
            ? { nickname: userProfile.nickname, occupation: userProfile.occupation }
            : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setPreview(data.content);
    } catch (err) {
      console.error('Error generating catchcopy:', err);
      setError('生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview || !user) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/outputs', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.uid,
          type: 'catchcopy',
          content: preview,
          traits,
          interviewIds: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setPreview(null);
      await loadHistory();
    } catch (err) {
      console.error('Error saving catchcopy:', err);
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (outputId: string) => {
    if (!confirm('このキャッチコピーを削除しますか？')) return;

    setDeletingId(outputId);
    try {
      const response = await authenticatedFetch(`/api/outputs?outputId=${outputId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHistory(history.filter((o) => o.id !== outputId));
    } catch (err) {
      console.error('Error deleting catchcopy:', err);
      alert('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingTraits || isLoadingHistory) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 説明 */}
        <div className="glass-card mb-6 bg-amber-50/80 p-4">
          <p className="text-sm text-amber-800">
            集まった特徴から、SNSプロフィールにそのまま使えるキャッチコピーを生成します。
          </p>
        </div>

        {/* 特徴数チェック */}
        {!canGenerate ? (
          <div className="glass-card mb-6 p-6 text-center">
            <p className="mb-4 text-gray-700">
              キャッチコピーを生成するには、特徴データが3個以上必要です
            </p>
            <p className="mb-4 text-2xl font-bold text-emerald-600">
              現在: {traitCount} / 3 個
            </p>
            <button
              onClick={() => router.push('/dig/interview/select-mode')}
              className="btn-gradient-primary rounded-xl px-6 py-3 font-semibold text-white"
            >
              インタビューで特徴を増やす
            </button>
          </div>
        ) : (
          <>
            {/* プレビュー表示 */}
            {preview && (
              <div className="glass-card mb-6 p-6">
                <h3 className="mb-3 text-center text-sm font-semibold text-gray-500">生成結果</h3>
                <p className="mb-6 text-center text-xl font-bold leading-relaxed text-gray-900">
                  {preview}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-white/80 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-amber-50 disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    再生成
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '保存する'}
                  </button>
                </div>
              </div>
            )}

            {/* 生成ボタン（プレビューがない時のみ表示） */}
            {!preview && (
              <div className="glass-card mb-6 p-6 text-center">
                <p className="mb-4 text-gray-700">
                  特徴データ: <span className="font-bold text-emerald-600">{traitCount}個</span>
                </p>

                {isRateLimited ? (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-amber-600">
                      次の生成は1日1回までです
                    </p>
                    <p className="text-xs text-gray-500">
                      次回生成可能: {getNextAvailableTime()?.toLocaleString('ja-JP')}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                        生成中...
                      </span>
                    ) : (
                      'キャッチコピーを生成'
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* 履歴 */}
        <div className="glass-card p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-800">
            生成履歴
            {history.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({history.length}件)
              </span>
            )}
          </h2>

          {history.length === 0 ? (
            <p className="py-8 text-center text-gray-500">まだキャッチコピーがありません</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white/80 p-4 shadow-sm"
                >
                  <p className="flex-1 font-semibold text-gray-800">
                    {item.editedContent || item.content.body}
                  </p>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleCopy(item.editedContent || item.content.body, item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                      title="コピー"
                    >
                      {copiedId === item.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
