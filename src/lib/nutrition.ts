import { Recipe, WeekPlan, MacroData, MicroData } from './types';
import { DAILY_TARGETS } from './defaults';

export interface DayNutrition { macros: MacroData; micros: MicroData; }
export interface WeekNutrition {
  byDay: Record<string, DayNutrition>;
  totals: { macros: MacroData; micros: MicroData };
  gaps: string[];
  absorptionHints: string[];
}

function emptyMacros(): MacroData { return { protein: 0, carbs: 0, fat: 0, fibre: 0 }; }
function emptyMicros(): MicroData { return { iron: 0, calcium: 0, vitaminC: 0, vitaminD: 0, b12: 0, zinc: 0 }; }
function addMacros(a: MacroData, b: MacroData): MacroData {
  return { protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fibre: a.fibre + b.fibre };
}
function addMicros(a: MicroData, b: MicroData): MicroData {
  return {
    iron: (a.iron ?? 0) + (b.iron ?? 0),
    calcium: (a.calcium ?? 0) + (b.calcium ?? 0),
    vitaminC: (a.vitaminC ?? 0) + (b.vitaminC ?? 0),
    vitaminD: (a.vitaminD ?? 0) + (b.vitaminD ?? 0),
    b12: (a.b12 ?? 0) + (b.b12 ?? 0),
    zinc: (a.zinc ?? 0) + (b.zinc ?? 0),
  };
}

export function aggregateNutrition(weekPlan: WeekPlan, recipes: Recipe[]): WeekNutrition {
  const byDay: Record<string, DayNutrition> = {};
  let totalMacros = emptyMacros();
  let totalMicros = emptyMicros();

  for (const [date, dayPlan] of Object.entries(weekPlan)) {
    let dayMacros = emptyMacros();
    let dayMicros = emptyMicros();
    for (const meal of Object.values(dayPlan)) {
      if (!meal) continue;
      const recipe = recipes.find(r => r.id === meal.recipeId);
      if (!recipe) continue;
      const scale = meal.servings / recipe.servings;
      if (recipe.macrosPerServing) dayMacros = addMacros(dayMacros, { protein: recipe.macrosPerServing.protein * scale, carbs: recipe.macrosPerServing.carbs * scale, fat: recipe.macrosPerServing.fat * scale, fibre: recipe.macrosPerServing.fibre * scale });
      if (recipe.microsPerServing) {
        const scaled: MicroData = {};
        for (const [k, v] of Object.entries(recipe.microsPerServing)) {
          (scaled as Record<string, number>)[k] = (v ?? 0) * scale;
        }
        dayMicros = addMicros(dayMicros, scaled);
      }
    }
    byDay[date] = { macros: dayMacros, micros: dayMicros };
    totalMacros = addMacros(totalMacros, dayMacros);
    totalMicros = addMicros(totalMicros, dayMicros);
  }

  const gaps: string[] = [];
  const weekly = { protein: DAILY_TARGETS.protein * 7, carbs: DAILY_TARGETS.carbs * 7, fat: DAILY_TARGETS.fat * 7, fibre: DAILY_TARGETS.fibre * 7, iron: DAILY_TARGETS.iron * 7, calcium: DAILY_TARGETS.calcium * 7, vitaminC: DAILY_TARGETS.vitaminC * 7, vitaminD: DAILY_TARGETS.vitaminD * 7, b12: DAILY_TARGETS.b12 * 7, zinc: DAILY_TARGETS.zinc * 7 };
  if (totalMacros.protein < weekly.protein * 0.7) gaps.push('protein');
  if (totalMacros.fibre < weekly.fibre * 0.7) gaps.push('fibre');
  if ((totalMicros.iron ?? 0) < weekly.iron * 0.7) gaps.push('iron');
  if ((totalMicros.calcium ?? 0) < weekly.calcium * 0.7) gaps.push('calcium');
  if ((totalMicros.vitaminC ?? 0) < weekly.vitaminC * 0.7) gaps.push('vitamin C');
  if ((totalMicros.vitaminD ?? 0) < weekly.vitaminD * 0.7) gaps.push('vitamin D');
  if ((totalMicros.b12 ?? 0) < weekly.b12 * 0.7) gaps.push('B12');
  if ((totalMicros.zinc ?? 0) < weekly.zinc * 0.7) gaps.push('zinc');

  const absorptionHints: string[] = [];
  if ((totalMicros.iron ?? 0) > 5 && (totalMicros.vitaminC ?? 0) < 30) {
    absorptionHints.push('Add vitamin C-rich foods to improve iron absorption');
  }

  return { byDay, totals: { macros: totalMacros, micros: totalMicros }, gaps, absorptionHints };
}
