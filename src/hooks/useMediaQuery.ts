'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 初期値を設定
    const media = window.matchMedia(query);
    setMatches(media.matches);

    // リスナーを設定
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);

    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

// 便利なプリセット
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
