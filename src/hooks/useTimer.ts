'use client';
import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) { setRunning(false); return; }
    const id = setInterval(() => setRemaining(r => { if (r <= 1) { setRunning(false); return 0; } return r - 1; }), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => { setRunning(false); setRemaining(initialSeconds); }, [initialSeconds]);

  return { remaining, running, start, pause, reset, done: remaining === 0 };
}
