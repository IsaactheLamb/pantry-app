'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Pantry, Recipe, WeekPlan, ShopItem, MealSlotType, PlannedMeal, RegularLevel, VariableUnit, AppSnapshot } from './types';
import { DEFAULT_PANTRY, DEFAULT_RECIPES } from './defaults';
import { generateShopList } from './shopping';

interface PantryAppState {
  pantry: Pantry;
  recipes: Recipe[];
  weekPlan: WeekPlan;
  shopList: ShopItem[];

  addStaple(name: string): void;
  removeStaple(name: string): void;
  renameStaple(oldName: string, newName: string): void;
  addRegular(name: string): void;
  removeRegular(name: string): void;
  setRegularLevel(name: string, level: RegularLevel): void;
  addVariable(name: string, qty: number, unit: VariableUnit): void;
  removeVariable(name: string): void;
  setVariableQuantity(name: string, qty: number): void;
  deductVariable(name: string, amount: number, unit: VariableUnit): void;

  addRecipe(r: Recipe): void;
  updateRecipe(id: string, patch: Partial<Recipe>): void;
  deleteRecipe(id: string): void;

  setPlannedMeal(date: string, slot: MealSlotType, meal: PlannedMeal | null): void;
  movePlannedMeal(fromDate: string, fromSlot: MealSlotType, toDate: string, toSlot: MealSlotType): void;
  clearWeekPlan(): void;

  regenerateShopList(): void;
  toggleShopItemBought(name: string): void;

  markCooked(recipeId: string, servings: number): void;

  importSnapshot(s: AppSnapshot): void;
  exportSnapshot(): AppSnapshot;
}

function toBase(amount: number, unit: string): number {
  const map: Record<string, number> = { kg: 1000, l: 1000, g: 1, ml: 1, tsp: 5, tbsp: 15, whole: 1 };
  return amount * (map[unit] ?? 1);
}

// Suppress unused import warning
void uuidv4;

export const useStore = create<PantryAppState>()(
  persist(
    (set, get) => ({
      pantry: DEFAULT_PANTRY,
      recipes: DEFAULT_RECIPES,
      weekPlan: {},
      shopList: [],

      addStaple: (name) => set(s => ({ pantry: { ...s.pantry, staples: [...s.pantry.staples, { name }] } })),
      removeStaple: (name) => set(s => ({ pantry: { ...s.pantry, staples: s.pantry.staples.filter(i => i.name !== name) } })),
      renameStaple: (oldName, newName) => set(s => ({
        pantry: { ...s.pantry, staples: s.pantry.staples.map(i => i.name === oldName ? { name: newName } : i) },
        recipes: s.recipes.map(r => ({
          ...r,
          ingredients: r.ingredients.map(ing =>
            ing.itemName.toLowerCase() === oldName.toLowerCase() ? { ...ing, itemName: newName } : ing
          ),
        })),
      })),

      addRegular: (name) => set(s => ({ pantry: { ...s.pantry, regulars: [...s.pantry.regulars, { name, level: 'full' }] } })),
      removeRegular: (name) => set(s => ({ pantry: { ...s.pantry, regulars: s.pantry.regulars.filter(i => i.name !== name) } })),
      setRegularLevel: (name, level) => set(s => ({
        pantry: { ...s.pantry, regulars: s.pantry.regulars.map(i => i.name === name ? { ...i, level } : i) }
      })),

      addVariable: (name, qty, unit) => set(s => ({
        pantry: { ...s.pantry, variables: [...s.pantry.variables, { name, quantity: qty, unit }] }
      })),
      removeVariable: (name) => set(s => ({
        pantry: { ...s.pantry, variables: s.pantry.variables.filter(i => i.name !== name) }
      })),
      setVariableQuantity: (name, qty) => set(s => ({
        pantry: { ...s.pantry, variables: s.pantry.variables.map(i => i.name === name ? { ...i, quantity: qty } : i) }
      })),
      deductVariable: (name, amount, unit) => set(s => {
        const baseDeduct = toBase(amount, unit);
        return {
          pantry: {
            ...s.pantry,
            variables: s.pantry.variables.map(v => {
              if (v.name.toLowerCase() !== name.toLowerCase()) return v;
              const currentBase = toBase(v.quantity, v.unit);
              const newBase = Math.max(0, currentBase - baseDeduct);
              return { ...v, quantity: newBase / toBase(1, v.unit) };
            }),
          },
        };
      }),

      addRecipe: (r) => set(s => ({ recipes: [r, ...s.recipes] })),
      updateRecipe: (id, patch) => set(s => ({
        recipes: s.recipes.map(r => r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r),
      })),
      deleteRecipe: (id) => set(s => ({ recipes: s.recipes.filter(r => r.id !== id) })),

      setPlannedMeal: (date, slot, meal) => set(s => {
        const existing = s.weekPlan[date] ?? { breakfast: null, lunch: null, dinner: null };
        return {
          weekPlan: {
            ...s.weekPlan,
            [date]: { ...existing, [slot]: meal },
          },
        };
      }),
      movePlannedMeal: (fromDate, fromSlot, toDate, toSlot) => set(s => {
        const meal = s.weekPlan[fromDate]?.[fromSlot];
        if (!meal) return s;
        const newPlan = { ...s.weekPlan };
        const fromDay = newPlan[fromDate] ?? { breakfast: null, lunch: null, dinner: null };
        newPlan[fromDate] = { ...fromDay, [fromSlot]: null };
        const toDay = newPlan[toDate] ?? { breakfast: null, lunch: null, dinner: null };
        newPlan[toDate] = { ...toDay, [toSlot]: meal };
        return { weekPlan: newPlan };
      }),
      clearWeekPlan: () => set({ weekPlan: {} }),

      regenerateShopList: () => set(s => ({
        shopList: generateShopList(s.weekPlan, s.recipes, s.pantry),
      })),
      toggleShopItemBought: (name) => set(s => ({
        shopList: s.shopList.map(i => i.name === name ? { ...i, bought: !i.bought } : i),
      })),

      markCooked: (recipeId, servings) => {
        const { recipes, deductVariable } = get();
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;
        const scale = servings / recipe.servings;
        for (const ing of recipe.ingredients) {
          if (ing.tier === 3) {
            deductVariable(ing.itemName, ing.amount * scale, ing.unit);
          }
        }
      },

      importSnapshot: (s) => set({
        pantry: s.pantry, recipes: s.recipes, weekPlan: s.weekPlan, shopList: s.shopList,
      }),
      exportSnapshot: () => {
        const s = get();
        return { version: 1, exportedAt: new Date().toISOString(), pantry: s.pantry, recipes: s.recipes, weekPlan: s.weekPlan, shopList: s.shopList };
      },
    }),
    {
      name: 'pantry-app-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} } as any)),
    }
  )
);
