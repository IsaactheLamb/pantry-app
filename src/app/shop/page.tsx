'use client';
import { useStore } from '@/lib/store';
import { ShopCategory } from '@/lib/types';

const CAT_LABELS: Record<ShopCategory, string> = {
  produce: '🥦 Produce', tins: '🥫 Tins & Cans', grains: '🌾 Grains & Legumes',
  dairy: '🥛 Dairy & Eggs', protein: '🥩 Protein', condiments: '🫙 Condiments & Spices', other: '📦 Other',
};

export default function ShopPage() {
  const shopList = useStore(s => s.shopList);
  const { regenerateShopList, toggleShopItemBought } = useStore();

  const byCategory = shopList.reduce((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {} as Record<ShopCategory, typeof shopList>);

  const categories = (Object.keys(CAT_LABELS) as ShopCategory[]).filter(c => byCategory[c]?.length);
  const bought = shopList.filter(i => i.bought).length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
        <button className="text-sm text-green-600 font-medium min-h-[44px] px-3" onClick={regenerateShopList}>
          Regenerate
        </button>
      </div>

      {shopList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No items. Plan some meals first, then regenerate.</p>
          <button className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium" onClick={regenerateShopList}>Generate List</button>
        </div>
      ) : (
        <>
          {bought > 0 && <p className="text-sm text-gray-500 mb-4">{bought} of {shopList.length} items checked off</p>}
          {categories.map(cat => (
            <section key={cat} className="mb-5">
              <h2 className="text-sm font-semibold text-gray-600 mb-2">{CAT_LABELS[cat]}</h2>
              <div className="space-y-1">
                {byCategory[cat]?.map(item => (
                  <button key={item.name}
                    className={`w-full flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border min-h-[44px] text-left transition-colors ${item.bought ? 'border-gray-100 opacity-50' : 'border-gray-100'}`}
                    onClick={() => toggleShopItemBought(item.name)}>
                    <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${item.bought ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                      {item.bought && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </span>
                    <span className={`flex-1 text-sm capitalize ${item.bought ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.name}</span>
                    <span className="text-xs text-gray-400">{item.needed % 1 === 0 ? item.needed : item.needed.toFixed(1)} {item.unit}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
