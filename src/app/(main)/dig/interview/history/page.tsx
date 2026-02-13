'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInterviewMode } from '@/lib/interviewModes';
import { InterviewerId, InterviewMode } from '@/types';
import { usePageHeader } from '@/contexts/PageHeaderContext';

interface Interview {
  id: string;
  userId: string;
  interviewerId: InterviewerId;
  mode?: InterviewMode;
  data: {
    fixed: {
      name?: string;
      nickname?: string;
      occupation?: string;
    };
    dynamic?: Record<string, unknown>;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function InterviewHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);
  usePageHeader({ title: 'インタビュー履歴', showBackButton: true, onBack: () => router.push('/dig') });

  useEffect(() => {
    if (!loading && user) {
      fetchInterviews();
    }
  }, [user, loading]);

  const fetchInterviews = async () => {
    try {
      const response = await fetch(`/api/get-user-interviews?userId=${user?.uid}`);
      if (!response.ok) throw new Error('Failed to load interviews');
      const result = await response.json();
      setInterviews(result.interviews || []);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  return (
    <>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          {/* Guest message */}
          {user?.isAnonymous && (
            <div className="glass-card mb-4 p-4 text-center">
              <p className="mb-2 text-sm font-semibold text-emerald-700">
                ゲストモードでは履歴が保存されません
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-gradient-primary rounded-xl px-4 py-2 text-sm font-semibold text-white"
              >
                ログイン
              </button>
            </div>
          )}

          {!user?.isAnonymous && (
            <>
              {isLoadingInterviews ? (
                <div className="glass-card p-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 spinner-warm"></div>
                    <p className="text-stone-500">読み込み中...</p>
                  </div>
                </div>
              ) : interviews.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <div className="mb-4 text-5xl">💬</div>
                  <h3 className="mb-2 text-lg font-semibold text-stone-800">まだインタビューがありません</h3>
                  <button
                    onClick={() => router.push('/dig/interview/select-mode')}
                    className="btn-gradient-primary mt-4 rounded-xl px-6 py-2 font-semibold text-white"
                  >
                    インタビューを始める
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => {
                    const date = new Date(interview.createdAt);
                    const nickname = interview.data.fixed.nickname || interview.data.fixed.name || '不明';
                    const modeConfig = interview.mode ? getInterviewMode(interview.mode) : null;
                    const dynamicCount = interview.data.dynamic ? Object.keys(interview.data.dynamic).length : 0;

                    return (
                      <button
                        key={interview.id}
                        onClick={() => router.push(`/mypage/interview/${interview.id}`)}
                        className="glass-card w-full p-4 text-left transition-all hover:shadow-md"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-200 text-xl">
                            {modeConfig?.icon || '💬'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="font-bold text-stone-800 truncate">{nickname}さんのインタビュー</h3>
                              {modeConfig && (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 flex-shrink-0">
                                  {modeConfig.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400">
                              {date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                              {' ・ '}{dynamicCount}件の質問
                              {interview.status === 'in_progress' && (
                                <span className="ml-2 text-amber-600">（進行中）</span>
                              )}
                            </p>
                          </div>
                          <span className="text-stone-400">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
