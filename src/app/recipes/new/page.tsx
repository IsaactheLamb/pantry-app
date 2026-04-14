'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';
import { RecipeIngredient, RecipeStep, VariableUnit, IngredientTier } from '@/lib/types';

export default function NewRecipePage() {
  const router = useRouter();
  const addRecipe = useStore(s => s.addRecipe);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ itemName: '', amount: 0, unit: 'g', tier: 1 }]);
  const [steps, setSteps] = useState<RecipeStep[]>([{ id: uuidv4(), text: '' }]);

  const units: VariableUnit[] = ['g', 'ml', 'kg', 'l', 'tsp', 'tbsp', 'whole'];
  const tiers: IngredientTier[] = [1, 2, 3];

  function save() {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    addRecipe({
      id: uuidv4(), title: title.trim(), description: description.trim(),
      servings, prepTime, cookTime,
      ingredients: ingredients.filter(i => i.itemName.trim()),
      steps: steps.filter(s => s.text.trim()),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: now, updatedAt: now,
    });
    router.push('/recipes');
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        <button className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center" onClick={() => router.back()}>←</button>
        <h1 className="text-xl font-bold">New Recipe</h1>
      </div>

      <div className="space-y-4">
        <input className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base" placeholder="Recipe title *" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base min-h-[80px]" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500 mb-1 block">Servings</label><input type="number" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" value={servings} onChange={e => setServings(parseInt(e.target.value)||1)} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Prep (min)</label><input type="number" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" value={prepTime} onChange={e => setPrepTime(parseInt(e.target.value)||0)} /></div>
          <div><label className="text-xs text-gray-500 mb-1 block">Cook (min)</label><input type="number" className="w-full border border-gray-300 rounded-xl px-3 py-2 text-base" value={cookTime} onChange={e => setCookTime(parseInt(e.target.value)||0)} /></div>
        </div>

        <input className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />

        <section>
          <h2 className="font-semibold mb-2">Ingredients</h2>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Item name" value={ing.itemName} onChange={e => setIngredients(prev => prev.map((x,j) => j===i ? {...x, itemName: e.target.value} : x))} />
                <input type="number" className="w-16 border border-gray-300 rounded-lg px-2 py-2 text-sm" value={ing.amount||''} onChange={e => setIngredients(prev => prev.map((x,j) => j===i ? {...x, amount: parseFloat(e.target.value)||0} : x))} />
                <select className="border border-gray-300 rounded-lg px-1 py-2 text-sm" value={ing.unit} onChange={e => setIngredients(prev => prev.map((x,j) => j===i ? {...x, unit: e.target.value as VariableUnit} : x))}>
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <select className="border border-gray-300 rounded-lg px-1 py-2 text-sm" value={ing.tier} onChange={e => setIngredients(prev => prev.map((x,j) => j===i ? {...x, tier: parseInt(e.target.value) as IngredientTier} : x))}>
                  {tiers.map(t => <option key={t} value={t}>T{t}</option>)}
                </select>
                <button className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px]" onClick={() => setIngredients(prev => prev.filter((_,j) => j!==i))}>×</button>
              </div>
            ))}
            <button className="text-sm text-green-600 min-h-[44px]" onClick={() => setIngredients(prev => [...prev, { itemName: '', amount: 0, unit: 'g', tier: 1 }])}>+ Add ingredient</button>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-2">Steps</h2>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex gap-2">
                <span className="text-sm text-gray-400 pt-2 w-6">{i+1}.</span>
                <textarea className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[60px]" value={step.text} onChange={e => setSteps(prev => prev.map((x,j) => j===i ? {...x, text: e.target.value} : x))} />
                <button className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] self-start pt-1" onClick={() => setSteps(prev => prev.filter((_,j) => j!==i))}>×</button>
              </div>
            ))}
            <button className="text-sm text-green-600 min-h-[44px]" onClick={() => setSteps(prev => [...prev, { id: uuidv4(), text: '' }])}>+ Add step</button>
          </div>
        </section>

        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-base min-h-[44px] mt-2" onClick={save} disabled={!title.trim()}>Save Recipe</button>
      </div>
    </div>
  );
}
