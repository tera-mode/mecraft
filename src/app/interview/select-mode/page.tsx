'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';
import { INTERVIEW_MODES, InterviewModeConfig } from '@/lib/interviewModes';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';

export default function SelectModePage() {
  const router = useRouter();
  const { user, loading, isOnboardingRequired, userInterviewer } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (!loading && isOnboardingRequired) {
      router.push('/onboarding');
    }
  }, [user, loading, isOnboardingRequired, router]);

  const handleSelectMode = (mode: InterviewModeConfig) => {
    // ゲストセッションIDがない場合は作成
    if (!Cookies.get('guest_session_id')) {
      const sessionId = uuidv4();
      Cookies.set('guest_session_id', sessionId, { expires: 30, path: '/' });
    }

    // モードをCookieに保存
    Cookies.set('interview_mode', mode.id, { expires: 1, path: '/' });

    // すでにインタビュワーが選択されている場合は直接インタビューページへ
    // Cookieまたはユーザーデータ（Firestore）からチェック
    const selectedInterviewerCookie = Cookies.get('selected_interviewer');
    const interviewerNameCookie = Cookies.get('interviewer_name');

    const hasInterviewerInCookie = selectedInterviewerCookie && interviewerNameCookie;
    const hasInterviewerInUserData = userInterviewer?.id && userInterviewer?.customName;

    if (hasInterviewerInCookie || hasInterviewerInUserData) {
      // ユーザーデータがある場合はCookieにも同期
      if (hasInterviewerInUserData && !hasInterviewerInCookie) {
        Cookies.set('selected_interviewer', userInterviewer.id, { expires: 365, path: '/' });
        Cookies.set('interviewer_name', userInterviewer.customName!, { expires: 365, path: '/' });
      }
      router.push(`/interview/${mode.id}`);
    } else {
      router.push('/interview/select-interviewer');
    }
  };

  if (loading || !user || isOnboardingRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-warm">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-warm">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-orange absolute -right-40 top-20 h-96 w-96" />
      <div className="gradient-orb gradient-orb-yellow absolute -left-40 bottom-20 h-80 w-80" />

      <UserHeader />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <main className="mx-auto w-full max-w-4xl">
          {/* ヘッダー */}
          <div className="mb-8 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              インタビューモードを選択
            </h1>
            <p className="text-gray-600">
              目的に合わせたモードを選んでください
            </p>
          </div>

          {/* モードカード */}
          <div className="grid gap-6 md:grid-cols-3">
            {INTERVIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode)}
                className="glass-card group flex flex-col items-center gap-4 rounded-3xl p-6 text-left transition-all hover:scale-[1.02] hover-glow"
              >
                {/* アイコン */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-amber-200 text-3xl shadow-md transition-all group-hover:from-orange-300 group-hover:to-amber-300 group-hover:shadow-lg">
                  {mode.icon}
                </div>

                {/* タイトルと説明 */}
                <div className="text-center">
                  <h2 className="mb-2 text-xl font-bold text-gray-900">
                    {mode.name}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600">
                    {mode.description}
                  </p>
                </div>

                {/* 質問数 */}
                <div className="mb-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                  {mode.questionCount === 'endless'
                    ? 'いつでも終了可能'
                    : `${mode.questionCount}問`}
                </div>

                {/* 特徴リスト */}
                <ul className="space-y-2 text-sm text-gray-600">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5 text-orange-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* 戻るボタン */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/home')}
              className="text-gray-500 underline decoration-orange-300 underline-offset-4 hover:text-orange-600 hover:decoration-orange-500"
            >
              ホームに戻る
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
