'use client';
import { useState } from 'react';
import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useTimer } from '@/hooks/useTimer';

function TimerButton({ seconds }: { seconds: number }) {
  const { remaining, running, start, pause, reset, done } = useTimer(seconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mt-2 ${done ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
      <span className="font-mono">{mins}:{String(secs).padStart(2,'0')}</span>
      {!done && (
        <button className="font-medium" onClick={running ? pause : start}>
          {running ? '⏸' : '▶'}
        </button>
      )}
      {done && <span>✓ Done!</span>}
      <button className="text-gray-400 text-xs" onClick={reset}>↺</button>
    </div>
  );
}

function CookModeContent({ id, servings }: { id: string; servings: number }) {
  const router = useRouter();
  const recipe = useStore(s => s.recipes.find(r => r.id === id));
  const markCooked = useStore(s => s.markCooked);
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);

  useWakeLock(true);

  if (!recipe) return <div className="p-4">Recipe not found.</div>;

  const scale = servings / recipe.servings;

  function handleFinish() {
    markCooked(id, servings);
    setFinished(true);
  }

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-green-50">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enjoy your meal!</h1>
        <p className="text-gray-600 mb-6">{recipe.title} • {servings} servings</p>
        <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold" onClick={() => router.push('/recipes')}>
          Back to Recipes
        </button>
      </div>
    );
  }

  const step = recipe.steps[currentStep];
  const isLast = currentStep === recipe.steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button className="min-h-[44px] min-w-[44px] flex items-center text-gray-500" onClick={() => router.back()}>←</button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-900 text-sm">{recipe.title}</h1>
          <p className="text-xs text-gray-500">Step {currentStep + 1} of {recipe.steps.length}</p>
        </div>
        <div className="w-[44px]" />
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-green-600 transition-all" style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }} />
      </div>

      {/* Step content */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Ingredient summary on first step */}
        {currentStep === 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">Ingredients for {servings} servings</h3>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="text-sm text-gray-700">
                  <span className="font-medium">{ing.amount * scale % 1 === 0 ? ing.amount * scale : (ing.amount * scale).toFixed(1)} {ing.unit}</span> {ing.itemName}
                  {ing.optional && <span className="text-gray-400"> (optional)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1">
          <p className="text-2xl leading-relaxed text-gray-900 font-medium">{step.text}</p>
          {step.timerSeconds && <TimerButton seconds={step.timerSeconds} />}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
        {currentStep > 0 && (
          <button className="flex-1 py-3 border border-gray-300 rounded-xl font-medium min-h-[44px]"
            onClick={() => setCurrentStep(s => s - 1)}>← Back</button>
        )}
        {!isLast ? (
          <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold min-h-[44px]"
            onClick={() => setCurrentStep(s => s + 1)}>Next →</button>
        ) : (
          <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold min-h-[44px]"
            onClick={handleFinish}>Finish Cooking ✓</button>
        )}
      </div>
    </div>
  );
}

export default function CookModePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const servings = parseInt(searchParams.get('servings') ?? '1');
  return <CookModeContent id={id} servings={servings} />;
}
