'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '@/contexts/AuthContext';
import { FixedUserData } from '@/types';

export default function Result() {
  const router = useRouter();
  const { user } = useAuth();
  const [interviewData, setInterviewData] = useState<Partial<FixedUserData> | null>(null);
  const [article, setArticle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Cookieからインタビューデータを取得
    const dataStr = Cookies.get('interview_data');
    if (!dataStr) {
      router.push('/');
      return;
    }

    try {
      const data = JSON.parse(dataStr);
      setInterviewData(data);
      generateArticle(data);

      // ログインユーザーの場合はFirestoreに保存
      if (user) {
        saveToFirestore(data);
      }
    } catch (error) {
      console.error('Error parsing interview data:', error);
      router.push('/');
    }
  }, [router, user]);

  const generateArticle = async (data: Partial<FixedUserData>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interviewData: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const result = await response.json();
      setArticle(result.article);
    } catch (error) {
      console.error('Error generating article:', error);
      setArticle('記事の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToFirestore = async (data: Partial<FixedUserData>) => {
    if (!user) return;

    try {
      const messagesStr = Cookies.get('interview_messages');
      const interviewerIdStr = Cookies.get('selected_interviewer');
      const sessionIdStr = Cookies.get('guest_session_id');

      if (!messagesStr || !interviewerIdStr || !sessionIdStr) {
        console.error('Missing data for Firestore save');
        return;
      }

      const messages = JSON.parse(messagesStr);

      const response = await fetch('/api/save-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          interviewData: data,
          messages,
          interviewerId: interviewerIdStr,
          sessionId: sessionIdStr,
        }),
      });

      if (response.ok) {
        setIsSaved(true);
        console.log('インタビューデータをFirestoreに保存しました');
      }
    } catch (error) {
      console.error('Error saving to Firestore:', error);
    }
  };

  const handleCopyArticle = async () => {
    try {
      await navigator.clipboard.writeText(article);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleStartNew = () => {
    // Cookieをクリアして新しいインタビューを開始
    Cookies.remove('interview_data');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          </div>
          <p className="text-xl font-semibold text-gray-700">
            インタビュー記事を生成中...
          </p>
          <p className="mt-2 text-gray-500">少々お待ちください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white px-4 py-12">
      <main className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            インタビュー記事が完成しました
          </h1>
          <p className="text-lg text-gray-600">
            あなたの魅力を引き出した記事をご覧ください
          </p>
        </div>

        {/* プロフィール概要 */}
        {interviewData && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">
              プロフィール
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <span className="font-semibold text-gray-700">名前:</span>{' '}
                {interviewData.name}
              </div>
              <div>
                <span className="font-semibold text-gray-700">ニックネーム:</span>{' '}
                {interviewData.nickname}
              </div>
              <div>
                <span className="font-semibold text-gray-700">性別:</span>{' '}
                {interviewData.gender}
              </div>
              <div>
                <span className="font-semibold text-gray-700">年齢:</span>{' '}
                {interviewData.age}歳
              </div>
              <div>
                <span className="font-semibold text-gray-700">居住地:</span>{' '}
                {interviewData.location}
              </div>
              <div>
                <span className="font-semibold text-gray-700">職業:</span>{' '}
                {interviewData.occupation}
              </div>
            </div>
            {interviewData.occupationDetail && (
              <div className="mt-3">
                <span className="font-semibold text-gray-700">職業詳細:</span>{' '}
                {interviewData.occupationDetail}
              </div>
            )}
          </div>
        )}

        {/* インタビュー記事 */}
        <div className="mb-8 rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">インタビュー記事</h2>
            <button
              onClick={handleCopyArticle}
              className={`rounded-full px-6 py-2 font-semibold text-white transition-colors ${
                copySuccess
                  ? 'bg-green-500'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {copySuccess ? 'コピーしました！' : 'コピー'}
            </button>
          </div>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {article}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-center">
          <button
            onClick={handleStartNew}
            className="rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
          >
            新しいインタビューを始める
          </button>
          <button
            onClick={() => router.push('/')}
            className="rounded-full border-2 border-purple-600 bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-md transition-all hover:bg-purple-50 hover:shadow-lg"
          >
            トップに戻る
          </button>
        </div>
      </main>
    </div>
  );
}
