'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, RecipeIngredient, RecipeStep, VariableUnit, IngredientTier } from '@/lib/types';

type Tab = 'url' | 'text';
type Stage = 'input' | 'loading' | 'preview' | 'error';

interface ParsedRecipe {
  title: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  tags: string[];
  ingredients: Array<{
    itemName: string; amount: number; unit: string; tier: number; optional?: boolean;
  }>;
  steps: Array<{ text: string; timerSeconds?: number }>;
  macrosPerServing?: { protein: number; carbs: number; fat: number; fibre: number };
}

const VALID_UNITS: VariableUnit[] = ['g', 'ml', 'kg', 'l', 'tsp', 'tbsp', 'whole'];

function sanitiseIngredient(raw: ParsedRecipe['ingredients'][0]): RecipeIngredient {
  const unit: VariableUnit = VALID_UNITS.includes(raw.unit as VariableUnit)
    ? (raw.unit as VariableUnit)
    : 'whole';
  const tier: IngredientTier = ([1, 2, 3] as number[]).includes(raw.tier)
    ? (raw.tier as IngredientTier)
    : 3;
  return {
    itemName: String(raw.itemName ?? '').toLowerCase().trim(),
    amount: Number(raw.amount) || 1,
    unit,
    tier,
    optional: raw.optional === true,
  };
}

function sanitiseStep(raw: ParsedRecipe['steps'][0], index: number): RecipeStep {
  return {
    id: uuidv4(),
    text: String(raw.text ?? `Step ${index + 1}`),
    timerSeconds: raw.timerSeconds != null && raw.timerSeconds > 0 ? Number(raw.timerSeconds) : undefined,
  };
}

export default function ImportRecipeModal({ onClose }: { onClose: () => void }) {
  const addRecipe = useStore(s => s.addRecipe);
  const [tab, setTab] = useState<Tab>('url');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [stage, setStage] = useState<Stage>('input');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ParsedRecipe | null>(null);

  async function handleImport() {
    const isUrl = tab === 'url';
    const value = isUrl ? urlInput.trim() : textInput.trim();
    if (!value) return;

    setStage('loading');
    setError('');

    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isUrl ? { url: value } : { text: value }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }
      setPreview(data.recipe as ParsedRecipe);
      setStage('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setStage('error');
    }
  }

  function handleConfirm() {
    if (!preview) return;
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: uuidv4(),
      title: preview.title ?? 'Imported Recipe',
      description: preview.description ?? '',
      servings: Number(preview.servings) || 2,
      prepTime: Number(preview.prepTime) || 0,
      cookTime: Number(preview.cookTime) || 0,
      tags: Array.isArray(preview.tags) ? preview.tags.map(String) : [],
      ingredients: (preview.ingredients ?? []).map(sanitiseIngredient),
      steps: (preview.steps ?? []).map(sanitiseStep),
      macrosPerServing: preview.macrosPerServing,
      createdAt: now,
      updatedAt: now,
    };
    addRecipe(recipe);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[92dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Import Recipe</h2>
          <button className="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center text-xl"
            onClick={onClose}>×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">

          {/* Tabs */}
          {(stage === 'input' || stage === 'error') && (
            <>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
                {(['url', 'text'] as Tab[]).map(t => (
                  <button key={t}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                    onClick={() => { setTab(t); setError(''); setStage('input'); }}>
                    {t === 'url' ? '🔗 From URL' : '📋 Paste Text'}
                  </button>
                ))}
              </div>

              {tab === 'url' ? (
                <div>
                  <input
                    autoFocus
                    type="url"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://www.example.com/recipe/..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
                  />
                  <p className="text-xs text-gray-400 mt-2">Paste any recipe page URL — the page will be fetched and parsed by AI.</p>
                </div>
              ) : (
                <div>
                  <textarea
                    autoFocus
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm min-h-[180px] resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Paste recipe text here — ingredients, steps, anything…"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                  />
                </div>
              )}

              {stage === 'error' && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <p className="font-medium mb-0.5">Import failed</p>
                  <p>{error}</p>
                  {error.includes('GROQ_API_KEY') && (
                    <p className="mt-1 text-xs">Add your key to <code className="bg-red-100 px-1 rounded">.env.local</code> and restart the dev server.</p>
                  )}
                </div>
              )}

              <button
                className="w-full mt-4 bg-green-600 text-white py-3 rounded-xl font-semibold text-base min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleImport}
                disabled={tab === 'url' ? !urlInput.trim() : !textInput.trim()}>
                Parse with AI →
              </button>
            </>
          )}

          {/* Loading */}
          {stage === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Analysing recipe with Groq AI…</p>
            </div>
          )}

          {/* Preview */}
          {stage === 'preview' && preview && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-green-700">
                <span>✓</span>
                <span>Recipe parsed successfully — review before saving.</span>
              </div>

              {/* Title & meta */}
              <h3 className="text-xl font-bold text-gray-900 mb-1">{preview.title}</h3>
              {preview.description && <p className="text-sm text-gray-500 mb-2">{preview.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-3">
                <span>{preview.servings} servings</span>
                {preview.prepTime > 0 && <span>{preview.prepTime}m prep</span>}
                {preview.cookTime > 0 && <span>{preview.cookTime}m cook</span>}
              </div>
              {preview.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {preview.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}

              {/* Ingredients */}
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Ingredients ({preview.ingredients.length})</h4>
              <ul className="space-y-1 mb-4">
                {preview.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ing.tier === 1 ? 'bg-gray-300' : ing.tier === 2 ? 'bg-blue-300' : 'bg-orange-400'}`} />
                    <span className="font-medium">{ing.amount} {ing.unit}</span>
                    <span className="capitalize">{ing.itemName}</span>
                    {ing.optional && <span className="text-gray-400 text-xs">(opt)</span>}
                    <span className="ml-auto text-xs text-gray-300">T{ing.tier}</span>
                  </li>
                ))}
              </ul>

              {/* Steps */}
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Steps ({preview.steps.length})</h4>
              <ol className="space-y-2 mb-4">
                {preview.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                    <div>
                      <p>{step.text}</p>
                      {step.timerSeconds && step.timerSeconds > 0 && (
                        <span className="text-xs text-gray-400">⏱ {Math.floor(step.timerSeconds / 60)}m</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {/* Macros */}
              {preview.macrosPerServing && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-4 gap-2 text-center">
                  {[['P', preview.macrosPerServing.protein, 'protein'], ['C', preview.macrosPerServing.carbs, 'carbs'], ['F', preview.macrosPerServing.fat, 'fat'], ['Fi', preview.macrosPerServing.fibre, 'fibre']].map(([abbr, val, label]) => (
                    <div key={label as string}>
                      <div className="text-base font-bold text-gray-900">{Number(val).toFixed(0)}<span className="text-xs font-normal text-gray-400">g</span></div>
                      <div className="text-xs text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium min-h-[44px]"
                  onClick={() => { setStage('input'); setPreview(null); }}>
                  ← Try Again
                </button>
                <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm min-h-[44px]"
                  onClick={handleConfirm}>
                  Save Recipe ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
