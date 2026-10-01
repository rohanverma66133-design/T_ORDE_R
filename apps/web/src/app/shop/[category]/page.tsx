'use client';

import { use, Suspense } from 'react';
import { CatalogView } from '@/components/catalog-view';

function CategoryContent({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = use(params);
  return <CatalogView categorySlug={resolvedParams.category} />;
}

export default function CategoryShopPage({ params }: { params: Promise<{ category: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-xs font-semibold text-slate-500 animate-pulse">Loading catalog...</div>}>
      <CategoryContent params={params} />
    </Suspense>
  );
}
