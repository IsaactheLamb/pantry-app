'use client';
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { aggregateNutrition } from '@/lib/nutrition';
import { DAILY_TARGETS } from '@/lib/defaults';

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{value.toFixed(0)}{unit} / {target}{unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const recipes = useStore(s => s.recipes);
  const weekPlan = useStore(s => s.weekPlan);

  const nutrition = useMemo(() => aggregateNutrition(weekPlan, recipes), [weekPlan, recipes]);
  const { totals, gaps, absorptionHints } = nutrition;
  const weekTargets = {
    protein: DAILY_TARGETS.protein * 7, carbs: DAILY_TARGETS.carbs * 7,
    fat: DAILY_TARGETS.fat * 7, fibre: DAILY_TARGETS.fibre * 7,
    iron: DAILY_TARGETS.iron * 7, vitaminC: DAILY_TARGETS.vitaminC * 7,
    vitaminD: DAILY_TARGETS.vitaminD * 7, b12: DAILY_TARGETS.b12 * 7,
    zinc: DAILY_TARGETS.zinc * 7, calcium: DAILY_TARGETS.calcium * 7,
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Nutrition</h1>

      {Object.keys(weekPlan).length === 0 ? (
        <p className="text-gray-400 text-center py-8">Plan some meals to see weekly nutrition.</p>
      ) : (
        <>
          {gaps.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
              <p className="font-semibold text-amber-800 text-sm mb-1">Nutritional gaps this week:</p>
              <p className="text-amber-700 text-sm">{gaps.join(', ')}</p>
            </div>
          )}

          {absorptionHints.map(hint => (
            <div key={hint} className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm text-blue-700">{hint}</div>
          ))}

          <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-5">
            <h2 className="font-semibold mb-4 text-gray-800">Weekly Macros</h2>
            <MacroBar label="Protein" value={totals.macros.protein} target={weekTargets.protein} unit="g" color="bg-blue-500" />
            <MacroBar label="Carbs" value={totals.macros.carbs} target={weekTargets.carbs} unit="g" color="bg-amber-400" />
            <MacroBar label="Fat" value={totals.macros.fat} target={weekTargets.fat} unit="g" color="bg-yellow-400" />
            <MacroBar label="Fibre" value={totals.macros.fibre} target={weekTargets.fibre} unit="g" color="bg-green-500" />
          </section>

          <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold mb-4 text-gray-800">Weekly Micros</h2>
            <MacroBar label="Iron" value={totals.micros.iron ?? 0} target={weekTargets.iron} unit="mg" color="bg-red-400" />
            <MacroBar label="Calcium" value={totals.micros.calcium ?? 0} target={weekTargets.calcium} unit="mg" color="bg-gray-400" />
            <MacroBar label="Vitamin C" value={totals.micros.vitaminC ?? 0} target={weekTargets.vitaminC} unit="mg" color="bg-orange-400" />
            <MacroBar label="Vitamin D" value={totals.micros.vitaminD ?? 0} target={weekTargets.vitaminD} unit="μg" color="bg-yellow-500" />
            <MacroBar label="B12" value={totals.micros.b12 ?? 0} target={weekTargets.b12} unit="μg" color="bg-purple-400" />
            <MacroBar label="Zinc" value={totals.micros.zinc ?? 0} target={weekTargets.zinc} unit="mg" color="bg-teal-400" />
          </section>
        </>
      )}
    </div>
  );
}
