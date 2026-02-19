'use client';
import { Mic, Volume2, Loader2, Square } from 'lucide-react';

type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

interface VoiceButtonProps {
  voiceState: VoiceState;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
}

export function VoiceButton({ voiceState, onPressStart, onPressEnd, disabled }: VoiceButtonProps) {
  const isRecording = voiceState === 'recording';
  const isProcessing = voiceState === 'processing';
  const isSpeaking = voiceState === 'speaking';

  const handleClick = () => {
    if (isRecording) {
      onPressEnd();
    } else {
      onPressStart();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing || isSpeaking}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0
          ${isRecording ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40 animate-pulse' : ''}
          ${isProcessing || isSpeaking ? 'bg-stone-400 cursor-not-allowed' : ''}
          ${!isRecording && !isProcessing && !isSpeaking ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-95' : ''}
        `}
      >
        {isProcessing && <Loader2 className="w-5 h-5 text-white animate-spin" />}
        {isSpeaking && <Volume2 className="w-5 h-5 text-white animate-bounce" />}
        {isRecording && <Square className="w-4 h-4 text-white fill-white" />}
        {voiceState === 'idle' && <Mic className="w-5 h-5 text-white" />}
      </button>
      <span className="text-[10px] text-stone-500 whitespace-nowrap leading-none">
        {isRecording ? 'タップで停止' : isProcessing ? '変換中...' : isSpeaking ? '読み上げ中' : '音声入力'}
      </span>
    </div>
  );
}
