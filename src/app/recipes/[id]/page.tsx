'use client';
import { useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { checkCookable } from '@/lib/cookable';
import TimerButton from '@/components/TimerButton';

function fmt(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1);
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const recipe = useStore(s => s.recipes.find(r => r.id === id));
  const pantry = useStore(s => s.pantry);
  const deleteRecipe = useStore(s => s.deleteRecipe);
  const [scaledServings, setScaledServings] = useState(recipe?.servings ?? 1);

  if (!recipe) return <div className="p-4 text-gray-500">Recipe not found.</div>;

  const scale = scaledServings / recipe.servings;
  const { cookable, missing } = checkCookable(recipe, pantry);

  function handleDelete() {
    if (confirm('Delete this recipe?')) { deleteRecipe(id); router.push('/recipes'); }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center" onClick={() => router.back()}>←</button>
        <h1 className="text-xl font-bold flex-1 leading-tight">{recipe.title}</h1>
        <button className="text-red-400 text-sm min-h-[44px] px-2" onClick={handleDelete}>Delete</button>
      </div>

      {recipe.description && <p className="text-gray-600 mb-4 text-sm">{recipe.description}</p>}

      {/* Status badge */}
      {cookable
        ? <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700 font-medium">✓ Ready to cook!</div>
        : <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
            <p className="font-medium mb-1">Missing {missing.length} ingredient{missing.length!==1?'s':''}</p>
            <ul className="list-disc list-inside space-y-0.5">{missing.map(m => <li key={m.name} className="capitalize">{m.name} ({m.reason.replace(/_/g,' ')})</li>)}</ul>
          </div>
      }

      {/* Servings scaler */}
      <div className="flex items-center gap-4 mb-5 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
        <span className="text-sm text-gray-600 flex-1">Servings</span>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl font-light"
            onClick={() => setScaledServings(s => Math.max(1, s-1))}>−</button>
          <span className="w-8 text-center font-semibold text-lg">{scaledServings}</span>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl font-light"
            onClick={() => setScaledServings(s => s+1)}>+</button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-4 text-sm text-gray-500 mb-5">
        {recipe.prepTime > 0 && <span>{recipe.prepTime}m prep</span>}
        {recipe.cookTime > 0 && <span>{recipe.cookTime}m cook</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-5">
          {recipe.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
        </div>
      )}

      {/* Ingredients */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-3">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ing.tier===1?'bg-gray-300':ing.tier===2?'bg-blue-300':'bg-orange-400'}`}/>
              <span className="text-gray-800">{fmt(ing.amount * scale)} {ing.unit}</span>
              <span className="capitalize text-gray-700">{ing.itemName}</span>
              {ing.optional && <span className="text-gray-400 text-xs">(optional)</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="mb-6">
        <h2 className="font-semibold text-lg mb-3">Instructions</h2>
        <ol className="space-y-3">
          {recipe.steps.map((step, i) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-semibold">{i+1}</span>
              <div>
                <p className="text-sm text-gray-800 leading-relaxed">{step.text}</p>
                {step.timerSeconds && <TimerButton seconds={step.timerSeconds} />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Macros */}
      {recipe.macrosPerServing && (
        <section className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold mb-3 text-sm">Nutrition per serving {scaledServings !== recipe.servings && `(×${fmt(scale)})`}</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {([['Protein', recipe.macrosPerServing.protein * scale, 'g'], ['Carbs', recipe.macrosPerServing.carbs * scale, 'g'], ['Fat', recipe.macrosPerServing.fat * scale, 'g'], ['Fibre', recipe.macrosPerServing.fibre * scale, 'g']] as [string, number, string][]).map(([label, val, unit]) => (
              <div key={label}>
                <div className="text-lg font-bold text-gray-900">{fmt(val)}<span className="text-xs font-normal text-gray-400">{unit}</span></div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link href={`/recipes/${id}/cook?servings=${scaledServings}`}
        className="block w-full bg-green-600 text-white text-center py-3 rounded-xl font-semibold text-base min-h-[44px] mb-3">
        Start Cooking →
      </Link>
    </div>
  );
}
