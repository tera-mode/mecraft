'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { INTERVIEWERS } from '@/lib/interviewers';
import { InterviewerId } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import UserHeader from '@/components/UserHeader';

export default function SelectInterviewer() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerId | null>(null);
  const [interviewerName, setInterviewerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    // ゲストセッションIDを確認
    const guestSessionId = Cookies.get('guest_session_id');
    if (!guestSessionId) {
      // セッションIDがない場合はLPに戻す
      router.push('/');
      return;
    }
    setSessionId(guestSessionId);

    // 保存されているインタビュワー名があれば取得
    const savedName = Cookies.get('interviewer_name');
    if (savedName) {
      setInterviewerName(savedName);
    }
  }, [router]);

  const handleSelectInterviewer = (interviewerId: InterviewerId) => {
    setSelectedInterviewer(interviewerId);

    // すでに名前が保存されている場合はそのまま進む
    const savedName = Cookies.get('interviewer_name');
    if (savedName) {
      proceedToInterview(interviewerId, savedName);
    } else {
      // 名前入力モーダルを表示
      setShowNameInput(true);
    }
  };

  const proceedToInterview = async (interviewerId: InterviewerId, name: string) => {
    // 選択したインタビュワーIDをCookieに永続保存（365日）
    Cookies.set('selected_interviewer', interviewerId, { expires: 365, path: '/' });

    // インタビュワー名をCookieに保存（365日）
    Cookies.set('interviewer_name', name, { expires: 365, path: '/' });

    // Firestoreにも保存（ログインユーザーの場合）
    if (user && !user.isAnonymous) {
      try {
        await fetch('/api/save-interviewer-name', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            interviewerName: name,
          }),
        });
      } catch (error) {
        console.error('Failed to save interviewer name:', error);
      }
    }

    // インタビューページへ遷移
    router.push('/interview');
  };

  const handleNameSubmit = () => {
    if (!interviewerName.trim() || !selectedInterviewer) return;
    proceedToInterview(selectedInterviewer, interviewerName.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    }
  };

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const selectedInterviewerData = selectedInterviewer
    ? INTERVIEWERS.find(i => i.id === selectedInterviewer)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* ユーザーヘッダー */}
      <UserHeader />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <main className="flex w-full max-w-7xl flex-col items-center gap-12 text-center">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
            インタビュワーを選んでください
          </h1>
          <p className="text-lg text-gray-600">
            画像をクリックして選択してください
          </p>
        </div>

        {/* インタビュワー画像選択 */}
        <div className="grid w-full gap-8 md:grid-cols-2">
          {INTERVIEWERS.map((interviewer) => (
            <button
              key={interviewer.id}
              onClick={() => handleSelectInterviewer(interviewer.id as InterviewerId)}
              className="group relative overflow-hidden rounded-3xl shadow-2xl transition-all hover:scale-[1.02] hover:shadow-3xl"
            >
              <div className="relative h-[600px] w-full">
                <Image
                  src={interviewer.gender === '女性' ? '/image/lady-interviewer.png' : '/image/man-interviewer.png'}
                  alt={`${interviewer.gender}のインタビュワー`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  priority
                />
              </div>
            </button>
          ))}
        </div>

        {/* 戻るボタン */}
        <button
          onClick={() => router.push('/home')}
          className="text-gray-500 underline hover:text-gray-700"
        >
          HOMEに戻る
        </button>
        </main>
      </div>

      {/* 名前入力モーダル */}
      {showNameInput && selectedInterviewerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full">
                <Image
                  src={selectedInterviewerData.gender === '女性' ? '/image/icon_lady-interviewer.png' : '/image/icon_man-interviewer.png'}
                  alt="インタビュワー"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
              インタビュワーに名前をつけてください
            </h2>
            <p className="mb-6 text-center text-sm text-gray-600">
              好きな名前で呼んでください
            </p>

            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="例：あかり、けんと、など"
              className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg focus:border-purple-500 focus:outline-none"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameInput(false);
                  setSelectedInterviewer(null);
                }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                戻る
              </button>
              <button
                onClick={handleNameSubmit}
                disabled={!interviewerName.trim()}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:bg-gray-300"
              >
                インタビュー開始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
