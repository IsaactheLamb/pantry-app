import { Recipe, Pantry } from './types';

export interface MissingIngredient {
  name: string; tier: number; reason: string; have?: number; need?: number;
}

function toBase(amount: number, unit: string): number {
  const map: Record<string, number> = { kg: 1000, l: 1000, g: 1, ml: 1, tsp: 5, tbsp: 15, whole: 1 };
  return amount * (map[unit] ?? 1);
}

export function checkCookable(recipe: Recipe, pantry: Pantry): { cookable: boolean; missing: MissingIngredient[] } {
  const missing: MissingIngredient[] = [];
  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;
    const name = ing.itemName.toLowerCase().trim();
    if (ing.tier === 1) {
      if (!pantry.staples.find(s => s.name.toLowerCase() === name))
        missing.push({ name, tier: 1, reason: 'not_in_staples' });
    } else if (ing.tier === 2) {
      const item = pantry.regulars.find(r => r.name.toLowerCase() === name);
      if (!item) missing.push({ name, tier: 2, reason: 'not_in_regulars' });
      else if (item.level === 'low') missing.push({ name, tier: 2, reason: 'level_low' });
    } else {
      const item = pantry.variables.find(v => v.name.toLowerCase() === name);
      if (!item) { missing.push({ name, tier: 3, reason: 'not_in_variables' }); continue; }
      if (toBase(item.quantity, item.unit) < toBase(ing.amount, ing.unit))
        missing.push({ name, tier: 3, reason: 'insufficient', have: item.quantity, need: ing.amount });
    }
  }
  return { cookable: missing.length === 0, missing };
}
