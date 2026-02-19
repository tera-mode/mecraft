'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRandomQuestions, SwipeQuestion } from '@/lib/swipeQuestions';
import SwipeCard from '@/components/swipe/SwipeCard';
import { usePageHeader } from '@/contexts/PageHeaderContext';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

interface SwipeAnswer {
  questionId: string;
  optionA: string;
  optionB: string;
  selected: 'A' | 'B';
  categoryHint: string;
}

export default function SwipePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SwipeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SwipeAnswer[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageHeader({ title: '1分じぶん掘り', showBackButton: true, onBack: () => router.push('/dig') });

  useEffect(() => {
    // Check daily limit
    const lastDate = localStorage.getItem('lastSwipeDate');
    if (lastDate === new Date().toISOString().slice(0, 10)) {
      router.push('/dig');
      return;
    }
    setQuestions(getRandomQuestions(5));
  }, [router]);

  const handleSelect = useCallback((selected: 'A' | 'B') => {
    if (isAnimating || isSubmitting) return;

    const question = questions[currentIndex];
    const answer: SwipeAnswer = {
      questionId: question.id,
      optionA: question.optionA,
      optionB: question.optionB,
      selected,
      categoryHint: question.categoryHint,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      // All questions answered - save daily limit and submit
      localStorage.setItem('lastSwipeDate', new Date().toISOString().slice(0, 10));
      submitAnswers(newAnswers);
    }
  }, [currentIndex, questions, answers, isAnimating, isSubmitting]);

  const submitAnswers = async (allAnswers: SwipeAnswer[]) => {
    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/swipe-diagnose', {
        method: 'POST',
        body: JSON.stringify({ answers: allAnswers }),
      });

      if (!response.ok) throw new Error('Failed to diagnose');

      const data = await response.json();

      // Store results in sessionStorage for the result page
      sessionStorage.setItem('swipe-result', JSON.stringify(data.traits));
      router.push('/dig/swipe/result');
    } catch (error) {
      console.error('Error submitting swipe answers:', error);
      alert('診断に失敗しました。もう一度お試しください。');
      setIsSubmitting(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm mb-4"></div>
        <p className="text-lg font-semibold text-stone-700">あなたの特徴を分析中...</p>
        <p className="mt-2 text-sm text-stone-500">AIが回答を分析しています</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <SwipeCard
          question={questions[currentIndex]}
          currentIndex={currentIndex}
          totalCount={questions.length}
          onSelect={handleSelect}
          isAnimating={isAnimating}
        />
      </div>
    </div>
  );
}
