'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { getOutputType } from '@/lib/outputTypes';
import { Output } from '@/types';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export default function OutputDetailPage() {
  const router = useRouter();
  const params = useParams();
  const outputId = params.id as string;
  const { user } = useAuth();
  usePageHeader({ title: 'アウトプット詳細', showBackButton: true, onBack: () => router.push('/craft') });

  const [output, setOutput] = useState<Output | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && outputId) {
      fetchOutput();
    }
  }, [user, outputId]);

  const fetchOutput = async () => {
    try {
      const response = await authenticatedFetch(`/api/outputs?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch outputs');

      const data = await response.json();
      const foundOutput = data.outputs?.find((o: Output) => o.id === outputId);

      if (foundOutput) {
        setOutput(foundOutput);
        setEditedContent(foundOutput.editedContent || foundOutput.content.body);
      } else {
        setError('アウトプットが見つかりません');
      }
    } catch (err) {
      console.error('Error fetching output:', err);
      setError('読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!output) return;

    setIsSaving(true);
    setError('');

    try {
      const response = await authenticatedFetch('/api/outputs', {
        method: 'PUT',
        body: JSON.stringify({
          outputId: output.id,
          content: editedContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setOutput({
        ...output,
        editedContent,
        isEdited: true,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
      setError('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = output?.editedContent || output?.content.body || '';
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!output || !confirm('このアウトプットを削除しますか？')) return;

    try {
      const response = await authenticatedFetch(`/api/outputs?outputId=${output.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      router.push('/craft/history');
    } catch (err) {
      console.error('Error deleting:', err);
      setError('削除に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-sm text-stone-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error && !output) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => router.push('/craft')}
            className="text-sky-600 underline"
          >
            つくるに戻る
          </button>
        </div>
      </div>
    );
  }

  const outputConfig = output ? getOutputType(output.type) : null;
  const displayContent = output?.editedContent || output?.content.body || '';

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{outputConfig?.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-stone-800">{outputConfig?.name}</h1>
              <p className="text-sm text-stone-500">
                {output?.createdAt
                  ? new Date(output.createdAt).toLocaleDateString('ja-JP')
                  : ''}
              </p>
            </div>
          </div>
          {output?.isEdited && (
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
              編集済み
            </span>
          )}
        </div>

        {/* コンテンツカード */}
        <div className="glass-card mb-6 p-6">
          {isEditing ? (
            <>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[200px] rounded-xl border border-sky-200 bg-white/80 p-4 text-stone-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-stone-500">{editedContent.length}文字</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditedContent(displayContent);
                      setIsEditing(false);
                    }}
                    className="rounded-xl border border-stone-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-gradient-primary rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-stone-800">{displayContent}</p>
              <div className="mt-4 flex items-center justify-between border-t border-sky-100 pt-4">
                <span className="text-sm text-stone-500">{displayContent.length}文字</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:bg-sky-50"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? 'コピーしました！' : 'コピー'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold text-stone-700 transition-all hover:bg-sky-50"
                  >
                    <Pencil size={14} />
                    編集
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* 削除ボタン */}
        <div className="text-center">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 mx-auto text-sm text-red-500 hover:text-red-700"
          >
            <Trash2 size={14} />
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
