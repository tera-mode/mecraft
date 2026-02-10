'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import { INTERVIEWERS } from '@/lib/interviewers';
import { InterviewerId, OccupationCategory } from '@/types';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { LogOut, ChevronRight } from 'lucide-react';

const OCCUPATION_OPTIONS: OccupationCategory[] = [
  '会社員', '経営者', '自営業', '公務員', 'フリーランス',
  '主婦/主夫', '学生（小学生）', '学生（中学生）', '学生（高校生）',
  '学生（大学生）', '学生（大学院生）', '無職', 'その他',
];

const FAQ_ITEMS = [
  {
    question: 'インタビューは何回でも受けられますか？',
    answer: 'はい、何回でもインタビューを受けることができます。インタビューを重ねるほど、あなたの特徴データが蓄積され、より精度の高いアウトプットを生成できるようになります。',
  },
  {
    question: 'ゲストモードとログインの違いは？',
    answer: 'ゲストモードでは一時的にサービスを利用できますが、データは保存されません。ログインすると、インタビュー履歴、特徴データ、アウトプットなどが永続的に保存されます。',
  },
  {
    question: 'アウトプットはどのように作成されますか？',
    answer: 'インタビューで抽出された特徴データをAIが分析し、SNSプロフィールや自己PR文などを自動生成します。生成後は自由に編集することもできます。',
  },
  {
    question: 'データは安全ですか？',
    answer: 'はい、すべてのデータはセキュアなクラウド上で暗号化して保存されています。第三者にデータが共有されることはありません。',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, userProfile, userInterviewer, updateUserProfile, updateUserInterviewer, signOut } = useAuth();
  usePageHeader({ title: '設定', showBackButton: true, onBack: () => router.push('/mypage') });

  const isGuest = user?.isAnonymous ?? false;

  // Profile state
  const [nickname, setNickname] = useState('');
  const [occupation, setOccupation] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Interviewer state
  const [selectedInterviewer, setSelectedInterviewer] = useState<InterviewerId | null>(null);
  const [interviewerName, setInterviewerName] = useState('');
  const [customPersonality, setCustomPersonality] = useState('');
  const [isSubmittingInterviewer, setIsSubmittingInterviewer] = useState(false);
  const [interviewerSuccess, setInterviewerSuccess] = useState(false);

  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setNickname(userProfile.nickname || '');
      setOccupation(userProfile.occupation || '');
    }

    const cookieInterviewer = Cookies.get('selected_interviewer') as InterviewerId;
    const cookieName = Cookies.get('interviewer_name');

    if (userInterviewer) {
      setSelectedInterviewer(userInterviewer.id);
      setInterviewerName(userInterviewer.customName);
      setCustomPersonality(userInterviewer.customPersonality || '');
    } else if (cookieInterviewer) {
      setSelectedInterviewer(cookieInterviewer);
      setInterviewerName(cookieName || '');
      setCustomPersonality(Cookies.get('interviewer_customization') || '');
    }
  }, [userProfile, userInterviewer]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) { setError('ニックネームを入力してください'); return; }
    setIsSubmittingProfile(true);
    try {
      await updateUserProfile({ nickname: nickname.trim(), occupation, onboardingCompleted: true });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch { setError('保存に失敗しました。'); }
    finally { setIsSubmittingProfile(false); }
  };

  const handleSaveInterviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedInterviewer || !interviewerName.trim()) { setError('インタビュワーと名前を設定してください'); return; }
    setIsSubmittingInterviewer(true);
    try {
      Cookies.set('selected_interviewer', selectedInterviewer, { expires: 365, path: '/' });
      Cookies.set('interviewer_name', interviewerName.trim(), { expires: 365, path: '/' });
      if (customPersonality.trim()) {
        Cookies.set('interviewer_customization', customPersonality.trim(), { expires: 365, path: '/' });
      } else {
        Cookies.remove('interviewer_customization');
      }
      if (user && !user.isAnonymous) {
        await updateUserInterviewer({
          id: selectedInterviewer,
          customName: interviewerName.trim(),
          customPersonality: customPersonality.trim() || undefined,
        });
      }
      setInterviewerSuccess(true);
      setTimeout(() => setInterviewerSuccess(false), 3000);
    } catch { setError('保存に失敗しました。'); }
    finally { setIsSubmittingInterviewer(false); }
  };

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;
    try {
      await signOut();
      router.push('/');
    } catch {
      alert('ログアウトに失敗しました。');
    }
  };

  const selectedInterviewerData = selectedInterviewer
    ? INTERVIEWERS.find((i) => i.id === selectedInterviewer) : null;

  return (
    <>

      <div className="px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Profile Section */}
          {!isGuest && (
            <div className="glass-card p-4">
              <button
                onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
                className="flex w-full items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">基本情報</div>
                    <div className="text-xs text-gray-500">ニックネーム・職業</div>
                  </div>
                </div>
                <ChevronRight size={20} className={`text-gray-400 transition-transform ${activeSection === 'profile' ? 'rotate-90' : ''}`} />
              </button>

              {activeSection === 'profile' && (
                <form onSubmit={handleSaveProfile} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">ニックネーム</label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="呼んでほしい名前"
                      className="w-full rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">職業</label>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option value="">選択してください</option>
                      {OCCUPATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  {profileSuccess && <p className="text-sm text-green-600">保存しました</p>}
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="btn-gradient-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {isSubmittingProfile ? '保存中...' : '保存する'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Interviewer Section */}
          <div className="glass-card p-4">
            <button
              onClick={() => setActiveSection(activeSection === 'interviewer' ? null : 'interviewer')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎙️</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">インタビュワー設定</div>
                  <div className="text-xs text-gray-500">
                    {interviewerName ? `${interviewerName}` : 'AIインタビュワーの名前を変更'}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className={`text-gray-400 transition-transform ${activeSection === 'interviewer' ? 'rotate-90' : ''}`} />
            </button>

            {activeSection === 'interviewer' && (
              <form onSubmit={handleSaveInterviewer} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                <div className="grid gap-3 grid-cols-2">
                  {INTERVIEWERS.map((interviewer) => (
                    <button
                      key={interviewer.id}
                      type="button"
                      onClick={() => setSelectedInterviewer(interviewer.id)}
                      className={`relative overflow-hidden rounded-2xl transition-all ${
                        selectedInterviewer === interviewer.id
                          ? 'ring-4 ring-emerald-400 shadow-lg' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="relative aspect-[2/3]">
                        <Image
                          src={interviewer.gender === '女性' ? '/image/lady-interviewer2.png' : '/image/man-interviewer2.png'}
                          alt={`${interviewer.gender}のインタビュワー`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>

                {selectedInterviewer && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-emerald-200">
                        <Image
                          src={selectedInterviewerData?.gender === '女性' ? '/image/icon_lady-interviewer.png' : '/image/icon_man-interviewer.png'}
                          alt="インタビュワー"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <input
                        type="text"
                        value={interviewerName}
                        onChange={(e) => setInterviewerName(e.target.value)}
                        placeholder="名前を入力"
                        className="flex-1 rounded-xl border border-emerald-200 bg-white/80 px-4 py-2 text-gray-900 focus:border-emerald-400 focus:outline-none"
                        maxLength={20}
                      />
                    </div>
                    <textarea
                      value={customPersonality}
                      onChange={(e) => setCustomPersonality(e.target.value)}
                      placeholder="性格のカスタマイズ（任意）：明るくて元気、など"
                      className="w-full rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none"
                      rows={3}
                      maxLength={200}
                    />
                  </>
                )}
                {interviewerSuccess && <p className="text-sm text-green-600">保存しました</p>}
                <button
                  type="submit"
                  disabled={isSubmittingInterviewer || !selectedInterviewer}
                  className="btn-gradient-primary w-full rounded-xl py-3 font-semibold text-white disabled:opacity-50"
                >
                  {isSubmittingInterviewer ? '保存中...' : '保存する'}
                </button>
              </form>
            )}
          </div>

          {/* Help Section */}
          <div className="glass-card p-4">
            <button
              onClick={() => setActiveSection(activeSection === 'help' ? null : 'help')}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">❓</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">ヘルプ</div>
                  <div className="text-xs text-gray-500">よくある質問</div>
                </div>
              </div>
              <ChevronRight size={20} className={`text-gray-400 transition-transform ${activeSection === 'help' ? 'rotate-90' : ''}`} />
            </button>

            {activeSection === 'help' && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                {FAQ_ITEMS.map((item, index) => (
                  <details key={index} className="group rounded-xl bg-white/50 p-3">
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-800">
                      {item.question}
                      <span className="ml-2 text-emerald-500 transition-transform group-open:rotate-180">▼</span>
                    </summary>
                    <p className="mt-2 text-xs text-gray-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-3 font-semibold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </div>
    </>
  );
}
