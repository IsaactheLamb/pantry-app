'use client';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { checkCookable } from '@/lib/cookable';

export function useIsCookable(recipeId: string) {
  const recipe = useStore(s => s.recipes.find(r => r.id === recipeId));
  const pantry = useStore(s => s.pantry);
  return useMemo(() => {
    if (!recipe) return { cookable: false, missing: [] };
    return checkCookable(recipe, pantry);
  }, [recipe, pantry]);
}
