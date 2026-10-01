'use client';

import { Suspense } from 'react';
import { CatalogView } from '@/components/catalog-view';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-xs font-semibold text-slate-500 animate-pulse">Loading catalog...</div>}>
      <CatalogView />
    </Suspense>
  );
}
