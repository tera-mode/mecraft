'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Pickaxe, User, Hammer, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { user, signInAsGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestStart = async () => {
    setIsLoading(true);
    try {
      await signInAsGuest();

      const sessionId = uuidv4();
      Cookies.set('guest_session_id', sessionId, { expires: 30, path: '/' });

      // ゲストはスワイプ診断へ直行
      router.push('/dig/swipe');
    } catch (error) {
      console.error('Failed to start as guest:', error);
      alert('ゲストとして開始できませんでした。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginStart = () => {
    router.push('/login');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-main px-4 py-12">
      {/* 装飾用グラデーションオーブ */}
      <div className="gradient-orb gradient-orb-emerald absolute -left-32 top-20 h-80 w-80" />
      <div className="gradient-orb gradient-orb-amber absolute -right-32 bottom-20 h-72 w-72" />

      {/* マイページボタン（ログインユーザーのみ） */}
      {user && !user.isAnonymous && (
        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={() => router.push('/mypage')}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-semibold text-white shadow-lg"
          >
            マイページ
          </button>
        </div>
      )}

      <main className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        {/* ヘッダー */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/image/mecraft_logo.png"
            alt="じぶんクラフト"
            width={480}
            height={128}
            priority
          />
          <p className="text-xl text-stone-700 md:text-2xl">
            自分の特徴を掘って、集めて、つくろう
          </p>
        </div>

        {/* サービスの流れ */}
        <div className="glass-card flex max-w-2xl flex-col gap-6 p-8 shadow-xl">
          <h2 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-semibold text-transparent">
            3ステップで自分を知る
          </h2>
          <div className="grid gap-4 text-left md:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/40 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-200">
                <Pickaxe size={24} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-stone-800">じぶんを「ほる」</h3>
              <p className="text-sm text-stone-500">
                スワイプ診断やAIインタビューで自分の特徴を掘り出す
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/40 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-200">
                <User size={24} className="text-emerald-600" />
              </div>
              <h3 className="font-bold text-stone-800">じぶんを「あつめる」</h3>
              <p className="text-sm text-stone-500">
                発見した特徴がどんどん蓄積。自分の特徴図鑑ができる
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/40 p-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-blue-200">
                <Hammer size={24} className="text-sky-600" />
              </div>
              <h3 className="font-bold text-stone-800">じぶんを「つくる」</h3>
              <p className="text-sm text-stone-500">
                集めた特徴から自己PR文やプロフィールを自動生成
              </p>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex w-full max-w-md flex-col gap-4">
          <button
            onClick={handleGuestStart}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles size={20} />
            {isLoading ? '準備中...' : 'ためしに始める（登録なし）'}
          </button>
          <button
            onClick={() => router.push('/login?mode=signup')}
            className="rounded-xl border-2 border-emerald-300 bg-white/80 px-8 py-4 text-lg font-semibold text-emerald-700 shadow-md transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            新規会員登録して始める
          </button>
          <button
            onClick={handleLoginStart}
            className="text-stone-500 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-600 hover:decoration-emerald-500"
          >
            ログイン
          </button>
        </div>

        {/* Legal links */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-500">
          <a href="https://www.laiv.jp/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">利用規約</a>
          <a href="https://www.laiv.jp/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">プライバシーポリシー</a>
          <a href="https://www.laiv.jp/contact/service" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600">お問い合わせ</a>
        </div>
      </main>
    </div>
  );
}
