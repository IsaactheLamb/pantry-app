'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { RegularLevel, VariableUnit } from '@/lib/types';

function AddModal({ title, onAdd, onClose }: { title: string; onAdd: (name: string) => void; onClose: () => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        <input autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base"
          value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); onClose(); } }}
          placeholder="Item name…" />
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-2 border border-gray-300 rounded-lg" onClick={onClose}>Cancel</button>
          <button className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium"
            onClick={() => { if (val.trim()) { onAdd(val.trim()); onClose(); } }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function AddVariableModal({ onAdd, onClose }: { onAdd: (name: string, qty: number, unit: VariableUnit) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState<VariableUnit>('g');
  const units: VariableUnit[] = ['g', 'ml', 'kg', 'l', 'tsp', 'tbsp', 'whole'];
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-w-lg mx-auto rounded-t-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Add Variable Item</h3>
        <input autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base mb-3"
          value={name} onChange={e => setName(e.target.value)} placeholder="Item name…" />
        <div className="flex gap-2 mb-4">
          <input type="number" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base"
            value={qty} onChange={e => setQty(e.target.value)} placeholder="Quantity" />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-base" value={unit}
            onChange={e => setUnit(e.target.value as VariableUnit)}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-2 border border-gray-300 rounded-lg" onClick={onClose}>Cancel</button>
          <button className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium"
            onClick={() => { if (name.trim() && qty) { onAdd(name.trim(), parseFloat(qty), unit); onClose(); } }}>Add</button>
        </div>
      </div>
    </div>
  );
}

const LEVEL_CONFIG: Record<RegularLevel, { label: string; color: string }> = {
  full: { label: 'Full', color: 'bg-green-500' },
  half: { label: 'Half', color: 'bg-amber-500' },
  low: { label: 'Low', color: 'bg-red-500' },
};

export default function PantryPage() {
  const { pantry, addStaple, removeStaple, addRegular, removeRegular, setRegularLevel, addVariable, removeVariable, setVariableQuantity } = useStore();
  const [modal, setModal] = useState<'staple' | 'regular' | 'variable' | null>(null);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Pantry</h1>

      {/* Staples */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Staples <span className="text-sm font-normal text-gray-500">({pantry.staples.length})</span></h2>
          <button className="text-sm text-green-600 font-medium min-h-[44px] px-3" onClick={() => setModal('staple')}>+ Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {pantry.staples.map(item => (
            <span key={item.name} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
              {item.name}
              <button className="text-gray-400 hover:text-red-500 ml-1 min-w-[20px] min-h-[20px]" onClick={() => removeStaple(item.name)}>×</button>
            </span>
          ))}
        </div>
      </section>

      {/* Regulars */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Regulars <span className="text-sm font-normal text-gray-500">({pantry.regulars.length})</span></h2>
          <button className="text-sm text-green-600 font-medium min-h-[44px] px-3" onClick={() => setModal('regular')}>+ Add</button>
        </div>
        <div className="space-y-2">
          {pantry.regulars.map(item => (
            <div key={item.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
              <span className="text-sm font-medium capitalize">{item.name}</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {(['full', 'half', 'low'] as RegularLevel[]).map(lvl => (
                    <button key={lvl}
                      className={`px-2 py-1 rounded-full text-xs font-medium min-h-[32px] transition-colors ${item.level === lvl ? LEVEL_CONFIG[lvl].color + ' text-white' : 'bg-gray-100 text-gray-500'}`}
                      onClick={() => setRegularLevel(item.name, lvl)}>
                      {LEVEL_CONFIG[lvl].label}
                    </button>
                  ))}
                </div>
                <button className="text-gray-400 hover:text-red-500 ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => removeRegular(item.name)}>×</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Variables */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Variables <span className="text-sm font-normal text-gray-500">({pantry.variables.length})</span></h2>
          <button className="text-sm text-green-600 font-medium min-h-[44px] px-3" onClick={() => setModal('variable')}>+ Add</button>
        </div>
        {pantry.variables.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No variable items yet. Add items you track by quantity (e.g. red lentils 300g).</p>
        ) : (
          <div className="space-y-2">
            {pantry.variables.map(item => (
              <div key={item.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <span className="text-sm font-medium capitalize">{item.name}</span>
                <div className="flex items-center gap-2">
                  <input type="number" className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-right"
                    value={item.quantity}
                    onChange={e => setVariableQuantity(item.name, parseFloat(e.target.value) || 0)} />
                  <span className="text-xs text-gray-500 w-8">{item.unit}</span>
                  <button className="text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => removeVariable(item.name)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modal === 'staple' && <AddModal title="Add Staple" onAdd={addStaple} onClose={() => setModal(null)} />}
      {modal === 'regular' && <AddModal title="Add Regular" onAdd={addRegular} onClose={() => setModal(null)} />}
      {modal === 'variable' && <AddVariableModal onAdd={addVariable} onClose={() => setModal(null)} />}
    </div>
  );
}
