'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Trash2, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { useTraits } from '@/contexts/TraitsContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';
import { Output } from '@/types';

export default function TraitSummaryPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { traits, traitCount, isLoading: isLoadingTraits } = useTraits();
  usePageHeader({ title: 'AI向け自分データ', showBackButton: true, onBack: () => router.push('/craft') });

  const [history, setHistory] = useState<Output[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const canGenerate = traitCount >= 3;

  useEffect(() => {
    if (user) {
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
        const summaryOutputs = (data.outputs || []).filter(
          (o: Output) => o.type === 'trait-summary' && o.status !== 'archived'
        );
        setHistory(summaryOutputs);
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError('');
    setPreview(null);

    try {
      const response = await authenticatedFetch('/api/generate-output', {
        method: 'POST',
        body: JSON.stringify({
          type: 'trait-summary',
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
      console.error('Error generating trait summary:', err);
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
          type: 'trait-summary',
          content: preview,
          traits,
          interviewIds: [],
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setPreview(null);
      await loadHistory();
    } catch (err) {
      console.error('Error saving trait summary:', err);
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
    if (!confirm('この自分データを削除しますか？')) return;

    setDeletingId(outputId);
    try {
      const response = await authenticatedFetch(`/api/outputs?outputId=${outputId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setHistory(history.filter((o) => o.id !== outputId));
    } catch (err) {
      console.error('Error deleting trait summary:', err);
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
          <p className="text-sm text-stone-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* 説明 */}
        <div className="glass-card mb-6 bg-cyan-50/80 p-4">
          <p className="text-sm text-cyan-800">
            集まった特徴をAIが見やすく整理します。生成されたテキストを他のAIに渡せば、自分好みの商品探しや、自分にぴったりな話し相手づくりに活用できます。
          </p>
        </div>

        {/* 特徴数チェック */}
        {!canGenerate ? (
          <div className="glass-card mb-6 p-6 text-center">
            <p className="mb-4 text-stone-700">
              自分データを生成するには、特徴データが3個以上必要です
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
                <h3 className="mb-3 text-center text-sm font-semibold text-stone-500">生成結果</h3>
                <div className="mb-6 whitespace-pre-wrap rounded-xl bg-white/80 p-4 text-sm leading-relaxed text-stone-800">
                  {preview}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:bg-cyan-50 disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    再生成
                  </button>
                  <button
                    onClick={() => handleCopy(preview, 'preview')}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:bg-cyan-50"
                  >
                    {copiedId === 'preview' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copiedId === 'preview' ? 'コピーしました' : 'コピー'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-2 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '保存する'}
                  </button>
                </div>
              </div>
            )}

            {/* 生成ボタン（プレビューがない時のみ表示） */}
            {!preview && (
              <div className="glass-card mb-6 p-6 text-center">
                <p className="mb-4 text-stone-700">
                  特徴データ: <span className="font-bold text-emerald-600">{traitCount}個</span>
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                      生成中...
                    </span>
                  ) : (
                    '自分データを生成'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {/* 使い方ヒント */}
        <div className="glass-card mb-6 p-4">
          <h3 className="mb-2 text-sm font-bold text-stone-700">こんな使い方ができます</h3>
          <ul className="space-y-1.5 text-xs text-stone-500">
            <li>・ChatGPTに渡して「自分に合う本を10冊おすすめして」</li>
            <li>・AIに渡して「この人に合った旅行プランを提案して」</li>
            <li>・AIチャットに渡して「この人っぽく話して」で分身を作成</li>
          </ul>
        </div>

        {/* 履歴 */}
        <div className="glass-card p-6">
          <h2 className="mb-4 text-lg font-bold text-stone-800">
            生成履歴
            {history.length > 0 && (
              <span className="ml-2 text-sm font-normal text-stone-500">
                ({history.length}件)
              </span>
            )}
          </h2>

          {history.length === 0 ? (
            <p className="py-8 text-center text-stone-500">まだ自分データがありません</p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-white/80 p-4 shadow-sm"
                >
                  <div className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                    {(item.editedContent || item.content.body).slice(0, 200)}
                    {(item.editedContent || item.content.body).length > 200 && '...'}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      {new Date(item.createdAt as unknown as string).toLocaleDateString('ja-JP')}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleCopy(item.editedContent || item.content.body, item.id)}
                        className="flex h-9 items-center gap-1.5 rounded-lg bg-stone-100 px-3 text-xs text-stone-500 transition-colors hover:bg-stone-200"
                        title="コピー"
                      >
                        {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copiedId === item.id ? 'コピー済' : 'コピー'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 disabled:opacity-50"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
