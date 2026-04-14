'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { checkCookable } from '@/lib/cookable';
import ImportRecipeModal from '@/components/recipes/ImportRecipeModal';

function CookableBadge({ cookable, missingCount }: { cookable: boolean; missingCount: number }) {
  if (cookable) return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ready</span>;
  return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{missingCount} missing</span>;
}

export default function RecipesPage() {
  const recipes = useStore(s => s.recipes);
  const pantry = useStore(s => s.pantry);
  const [q, setQ] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [showImport, setShowImport] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => r.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    let list = recipes;
    if (q) { const lq = q.toLowerCase(); list = list.filter(r => r.title.toLowerCase().includes(lq) || r.description?.toLowerCase().includes(lq) || r.tags.some(t => t.includes(lq))); }
    if (activeTag) list = list.filter(r => r.tags.includes(activeTag));
    return list;
  }, [recipes, q, activeTag]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <div className="flex items-center gap-1">
          <button
            className="text-sm text-green-600 font-medium min-h-[44px] flex items-center px-3 gap-1"
            onClick={() => setShowImport(true)}>
            ⬇ Import
          </button>
          <Link href="/recipes/new" className="text-sm text-green-600 font-medium min-h-[44px] flex items-center px-3">+ New</Link>
        </div>
      </div>

      <input className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-3 text-base"
        placeholder="Search recipes…" value={q} onChange={e => setQ(e.target.value)} />

      {allTags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button className={`shrink-0 px-3 py-1 rounded-full text-sm border ${!activeTag ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'}`}
            onClick={() => setActiveTag('')}>All</button>
          {allTags.map(tag => (
            <button key={tag} className={`shrink-0 px-3 py-1 rounded-full text-sm border ${activeTag === tag ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600'}`}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}>{tag}</button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(recipe => {
          const { cookable, missing } = checkCookable(recipe, pantry);
          return (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{recipe.title}</h3>
                  {recipe.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{recipe.description}</p>}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>{recipe.servings} servings</span>
                    {recipe.prepTime > 0 && <span>{recipe.prepTime}m prep</span>}
                    {recipe.cookTime > 0 && <span>{recipe.cookTime}m cook</span>}
                  </div>
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {recipe.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>)}
                    </div>
                  )}
                </div>
                <CookableBadge cookable={cookable} missingCount={missing.length} />
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">No recipes found.</p>}
      </div>

      {showImport && <ImportRecipeModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
