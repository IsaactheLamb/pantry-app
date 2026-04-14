'use client';
import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const releaseRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!active) { releaseRef.current?.(); releaseRef.current = null; return; }
    let cancelled = false;
    import('../lib/wakeLock').then(({ requestWakeLock }) => {
      if (cancelled) return;
      requestWakeLock().then(release => { if (!cancelled) releaseRef.current = release; });
    });
    return () => { cancelled = true; releaseRef.current?.(); releaseRef.current = null; };
  }, [active]);
}
