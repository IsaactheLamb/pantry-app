'use client';
import { useTimer } from '@/hooks/useTimer';

export default function TimerButton({ seconds }: { seconds: number }) {
  const { remaining, running, start, pause, reset, done } = useTimer(seconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = Math.round(((seconds - remaining) / seconds) * 100);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mt-2 select-none
      ${done
        ? 'bg-green-100 text-green-700'
        : running
          ? 'bg-amber-100 text-amber-800'
          : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
      } transition-colors`}>
      {/* Circular progress ring */}
      {!done && (
        <svg className="w-4 h-4 flex-shrink-0 -rotate-90" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
          <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray={`${2 * Math.PI * 6}`}
            strokeDashoffset={`${2 * Math.PI * 6 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000" />
        </svg>
      )}
      {done && <span className="text-base leading-none">✓</span>}

      {/* Countdown */}
      <span className="font-mono tabular-nums min-w-[2.8rem] text-center">
        {done ? 'Done!' : `${mins}:${String(secs).padStart(2, '0')}`}
      </span>

      {/* Controls */}
      {!done && (
        <button
          className="font-medium text-base leading-none w-5 h-5 flex items-center justify-center hover:scale-110 transition-transform"
          onClick={running ? pause : start}
          aria-label={running ? 'Pause timer' : 'Start timer'}
        >
          {running ? '⏸' : '▶'}
        </button>
      )}
      <button
        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
        onClick={reset}
        aria-label="Reset timer"
      >↺</button>
    </div>
  );
}
