'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { InterviewMode } from '@/types';

export default function InterviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    const savedMode = Cookies.get('interview_mode') as InterviewMode;

    if (savedMode) {
      const selectedInterviewer = Cookies.get('selected_interviewer');
      const interviewerName = Cookies.get('interviewer_name');

      if (selectedInterviewer && interviewerName) {
        router.replace(`/dig/interview/${savedMode}`);
      } else {
        router.replace('/dig/interview/select-interviewer');
      }
    } else {
      router.replace('/dig/interview/select-mode');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 spinner-warm"></div>
        <p className="text-stone-500">リダイレクト中...</p>
      </div>
    </div>
  );
}
