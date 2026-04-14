export type RegularLevel = 'full' | 'half' | 'low';
export type VariableUnit = 'g' | 'ml' | 'kg' | 'l' | 'tsp' | 'tbsp' | 'whole';
export type IngredientTier = 1 | 2 | 3;
export type MealSlotType = 'breakfast' | 'lunch' | 'dinner';
export type ShopCategory = 'produce' | 'tins' | 'grains' | 'dairy' | 'protein' | 'condiments' | 'other';

export interface StapleItem { name: string; }
export interface RegularItem { name: string; level: RegularLevel; }
export interface VariableItem { name: string; quantity: number; unit: VariableUnit; pricePerUnit?: number; }
export interface Pantry { staples: StapleItem[]; regulars: RegularItem[]; variables: VariableItem[]; }

export interface RecipeIngredient {
  itemName: string; amount: number; unit: VariableUnit;
  tier: IngredientTier; optional?: boolean;
}
export interface RecipeStep { id: string; text: string; timerSeconds?: number; }
export interface MacroData { protein: number; carbs: number; fat: number; fibre: number; }
export interface MicroData { iron?: number; calcium?: number; vitaminC?: number; vitaminD?: number; b12?: number; zinc?: number; }

export interface Recipe {
  id: string; title: string; description: string;
  servings: number; prepTime: number; cookTime: number;
  ingredients: RecipeIngredient[]; steps: RecipeStep[];
  tags: string[];
  macrosPerServing?: MacroData; microsPerServing?: MicroData;
  createdAt: string; updatedAt: string;
}

export interface PlannedMeal { id: string; recipeId: string; servings: number; }
export type DayPlan = { [K in MealSlotType]: PlannedMeal | null; };
export type WeekPlan = { [isoDate: string]: DayPlan; };

export interface ShopItem {
  name: string; needed: number; unit: VariableUnit;
  category: ShopCategory; estimatedCost?: number; bought: boolean;
}

export interface AppSnapshot {
  version: number; exportedAt: string;
  pantry: Pantry; recipes: Recipe[]; weekPlan: WeekPlan; shopList: ShopItem[];
}
