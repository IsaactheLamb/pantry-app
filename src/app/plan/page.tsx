'use client';
import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { PlannedMeal, Recipe } from '@/lib/types';
import {
  DndContext, useSensor, useSensors, PointerSensor,
  DragEndEvent, DragOverEvent, DragStartEvent,
  DragOverlay, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';

// ── helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(): string[] {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── MealCard (draggable) ─────────────────────────────────────────────────────

function MealCard({
  meal, title, servings, onRemove, overlay = false,
}: {
  meal: PlannedMeal; title: string; servings: number;
  onRemove?: () => void; overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: meal.id });

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      className={`bg-white border border-gray-200 rounded-xl p-3 cursor-grab select-none shadow-sm
        ${isDragging && !overlay ? 'opacity-30' : ''}
        ${overlay ? 'shadow-xl rotate-1 cursor-grabbing' : 'hover:shadow-md transition-shadow'}`}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{title}</p>
        {!overlay && onRemove && (
          <button
            className="text-gray-300 hover:text-red-400 text-lg leading-none flex-shrink-0 -mt-0.5 transition-colors"
            onPointerDown={e => e.stopPropagation()}
            onClick={onRemove}
          >×</button>
        )}
      </div>
      <p className="text-xs text-green-600 mt-1 font-medium">{servings} serving{servings !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ── DayColumn (droppable) ────────────────────────────────────────────────────

function DayColumn({
  date, label, dateLabel, meals, recipes, onAdd, onRemove, activeId,
}: {
  date: string; label: string; dateLabel: string;
  meals: PlannedMeal[];
  recipes: Recipe[];
  onAdd: () => void;
  onRemove: (mealId: string) => void;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col flex-shrink-0 w-36 sm:w-44">
      {/* Column header */}
      <div className={`text-center mb-2 pb-2 border-b ${isToday ? 'border-green-400' : 'border-gray-200'}`}>
        <p className={`text-sm font-semibold ${isToday ? 'text-green-600' : 'text-gray-700'}`}>{label}</p>
        <p className="text-xs text-gray-400">{dateLabel}</p>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors
          ${isOver ? 'bg-green-50 border-2 border-dashed border-green-400' : 'border-2 border-transparent'}`}
      >
        {meals.map(meal => {
          const recipe = recipes.find(r => r.id === meal.recipeId);
          if (!recipe) return null;
          return (
            <MealCard
              key={meal.id}
              meal={meal}
              title={recipe.title}
              servings={meal.servings}
              onRemove={() => onRemove(meal.id)}
            />
          );
        })}

        {/* Add button */}
        <button
          className="mt-auto w-full py-2 text-gray-300 hover:text-green-500 hover:bg-green-50
            border-2 border-dashed border-gray-200 hover:border-green-300
            rounded-xl text-xl transition-colors"
          onClick={onAdd}
        >+</button>
      </div>
    </div>
  );
}

// ── AddMealModal ─────────────────────────────────────────────────────────────

function AddMealModal({
  onAdd, onClose,
  recipes,
}: {
  onAdd: (recipeId: string, servings: number) => void;
  onClose: () => void;
  recipes: Recipe[];
}) {
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? '');
  const [servings, setServings] = useState(recipes[0]?.servings ?? 1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Add Meal</h3>
        <select
          className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-base"
          value={selectedId}
          onChange={e => {
            setSelectedId(e.target.value);
            const r = recipes.find(x => x.id === e.target.value);
            if (r) setServings(r.servings);
          }}
        >
          {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm text-gray-600 flex-1">Servings</span>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg"
            onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
          <span className="w-8 text-center font-semibold text-lg">{servings}</span>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-lg"
            onClick={() => setServings(s => s + 1)}>+</button>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-3 border border-gray-300 rounded-xl font-medium" onClick={onClose}>Cancel</button>
          <button
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold"
            onClick={() => { if (selectedId) { onAdd(selectedId, servings); onClose(); } }}
          >Add</button>
        </div>
      </div>
    </div>
  );
}

// ── PlanPage ─────────────────────────────────────────────────────────────────

export default function PlanPage() {
  const recipes = useStore(s => s.recipes);
  const weekPlan = useStore(s => s.weekPlan);
  const { addMeal, removeMeal, moveMeal, clearWeekPlan } = useStore();

  const weekDates = useMemo(() => getWeekDates(), []);
  const [addTarget, setAddTarget] = useState<string | null>(null); // date string
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Find meal and its date from activeId
  const activeMeal = useMemo(() => {
    if (!activeId) return null;
    for (const [, meals] of Object.entries(weekPlan)) {
      const m = meals.find(m => m.id === activeId);
      if (m) return m;
    }
    return null;
  }, [activeId, weekPlan]);

  const activeMealRecipe = useMemo(
    () => activeMeal ? recipes.find(r => r.id === activeMeal.recipeId) : null,
    [activeMeal, recipes]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const mealId = String(active.id);
    const toDate = String(over.id);

    // Find which date this meal currently lives in
    for (const [fromDate, meals] of Object.entries(weekPlan)) {
      if (meals.find(m => m.id === mealId)) {
        if (fromDate !== toDate) {
          moveMeal(fromDate, mealId, toDate);
        }
        return;
      }
    }
  }

  // Batch session summary
  const batchData = useMemo(() => {
    const recipeCount = new Map<string, number>();
    for (const meals of Object.values(weekPlan)) {
      for (const meal of meals) {
        recipeCount.set(meal.recipeId, (recipeCount.get(meal.recipeId) ?? 0) + meal.servings);
      }
    }
    return [...recipeCount.entries()].map(([id, total]) => {
      const r = recipes.find(x => x.id === id);
      if (!r) return null;
      return {
        title: r.title,
        total,
        batches: Math.ceil(total / r.servings),
        mins: (r.prepTime + r.cookTime) * Math.ceil(total / r.servings),
      };
    }).filter(Boolean).sort((a, b) => (b!.mins ?? 0) - (a!.mins ?? 0));
  }, [weekPlan, recipes]);

  const totalMeals = Object.values(weekPlan).reduce((n, meals) => n + meals.length, 0);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Plan</h1>
        {totalMeals > 0 && (
          <button
            className="text-sm text-red-400 min-h-[44px] px-3"
            onClick={() => { if (confirm('Clear week plan?')) clearWeekPlan(); }}
          >Clear</button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-4">Drag meals between days · tap + to add · tap × to remove</p>

      {/* Kanban board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3" style={{ minWidth: `${weekDates.length * 160}px` }}>
            {weekDates.map((date, i) => (
              <DayColumn
                key={date}
                date={date}
                label={DAY_LABELS[i]}
                dateLabel={date.slice(5)}
                meals={weekPlan[date] ?? []}
                recipes={recipes}
                onAdd={() => setAddTarget(date)}
                onRemove={(mealId) => removeMeal(date, mealId)}
                activeId={activeId}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay — floats under cursor */}
        <DragOverlay dropAnimation={null}>
          {activeMeal && activeMealRecipe ? (
            <MealCard
              meal={activeMeal}
              title={activeMealRecipe.title}
              servings={activeMeal.servings}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Batch session summary */}
      {batchData.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-lg mb-3 text-gray-900">Batch Session</h2>
          <div className="space-y-2">
            {batchData.map(d => d && (
              <div key={d.title} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-900">{d.title}</span>
                  <span className="text-xs text-gray-500">
                    {d.batches} batch{d.batches !== 1 ? 'es' : ''} · ~{d.mins}min
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{d.total} total servings</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add meal modal */}
      {addTarget && (
        <AddMealModal
          recipes={recipes}
          onAdd={(recipeId, servings) => {
            addMeal(addTarget, { id: uuidv4(), recipeId, servings });
          }}
          onClose={() => setAddTarget(null)}
        />
      )}
    </div>
  );
}
