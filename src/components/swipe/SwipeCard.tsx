'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { SwipeQuestion } from '@/lib/swipeQuestions';

interface SwipeCardProps {
  question: SwipeQuestion;
  currentIndex: number;
  totalCount: number;
  onSelect: (selectedOption: 'A' | 'B') => void;
  isAnimating: boolean;
}

const SWIPE_THRESHOLD = 100;

export default function SwipeCard({ question, currentIndex, totalCount, onSelect, isAnimating }: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flyOff, setFlyOff] = useState<'left' | 'right' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 最初のカード表示時にタッチデバイスのみスワイプヒントアニメーション
  useEffect(() => {
    if (currentIndex !== 0) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;
    const timer = setTimeout(() => setShowHint(true), 400);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleDragStart = useCallback((clientX: number) => {
    if (isAnimating || flyOff) return;
    startXRef.current = clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
  }, [isAnimating, flyOff]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - startXRef.current;
    setDragX(dx);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_THRESHOLD) {
      const direction = dragX > 0 ? 'right' : 'left';
      setFlyOff(direction);
      setTimeout(() => {
        setFlyOff(null);
        setDragX(0);
        onSelect(direction === 'left' ? 'A' : 'B');
      }, 300);
    } else {
      setDragX(0);
    }
  }, [dragX, onSelect]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      handleDragEnd();
    }
  }, [handleDragEnd]);

  // Calculate visual transforms
  const rotation = dragX * 0.1;
  const showAOverlay = dragX < -30;
  const showBOverlay = dragX > 30;

  let cardStyle: React.CSSProperties = {};
  if (flyOff === 'left') {
    cardStyle = { transform: 'translateX(-150%) rotate(-30deg)', transition: 'transform 0.3s ease-out', opacity: 0 };
  } else if (flyOff === 'right') {
    cardStyle = { transform: 'translateX(150%) rotate(30deg)', transition: 'transform 0.3s ease-out', opacity: 0 };
  } else if (isDragging) {
    cardStyle = { transform: `translateX(${dragX}px) rotate(${rotation}deg)`, transition: 'none' };
  } else if (showHint) {
    cardStyle = { animation: 'swipe-hint 1s ease-in-out', transform: 'translateX(0) rotate(0deg)' };
  } else {
    cardStyle = { transform: 'translateX(0) rotate(0deg)', transition: 'transform 0.3s ease-out' };
  }

  if (isAnimating && !flyOff) {
    cardStyle = { ...cardStyle, opacity: 0, transform: 'translateX(40px)', transition: 'all 0.3s ease-out' };
  }

  return (
    <div>
      {/* Swipe hint animation (touch devices only) */}
      {showHint && (
        <style>{`
          @keyframes swipe-hint {
            0%   { transform: translateX(0) rotate(0deg); }
            20%  { transform: translateX(-24px) rotate(-2deg); }
            50%  { transform: translateX(24px) rotate(2deg); }
            80%  { transform: translateX(-8px) rotate(-0.5deg); }
            100% { transform: translateX(0) rotate(0deg); }
          }
        `}</style>
      )}

      {/* Progress */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalCount }, (_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i <= currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-stone-200'
            }`}
          />
        ))}
      </div>

      <p className="mb-6 text-center text-sm text-stone-500">
        {currentIndex + 1} / {totalCount}
      </p>

      {/* Swipe hint */}
      <div className="mb-3 flex justify-between px-4 text-xs text-stone-400">
        <span>← A</span>
        <span>B →</span>
      </div>

      {/* Draggable card */}
      <div
        className="glass-card relative cursor-grab select-none rounded-2xl border-2 border-amber-100 p-6 active:cursor-grabbing"
        style={cardStyle}
        onAnimationEnd={() => setShowHint(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Option A overlay (swipe left) */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-amber-400/20 transition-opacity"
          style={{ opacity: showAOverlay ? Math.min(Math.abs(dragX) / 150, 0.8) : 0 }}
        >
          <span className="rounded-xl bg-amber-400 px-6 py-3 text-2xl font-bold text-white shadow-lg">A</span>
        </div>

        {/* Option B overlay (swipe right) */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-emerald-400/20 transition-opacity"
          style={{ opacity: showBOverlay ? Math.min(Math.abs(dragX) / 150, 0.8) : 0 }}
        >
          <span className="rounded-xl bg-emerald-400 px-6 py-3 text-2xl font-bold text-white shadow-lg">B</span>
        </div>

        <h3 className="mb-6 text-center text-lg font-bold text-stone-800">
          あなたはどっち？
        </h3>

        {/* Option labels */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-700">A</span>
          <span className="text-sm font-medium text-stone-700">{question.optionA}</span>
        </div>

        <div className="mb-2 text-center text-xs text-stone-400">or</div>

        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-sm font-bold text-emerald-700">B</span>
          <span className="text-sm font-medium text-stone-700">{question.optionB}</span>
        </div>
      </div>

      {/* Fallback tap buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onSelect('A')}
          className="flex-1 rounded-xl border-2 border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-700 transition-all hover:border-amber-400 hover:bg-amber-100 btn-press"
        >
          A
        </button>
        <button
          onClick={() => onSelect('B')}
          className="flex-1 rounded-xl border-2 border-emerald-200 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 transition-all hover:border-emerald-400 hover:bg-emerald-100 btn-press"
        >
          B
        </button>
      </div>
    </div>
  );
}
