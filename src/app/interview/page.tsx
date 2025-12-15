'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { getInterviewer } from '@/lib/interviewers';
import { ChatMessage, InterviewerId } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function Interview() {
  const router = useRouter();
  const { user } = useAuth();
  const [interviewerId, setInterviewerId] = useState<InterviewerId | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const interviewer = interviewerId ? getInterviewer(interviewerId) : null;

  useEffect(() => {
    // セッションとインタビュワーを確認
    const guestSessionId = Cookies.get('guest_session_id');
    const selectedInterviewer = Cookies.get('selected_interviewer') as InterviewerId;

    if (!guestSessionId || !selectedInterviewer) {
      router.push('/');
      return;
    }

    console.log('Interview initialized. User:', user ? user.uid : 'not yet loaded');

    setInterviewerId(selectedInterviewer);

    // 初期メッセージを設定
    const initialMessage: ChatMessage = {
      role: 'assistant',
      content: `こんにちは！私は${getInterviewer(selectedInterviewer)?.name}です。今日はあなたのことをたくさん教えてください。まず、お名前を教えていただけますか？`,
      timestamp: new Date(),
    };

    setMessages([initialMessage]);
  }, [router, user]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !interviewerId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // APIにメッセージを送信
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          interviewerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // インタビュー完了チェック
      if (data.isCompleted) {
        setIsCompleted(true);
        const updatedMessages = [...messages, userMessage, assistantMessage];

        console.log('Interview completed! Data:', data.interviewData);

        // interviewDataの構造を拡張（fixed + dynamic）
        const interviewDataToSave = {
          fixed: {
            name: data.interviewData.name,
            nickname: data.interviewData.nickname,
            gender: data.interviewData.gender,
            age: data.interviewData.age,
            location: data.interviewData.location,
            occupation: data.interviewData.occupation,
            occupationDetail: data.interviewData.occupationDetail,
            selectedInterviewer: interviewerId,
          },
          dynamic: data.interviewData.dynamic || {}, // DynamicDataを含める
        };

        console.log('Saving to Firestore immediately...');

        // Firestoreに直接保存
        try {
          const saveResponse = await fetch('/api/save-interview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.uid,
              interviewData: interviewDataToSave,
              messages: updatedMessages,
              interviewerId: interviewerId,
              sessionId: Cookies.get('guest_session_id'),
            }),
          });

          if (!saveResponse.ok) {
            throw new Error('Failed to save interview');
          }

          const saveResult = await saveResponse.json();
          console.log('Interview saved to Firestore:', saveResult.interviewId);

          // 保存成功後、結果ページへ遷移（IDをURLパラメータとして渡す）
          setTimeout(() => {
            router.push(`/result?id=${saveResult.interviewId}`);
          }, 2000);
        } catch (error) {
          console.error('Error saving interview:', error);
          alert('インタビューの保存に失敗しました。もう一度お試しください。');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!interviewer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* ヘッダー */}
      <div className="border-b bg-white px-4 py-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image
                src={interviewer.gender === '女性' ? '/image/icon_lady-interviewer.png' : '/image/icon_man-interviewer.png'}
                alt={interviewer.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {interviewer.name}
              </h2>
              <p className="text-sm text-gray-500">{interviewer.character}</p>
            </div>
          </div>
          {isCompleted && (
            <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
              インタビュー完了
            </div>
          )}
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl bg-white px-5 py-3 shadow-sm">
                <div className="flex gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isCompleted
                ? 'インタビューは完了しました'
                : 'メッセージを入力...'
            }
            disabled={isLoading || isCompleted}
            className="flex-1 rounded-full border border-gray-300 px-5 py-3 focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading || isCompleted}
            className="rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:bg-gray-300"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
