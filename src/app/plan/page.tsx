'use client';
import React, { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MealSlotType, PlannedMeal, Recipe } from '@/lib/types';
import { DndContext, useSensor, useSensors, PointerSensor, DragEndEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';

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

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOTS: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

function DraggableMeal({ mealId, title, servings, onRemove }: { mealId: string; title: string; servings: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: mealId });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={`bg-green-50 rounded-lg p-1.5 cursor-grab ${isDragging ? 'opacity-50' : ''}`}>
      <p className="font-medium text-green-800 leading-tight text-xs truncate">{title}</p>
      <p className="text-green-600 text-xs">{servings}srv</p>
      <button className="text-gray-400 hover:text-red-500 float-right -mt-4 p-0.5" onPointerDown={e => e.stopPropagation()} onClick={onRemove}>×</button>
    </div>
  );
}

function MealSlotCell({ date, slot, meal, recipes, onAdd, onRemove }: {
  date: string; slot: MealSlotType; meal: PlannedMeal | null;
  recipes: Recipe[];
  onAdd: () => void; onRemove: () => void;
}) {
  const droppableId = `${date}:${slot}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const recipe = meal ? recipes.find(r => r.id === meal.recipeId) : null;

  return (
    <div ref={setNodeRef}
      className={`min-h-[60px] rounded-lg p-1.5 border text-xs transition-colors ${isOver ? 'bg-green-50 border-green-400' : 'bg-white border-gray-100'}`}>
      {recipe && meal ? (
        <DraggableMeal mealId={meal.id} title={recipe.title} servings={meal.servings} onRemove={onRemove} />
      ) : (
        <button className="w-full h-full min-h-[44px] text-gray-300 hover:text-green-500 flex items-center justify-center"
          onClick={onAdd}>+</button>
      )}
    </div>
  );
}

function AddMealModal({ onAdd, onClose, recipes }: {
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
        <select className="w-full border border-gray-300 rounded-xl px-3 py-2 mb-3 text-base"
          value={selectedId} onChange={e => { setSelectedId(e.target.value); const r = recipes.find(x=>x.id===e.target.value); if(r) setServings(r.servings); }}>
          {recipes.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Servings</span>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => setServings(s=>Math.max(1,s-1))}>−</button>
          <span className="w-8 text-center font-semibold">{servings}</span>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center" onClick={() => setServings(s=>s+1)}>+</button>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2 border border-gray-300 rounded-xl" onClick={onClose}>Cancel</button>
          <button className="flex-1 py-2 bg-green-600 text-white rounded-xl font-medium" onClick={() => { if(selectedId) { onAdd(selectedId, servings); onClose(); } }}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const recipes = useStore(s => s.recipes);
  const weekPlan = useStore(s => s.weekPlan);
  const { setPlannedMeal, movePlannedMeal, clearWeekPlan } = useStore();
  const [addTarget, setAddTarget] = useState<{date: string; slot: MealSlotType} | null>(null);
  const weekDates = useMemo(() => getWeekDates(), []);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const destId = String(over.id);
    const [destDate, destSlot] = destId.split(':') as [string, MealSlotType];
    for (const [date, dayPlan] of Object.entries(weekPlan)) {
      for (const slot of SLOTS) {
        if (dayPlan?.[slot]?.id === active.id) {
          movePlannedMeal(date, slot, destDate, destSlot);
          return;
        }
      }
    }
  }

  const batchData = useMemo(() => {
    const recipeCount = new Map<string, number>();
    for (const dayPlan of Object.values(weekPlan)) {
      for (const meal of Object.values(dayPlan)) {
        if (!meal) continue;
        recipeCount.set(meal.recipeId, (recipeCount.get(meal.recipeId) ?? 0) + meal.servings);
      }
    }
    return [...recipeCount.entries()].map(([id, total]) => {
      const r = recipes.find(x => x.id === id);
      if (!r) return null;
      return { title: r.title, total, batches: Math.ceil(total / r.servings), mins: (r.prepTime + r.cookTime) * Math.ceil(total / r.servings) };
    }).filter(Boolean).sort((a, b) => (b!.mins ?? 0) - (a!.mins ?? 0));
  }, [weekPlan, recipes]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Plan</h1>
        <button className="text-sm text-red-500 min-h-[44px] px-3" onClick={() => { if(confirm('Clear week plan?')) clearWeekPlan(); }}>Clear</button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `60px repeat(7, minmax(80px, 1fr))`, minWidth: '620px', gap: '4px' }}>
            {/* Header */}
            <div />
            {weekDates.map((date, i) => (
              <div key={date} className="text-center text-xs font-medium text-gray-600 py-1">
                <div>{DAY_NAMES[i]}</div>
                <div className="text-gray-400">{date.slice(5)}</div>
              </div>
            ))}
            {/* Rows */}
            {SLOTS.map(slot => (
              <React.Fragment key={slot}>
                <div className="text-xs text-gray-500 capitalize flex items-center">{slot.slice(0,3)}</div>
                {weekDates.map(date => (
                  <MealSlotCell key={`${date}:${slot}`} date={date} slot={slot}
                    meal={weekPlan[date]?.[slot] ?? null} recipes={recipes}
                    onAdd={() => setAddTarget({ date, slot })}
                    onRemove={() => setPlannedMeal(date, slot, null)} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </DndContext>

      {batchData.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-lg mb-3">Batch Session</h2>
          <div className="space-y-2">
            {batchData.map(d => d && (
              <div key={d.title} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{d.title}</span>
                  <span className="text-xs text-gray-500">{d.batches} batch{d.batches!==1?'es':''} · ~{d.mins}min</span>
                </div>
                <p className="text-xs text-gray-400">{d.total} total servings</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {addTarget && <AddMealModal recipes={recipes} onAdd={(recipeId, servings) => { setPlannedMeal(addTarget.date, addTarget.slot, { id: uuidv4(), recipeId, servings }); }} onClose={() => setAddTarget(null)} />}
    </div>
  );
}
