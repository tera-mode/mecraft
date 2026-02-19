import { useState, useRef, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

interface UseVoiceChatOptions {
  interviewerId?: string;
  onTranscript: (text: string) => void;
}

export function useVoiceChat({ interviewerId = 'female_01', onTranscript }: UseVoiceChatOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm;codecs=opus');

  // AudioContextを確保・解放（ユーザージェスチャー内で呼ぶことでiOSの再生ロックを解除）
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AC();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  // 音声モード切り替え（ONにする際にAudioContextを解放）
  const toggleVoiceMode = useCallback((on: boolean) => {
    if (on) {
      ensureAudioContext();
    }
    setIsVoiceModeOn(on);
  }, [ensureAudioContext]);

  // 録音開始
  const startRecording = useCallback(async () => {
    if (voiceState !== 'idle') return;

    // iOSでの音声再生ロック解除（ユーザージェスチャー内で実行される）
    ensureAudioContext();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // iOSではwebm非対応のためmp4にフォールバック
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setVoiceState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // ブラウザ互換のbase64変換
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const audioBase64 = btoa(binary);

        // エンコード形式をAPIに伝える（iOS対応）
        const encoding = mimeType.startsWith('audio/mp4') ? 'MP3' : 'WEBM_OPUS';

        try {
          const res = await authenticatedFetch('/api/stt', {
            method: 'POST',
            body: JSON.stringify({ audioBase64, encoding }),
          });
          const { transcript } = await res.json();
          if (transcript?.trim()) {
            onTranscript(transcript.trim());
          }
        } catch (err) {
          console.error('STT error:', err);
        } finally {
          setVoiceState('idle');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState('recording');
    } catch (err) {
      console.error('マイクの取得に失敗しました:', err);
      alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
    }
  }, [voiceState, onTranscript, ensureAudioContext]);

  // 録音停止
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  // AI返答テキストをTTSで再生
  const speakText = useCallback(async (text: string) => {
    if (!isVoiceModeOn) return;
    setVoiceState('speaking');
    try {
      const res = await authenticatedFetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text, interviewerId }),
      });
      const { audioBase64 } = await res.json();

      // AudioContext経由で再生（iOSでの複数async後の再生に対応）
      if (audioContextRef.current) {
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        try {
          const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => {
            audioSourceRef.current = null;
            setVoiceState('idle');
          };
          // 既存の再生を停止してから新しい再生を開始
          audioSourceRef.current?.stop();
          audioSourceRef.current = source;
          source.start(0);
          return;
        } catch (decodeErr) {
          console.error('AudioContext decode failed, falling back to Audio element:', decodeErr);
        }
      }

      // フォールバック: HTMLAudioElement（AudioContextが使えない場合）
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => {
        audioRef.current = null;
        setVoiceState('idle');
      };
      audio.onerror = () => {
        audioRef.current = null;
        setVoiceState('idle');
      };
      audio.play().catch(err => {
        console.error('Audio play failed:', err);
        setVoiceState('idle');
      });
    } catch (err) {
      console.error('TTS error:', err);
      setVoiceState('idle');
    }
  }, [isVoiceModeOn, interviewerId]);

  // 音声再生を止める
  const stopSpeaking = useCallback(() => {
    audioSourceRef.current?.stop();
    audioSourceRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    isVoiceModeOn,
    setIsVoiceModeOn: toggleVoiceMode,
    startRecording,
    stopRecording,
    speakText,
    stopSpeaking,
  };
}
