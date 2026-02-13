'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInterviewer } from '@/lib/interviewers';
import { InterviewerId, FixedUserData, DynamicData } from '@/types';
import { usePageHeader } from '@/contexts/PageHeaderContext';

interface InterviewData {
  fixed: FixedUserData;
  dynamic?: DynamicData;
  createdAt: string;
  updatedAt: string;
}

export default function InterviewDetail() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  usePageHeader({ title: 'インタビュー詳細', showBackButton: true, onBack: () => router.push('/mypage') });
  const interviewId = params.id as string;

  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [interviewerId, setInterviewerId] = useState<InterviewerId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.isAnonymous) {
      alert('この機能はログインユーザーのみ利用できます。');
      router.push('/');
      return;
    }

    loadInterviewData();
  }, [user, loading, interviewId, router]);

  const loadInterviewData = async () => {
    try {
      const response = await fetch(`/api/get-interview?id=${interviewId}`);
      if (!response.ok) throw new Error('Failed to load interview');

      const result = await response.json();
      const fullData = result.interview || {};
      setInterviewData(fullData.data);
      setInterviewerId(fullData.interviewerId);
    } catch (error) {
      console.error('Error loading interview:', error);
      alert('インタビューデータの読み込みに失敗しました。');
      router.push('/mypage');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
        </div>
      </>
    );
  }

  if (!interviewData) {
    return (
      <>
        <div className="px-4 py-8 text-center">
          <p className="text-stone-700">インタビューが見つかりませんでした</p>
          <button onClick={() => router.push('/mypage')} className="mt-4 text-emerald-600 underline">
            じぶんページに戻る
          </button>
        </div>
      </>
    );
  }

  const interviewer = interviewerId ? getInterviewer(interviewerId) : null;

  return (
    <>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {/* Profile */}
          <div className="glass-card mb-6 p-6">
            <h2 className="mb-4 text-xl font-bold text-stone-800">プロフィール</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {interviewData.fixed.name && (
                <div><span className="font-semibold text-stone-700">名前:</span> {interviewData.fixed.name}</div>
              )}
              {interviewData.fixed.nickname && (
                <div><span className="font-semibold text-stone-700">ニックネーム:</span> {interviewData.fixed.nickname}</div>
              )}
              {interviewData.fixed.gender && (
                <div><span className="font-semibold text-stone-700">性別:</span> {interviewData.fixed.gender}</div>
              )}
              {interviewData.fixed.age && (
                <div><span className="font-semibold text-stone-700">年齢:</span> {interviewData.fixed.age}歳</div>
              )}
              {interviewData.fixed.location && (
                <div><span className="font-semibold text-stone-700">居住地:</span> {interviewData.fixed.location}</div>
              )}
              {interviewData.fixed.occupation && (
                <div><span className="font-semibold text-stone-700">職業:</span> {interviewData.fixed.occupation}</div>
              )}
            </div>
          </div>

          {/* Dynamic data */}
          {interviewData.dynamic && Object.keys(interviewData.dynamic).length > 0 && (
            <div className="glass-card mb-6 p-6">
              <h2 className="mb-4 text-xl font-bold text-stone-800">深掘り情報</h2>
              <div className="space-y-4">
                {Object.entries(interviewData.dynamic).map(([key, item]) => (
                  <div key={key} className="glass rounded-xl p-4">
                    <p className="mb-1 text-xs font-semibold text-emerald-600">{item.category}</p>
                    <p className="mb-2 font-semibold text-stone-800">Q: {item.question}</p>
                    <p className="text-stone-700">A: {item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/craft')}
              className="btn-gradient-primary w-full rounded-xl py-3 font-semibold text-white"
            >
              アウトプットをつくる
            </button>
            <button
              onClick={() => router.push('/mypage')}
              className="w-full rounded-xl border border-emerald-200 bg-white/80 py-3 font-semibold text-stone-700 hover:bg-emerald-50"
            >
              じぶんページに戻る
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
