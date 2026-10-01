'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard, ProductGrid, GlassCard } from '@tord/ui';
import { Search, PackageX } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useCart } from '@/providers/cart-provider';

const defaultSearchProducts = [
  {
    id: 'g-1',
    sku: 'SKU-001',
    name: 'Fresh Farm Broccoli Crowns',
    brand: 'TORD Organic Farm',
    unit: '500g Pack',
    price: 68.0,
    compareAtPrice: 85.0,
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
  },
  {
    id: 'g-2',
    sku: 'SKU-002',
    name: 'Pure A2 Cow Milk (Glass Bottle)',
    brand: 'Vedic Pastures',
    unit: '1 Litre',
    price: 74.0,
    compareAtPrice: 95.0,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop',
    category: { name: 'Dairy & Eggs' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
  },
  {
    id: 'g-3',
    sku: 'SKU-003',
    name: 'Hydroponic Sweet Cherry Tomatoes',
    brand: 'GreenHouse Pure',
    unit: '250g Box',
    price: 55.0,
    compareAtPrice: 70.0,
    imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
  },
  {
    id: 'g-4',
    sku: 'SKU-004',
    name: 'Artisanal 100% Sourdough Loaf',
    brand: 'Town Bakehouse',
    unit: '400g Loaf',
    price: 89.0,
    compareAtPrice: 110.0,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop',
    category: { name: 'Bakery & Bread' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
  },
  {
    id: 'g-5',
    sku: 'SKU-005',
    name: 'Royal Shimla Crisp Red Apples',
    brand: 'Himachal Orchards',
    unit: '1 kg Box (4-5 pcs)',
    price: 180.0,
    compareAtPrice: 220.0,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
  },
  {
    id: 'g-8',
    sku: 'SKU-008',
    name: 'Vitamin C 1000mg + Zinc Effervescent',
    brand: 'HealthPlus Vitality',
    unit: '20 Tablets',
    price: 289.0,
    compareAtPrice: 350.0,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop',
    category: { name: 'Pharmacy & Health' },
    isPrescriptionRequired: false,
    isMedicine: true,
    inStock: true,
  },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Sync from searchParams on mount/change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setDebouncedQuery(q);
  }, [searchParams]);

  // Debounce logic (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        router.replace(`/search?q=${encodeURIComponent(query)}`);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query, router]);

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setProducts(defaultSearchProducts);
      setTotal(defaultSearchProducts.length);
      return;
    }

    setIsLoading(true);
    apiGet<{ items: any[]; pagination: { total: number } }>(`/products?search=${encodeURIComponent(debouncedQuery)}&limit=24`)
      .then((data) => {
        if (data && data.items && data.items.length > 0) {
          setProducts(data.items);
          setTotal(data.pagination.total);
        } else {
          const filtered = defaultSearchProducts.filter((p) =>
            p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            p.category.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(debouncedQuery.toLowerCase())
          );
          setProducts(filtered);
          setTotal(filtered.length);
        }
      })
      .catch(() => {
        const filtered = defaultSearchProducts.filter((p) =>
          p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.category.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        setProducts(filtered);
        setTotal(filtered.length);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-16 space-y-8">
          {/* Search Header (Crisp Pure White Luxury Card) */}
          <div className="p-8 sm:p-10 space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="max-w-2xl mx-auto space-y-4 text-center">
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900">
                Search TORD Fresh
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Instant search across farm fresh groceries, dairy, bakery, and pharmacy healthcare.
              </p>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Type organic product name, brand, or category..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs font-medium"
                />
                <Search className="absolute left-4 top-4 h-4 w-4 text-emerald-600 pointer-events-none" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold">Popular Searches:</span>
                {['Apples', 'Paracetamol', 'Milk', 'Broccoli', 'Sourdough'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {debouncedQuery && (
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Search Results for "{debouncedQuery}"
              </h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {total} Items Found
              </span>
            </div>
          )}

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-72 rounded-2xl bg-white border border-slate-200/80 animate-pulse p-4 space-y-3 shadow-xs">
                  <div className="aspect-square w-full rounded-xl bg-slate-100" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center space-y-3 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <PackageX className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No items matched your query</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try checking for typos or searching by generic category name like "Broccoli", "Milk", or "Apples".
              </p>
            </div>
          ) : (
            <ProductGrid>
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  id={prod.id}
                  name={prod.name}
                  brand={prod.brand}
                  unit={prod.unit}
                  price={prod.price}
                  compareAtPrice={prod.compareAtPrice}
                  imageUrl={prod.imageUrl || undefined}
                  categoryName={prod.category?.name}
                  isPrescriptionRequired={prod.isPrescriptionRequired}
                  isMedicine={prod.isMedicine}
                  inStock={prod.inStock}
                  onAddToCart={() => addToCart(prod.id, 1)}
                />
              ))}
            </ProductGrid>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-8 text-xs font-semibold text-slate-500 animate-pulse">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
