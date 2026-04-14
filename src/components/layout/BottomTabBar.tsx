'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/pantry', label: 'Pantry', icon: '🥫' },
  { href: '/recipes', label: 'Recipes', icon: '📖' },
  { href: '/plan', label: 'Plan', icon: '📅' },
  { href: '/shop', label: 'Shop', icon: '🛒' },
  { href: '/nutrition', label: 'Nutrition', icon: '📊' },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const isCookMode = pathname.includes('/cook');
  if (isCookMode) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-lg mx-auto flex">
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href !== '/pantry' && pathname.startsWith(tab.href));
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 min-h-[44px] justify-center transition-colors ${active ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
