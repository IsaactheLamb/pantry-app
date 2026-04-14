import { Recipe, Pantry, WeekPlan, ShopItem, ShopCategory, VariableUnit } from './types';

const CATEGORY_KEYWORDS: Record<ShopCategory, string[]> = {
  produce: ['onion', 'lemon', 'garlic', 'green', 'tomato', 'carrot', 'potato', 'spinach', 'kale'],
  tins: ['tinned', 'canned', 'sardine', 'salmon', 'chickpea', 'lentil'],
  grains: ['lentil', 'rice', 'pasta', 'oat', 'bread', 'flour', 'quinoa'],
  dairy: ['yoghurt', 'milk', 'cheese', 'butter', 'cream', 'egg'],
  protein: ['chicken', 'beef', 'pork', 'tofu', 'tempeh', 'fish'],
  condiments: ['oil', 'vinegar', 'sauce', 'spice', 'herb', 'salt', 'pepper', 'cumin', 'turmeric'],
  other: [],
};

function inferCategory(name: string): ShopCategory {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ShopCategory, string[]][]) {
    if (cat === 'other') continue;
    if (keywords.some(k => lower.includes(k))) return cat;
  }
  return 'other';
}

function toBase(amount: number, unit: string): number {
  const map: Record<string, number> = { kg: 1000, l: 1000, g: 1, ml: 1, tsp: 5, tbsp: 15, whole: 1 };
  return amount * (map[unit] ?? 1);
}

export function generateShopList(weekPlan: WeekPlan, recipes: Recipe[], pantry: Pantry): ShopItem[] {
  const needs = new Map<string, { baseAmount: number; unit: VariableUnit; tier: number }>();

  for (const dayPlan of Object.values(weekPlan)) {
    for (const meal of dayPlan) {
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (!recipe) continue;
      const scale = meal.servings / recipe.servings;
      for (const ing of recipe.ingredients) {
        const name = ing.itemName.toLowerCase().trim();
        const baseNeeded = toBase(ing.amount * scale, ing.unit);
        const existing = needs.get(name);
        if (existing) {
          existing.baseAmount += baseNeeded;
        } else {
          needs.set(name, { baseAmount: baseNeeded, unit: ing.unit, tier: ing.tier });
        }
      }
    }
  }

  const items: ShopItem[] = [];

  for (const [name, { baseAmount, unit, tier }] of needs.entries()) {
    if (tier === 1) {
      if (!pantry.staples.find(s => s.name.toLowerCase() === name)) {
        items.push({ name, needed: baseAmount, unit, category: inferCategory(name), bought: false });
      }
    } else if (tier === 2) {
      const reg = pantry.regulars.find(r => r.name.toLowerCase() === name);
      if (!reg || reg.level === 'low') {
        items.push({ name, needed: baseAmount, unit, category: inferCategory(name), bought: false });
      }
    } else {
      const varItem = pantry.variables.find(v => v.name.toLowerCase() === name);
      const haveBase = varItem ? toBase(varItem.quantity, varItem.unit) : 0;
      const netBase = baseAmount - haveBase;
      if (netBase > 0) {
        items.push({ name, needed: netBase, unit, category: inferCategory(name), bought: false });
      }
    }
  }

  const catOrder: ShopCategory[] = ['produce', 'tins', 'grains', 'dairy', 'protein', 'condiments', 'other'];
  items.sort((a, b) => {
    const ai = catOrder.indexOf(a.category);
    const bi = catOrder.indexOf(b.category);
    return ai !== bi ? ai - bi : a.name.localeCompare(b.name);
  });

  return items;
}
