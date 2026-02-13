'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { INTERVIEWERS } from '@/lib/interviewers';
import { InterviewerId, InterviewMode } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function SelectInterviewer() {
  const router = useRouter();
  const { user, updateUserInterviewer, userInterviewer } = useAuth();
  usePageHeader({ title: 'インタビュワー選択', showBackButton: true, onBack: () => router.push('/dig/interview/select-mode') });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerId | null>(null);
  const [interviewerName, setInterviewerName] = useState('');
  const [customPersonality, setCustomPersonality] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('basic');

  useEffect(() => {
    const guestSessionId = Cookies.get('guest_session_id');
    if (!guestSessionId) {
      router.push('/');
      return;
    }
    setSessionId(guestSessionId);

    const mode = Cookies.get('interview_mode') as InterviewMode;
    if (mode) setInterviewMode(mode);

    const savedInterviewerId = Cookies.get('selected_interviewer');
    const savedName = Cookies.get('interviewer_name');
    const hasInterviewerInCookie = savedInterviewerId && savedName;
    const hasInterviewerInUserData = userInterviewer?.id && userInterviewer?.customName;

    if (hasInterviewerInCookie || hasInterviewerInUserData) {
      if (hasInterviewerInUserData && !hasInterviewerInCookie) {
        Cookies.set('selected_interviewer', userInterviewer.id, { expires: 365, path: '/' });
        Cookies.set('interviewer_name', userInterviewer.customName!, { expires: 365, path: '/' });
      }
      router.push(`/dig/interview/${mode || 'basic'}`);
      return;
    }

    if (savedName) setInterviewerName(savedName);
  }, [router, userInterviewer]);

  const handleSelectInterviewer = (interviewerId: InterviewerId) => {
    setSelectedInterviewer(interviewerId);
    const savedName = Cookies.get('interviewer_name');
    if (savedName) {
      proceedToInterview(interviewerId, savedName);
    } else {
      setShowNameInput(true);
    }
  };

  const proceedToInterview = async (interviewerId: InterviewerId, name: string) => {
    Cookies.set('selected_interviewer', interviewerId, { expires: 365, path: '/' });
    Cookies.set('interviewer_name', name, { expires: 365, path: '/' });
    if (customPersonality.trim()) {
      Cookies.set('interviewer_customization', customPersonality.trim(), { expires: 365, path: '/' });
    }

    if (user && !user.isAnonymous) {
      try {
        await updateUserInterviewer({
          id: interviewerId,
          customName: name,
          customPersonality: customPersonality.trim() || undefined,
        });
      } catch (error) {
        console.error('Failed to save interviewer settings:', error);
      }
    }

    router.push(`/dig/interview/${interviewMode}`);
  };

  const handleNameSubmit = () => {
    if (!interviewerName.trim() || !selectedInterviewer) return;
    proceedToInterview(selectedInterviewer, interviewerName.trim());
  };

  const selectedInterviewerData = selectedInterviewer
    ? INTERVIEWERS.find(i => i.id === selectedInterviewer)
    : null;

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
          <p className="text-stone-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-center text-sm text-stone-500">画像をタップして選択</p>

          <div className="grid grid-cols-2 gap-4">
            {INTERVIEWERS.map((interviewer) => (
              <button
                key={interviewer.id}
                onClick={() => handleSelectInterviewer(interviewer.id as InterviewerId)}
                className="group relative overflow-hidden rounded-2xl shadow-lg transition-all hover:scale-[1.02] hover-glow"
              >
                <div className="relative aspect-[2/3] w-full">
                  <Image
                    src={interviewer.gender === '女性' ? '/image/lady-interviewer2.png' : '/image/man-interviewer2.png'}
                    alt={`${interviewer.gender}のインタビュワー`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Name input modal */}
      {showNameInput && selectedInterviewerData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="glass-modal w-full max-w-md rounded-3xl p-6">
            <div className="mb-6 flex justify-center">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-emerald-200 shadow-lg">
                <Image
                  src={selectedInterviewerData.gender === '女性' ? '/image/icon_lady-interviewer.png' : '/image/icon_man-interviewer.png'}
                  alt="インタビュワー"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-bold text-stone-800">
              インタビュワーに名前をつけてください
            </h2>
            <p className="mb-6 text-center text-sm text-stone-500">好きな名前で呼んでください</p>

            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              placeholder="例：あかり、けんと、など"
              className="glass-input mb-4 w-full rounded-xl px-4 py-3 text-center text-lg focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              autoFocus
            />

            <div className="mb-4">
              <p className="mb-2 text-left text-sm font-medium text-stone-700">性格のカスタマイズ（任意）</p>
              <textarea
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="例：明るくて元気、優しくて落ち着いた雰囲気、など"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
                rows={3}
                maxLength={200}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowNameInput(false); setSelectedInterviewer(null); }}
                className="flex-1 rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 font-semibold text-stone-700 transition-all hover:bg-emerald-50"
              >
                戻る
              </button>
              <button
                onClick={handleNameSubmit}
                disabled={!interviewerName.trim()}
                className="btn-gradient-primary flex-1 rounded-xl px-4 py-3 font-semibold text-white shadow-md disabled:opacity-50"
              >
                インタビュー開始
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
