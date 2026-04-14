import type { Metadata, Viewport } from 'next';
import './globals.css';
import BottomTabBar from '@/components/layout/BottomTabBar';
import ServiceWorkerRegistrar from '@/components/layout/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'Pantry App',
  description: 'Pantry-aware recipe and meal planning app',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <ServiceWorkerRegistrar />
        <main className="max-w-lg mx-auto pb-20 min-h-screen">
          {children}
        </main>
        <BottomTabBar />
      </body>
    </html>
  );
}
