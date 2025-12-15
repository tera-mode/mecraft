'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Interview {
  id: string;
  interviewerId: string;
  createdAt: string;
  data: {
    fixed: {
      name?: string;
      nickname?: string;
    };
  };
}

export default function MyPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoadingInterviews, setIsLoadingInterviews] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchInterviews();
    }
  }, [user, loading, router]);

  const fetchInterviews = async () => {
    if (!user) return;

    setIsLoadingInterviews(true);
    try {
      const response = await fetch(`/api/get-interviews?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.interviews);
      }
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setIsLoadingInterviews(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleNewInterview = () => {
    router.push('/select-interviewer');
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-4 py-12">
      <main className="mx-auto max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">マイページ</h1>
            <p className="mt-2 text-gray-600">
              ようこそ、{user.displayName || user.email}さん
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleNewInterview}
              className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
            >
              新しいインタビュー
            </button>
            <button
              onClick={handleSignOut}
              className="rounded-full border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* インタビュー一覧 */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">
            過去のインタビュー
          </h2>

          {isLoadingInterviews ? (
            <p className="text-gray-600">読み込み中...</p>
          ) : interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                まだインタビューがありません
              </p>
              <button
                onClick={handleNewInterview}
                className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
              >
                最初のインタビューを始める
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {interviews.map((interview) => (
                <div
                  key={interview.id}
                  className="cursor-pointer rounded-xl border border-gray-200 p-6 transition-all hover:border-purple-300 hover:shadow-md"
                  onClick={() => router.push(`/mypage/interview/${interview.id}`)}
                >
                  <div className="mb-3">
                    <p className="text-sm text-gray-500">
                      {new Date(interview.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {interview.data?.fixed?.name || '名前なし'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {interview.data?.fixed?.nickname || ''}
                  </p>
                  <div className="mt-4 text-sm text-purple-600">
                    詳細を見る →
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* トップに戻るボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 underline hover:text-gray-700"
          >
            トップに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
