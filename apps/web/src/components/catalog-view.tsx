'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard, ProductGrid, PrimaryButton } from '@tord/ui';
import { Filter, SlidersHorizontal, RefreshCw, ShieldAlert, Sparkles, ChevronRight, X } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useCart } from '@/providers/cart-provider';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  isMedicine: boolean;
  productCount: number;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  unit: string;
  price: number;
  compareAtPrice?: number | null;
  category?: { name: string; slug: string };
  imageUrl?: string | null;
  isMedicine: boolean;
  isPrescriptionRequired: boolean;
  inStock: boolean;
  rating?: number;
}

interface CatalogViewProps {
  categorySlug?: string;
}

const defaultCategories: CategoryItem[] = [
  { id: 'cat-1', name: 'Fruits & Vegetables', slug: 'fruits-vegetables', isMedicine: false, productCount: 140 },
  { id: 'cat-2', name: 'Dairy & Eggs', slug: 'dairy-eggs', isMedicine: false, productCount: 65 },
  { id: 'cat-3', name: 'Bakery & Bread', slug: 'bakery-sweets', isMedicine: false, productCount: 45 },
  { id: 'cat-4', name: 'Organic Staples', slug: 'staples-grains', isMedicine: false, productCount: 90 },
  { id: 'cat-5', name: 'Pharmacy & Health', slug: 'wellness-otc', isMedicine: true, productCount: 300 },
];

const defaultCatalogProducts: ProductItem[] = [
  {
    id: 'g-1',
    sku: 'SKU-001',
    name: 'Fresh Farm Broccoli Crowns',
    slug: 'fresh-farm-broccoli-crowns',
    description: 'Crisp, hand-harvested organic broccoli crowns packed with nutrients.',
    brand: 'TORD Organic Farm',
    unit: '500g Pack',
    price: 68.0,
    compareAtPrice: 85.0,
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'g-2',
    sku: 'SKU-002',
    name: 'Pure A2 Cow Milk (Glass Bottle)',
    slug: 'pure-a2-cow-milk',
    description: 'Farm-fresh unadulterated pasteurized A2 cow milk delivered cold.',
    brand: 'Vedic Pastures',
    unit: '1 Litre',
    price: 74.0,
    compareAtPrice: 95.0,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop',
    category: { name: 'Dairy & Eggs', slug: 'dairy-eggs' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.8,
  },
  {
    id: 'g-3',
    sku: 'SKU-003',
    name: 'Hydroponic Sweet Cherry Tomatoes',
    slug: 'hydroponic-cherry-tomatoes',
    description: 'Sweet, juicy pesticide-free greenhouse cherry tomatoes.',
    brand: 'GreenHouse Pure',
    unit: '250g Box',
    price: 55.0,
    compareAtPrice: 70.0,
    imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'g-4',
    sku: 'SKU-004',
    name: 'Artisanal 100% Sourdough Loaf',
    slug: 'artisanal-sourdough-loaf',
    description: 'Naturally fermented whole wheat artisanal sourdough bread baked daily.',
    brand: 'Town Bakehouse',
    unit: '400g Loaf',
    price: 89.0,
    compareAtPrice: 110.0,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop',
    category: { name: 'Bakery & Bread', slug: 'bakery-sweets' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'g-5',
    sku: 'SKU-005',
    name: 'Royal Shimla Crisp Red Apples',
    slug: 'royal-shimla-crisp-apples',
    description: 'Crisp mountain orchard apples with high natural sweetness.',
    brand: 'Himachal Orchards',
    unit: '1 kg Box (4-5 pcs)',
    price: 180.0,
    compareAtPrice: 220.0,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop',
    category: { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.8,
  },
  {
    id: 'g-6',
    sku: 'SKU-006',
    name: 'Cold Pressed Extra Virgin Olive Oil',
    slug: 'cold-pressed-extra-virgin-olive-oil',
    description: 'First cold-pressed single estate extra virgin olive oil.',
    brand: 'OliveGold Organics',
    unit: '500 ml Bottle',
    price: 450.0,
    compareAtPrice: 550.0,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop',
    category: { name: 'Organic Staples', slug: 'staples-grains' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.9,
  },
  {
    id: 'g-7',
    sku: 'SKU-007',
    name: 'Organic Unpolished Toor Dal',
    slug: 'organic-unpolished-toor-dal',
    description: 'Chemical-free unpolished protein-rich yellow pigeon peas.',
    brand: 'NatureFresh Grains',
    unit: '1 kg Bag',
    price: 145.0,
    compareAtPrice: 175.0,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop',
    category: { name: 'Organic Staples', slug: 'staples-grains' },
    isPrescriptionRequired: false,
    isMedicine: false,
    inStock: true,
    rating: 4.7,
  },
  {
    id: 'g-8',
    sku: 'SKU-008',
    name: 'Vitamin C 1000mg + Zinc Effervescent',
    slug: 'vitamin-c-1000mg-zinc',
    description: 'Immunity booster effervescent sugar-free orange tablets.',
    brand: 'HealthPlus Vitality',
    unit: '20 Tablets',
    price: 289.0,
    compareAtPrice: 350.0,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop',
    category: { name: 'Pharmacy & Health', slug: 'wellness-otc' },
    isPrescriptionRequired: false,
    isMedicine: true,
    inStock: true,
    rating: 4.9,
  },
];

export function CatalogView({ categorySlug }: CatalogViewProps) {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [products, setProducts] = useState<ProductItem[]>(defaultCatalogProducts);
  const [total, setTotal] = useState(defaultCatalogProducts.length);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state (initialized statically for SSR hydration safety)
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [rxRequired, setRxRequired] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync state from categorySlug prop and URL searchParams after mount
  useEffect(() => {
    if (categorySlug) {
      setSelectedCategory(categorySlug);
    } else if (searchParams.get('category')) {
      setSelectedCategory(searchParams.get('category')!);
    }
    if (searchParams.get('search')) setSearchQuery(searchParams.get('search')!);
    if (searchParams.get('minPrice')) setMinPrice(searchParams.get('minPrice')!);
    if (searchParams.get('maxPrice')) setMaxPrice(searchParams.get('maxPrice')!);
    if (searchParams.get('brand')) setBrand(searchParams.get('brand')!);
    if (searchParams.get('inStock') === 'true') setInStockOnly(true);
    if (searchParams.get('rx') === 'true') setRxRequired(true);
    if (searchParams.get('sortBy')) setSortBy(searchParams.get('sortBy')!);
  }, [categorySlug, searchParams]);

  // Fetch Categories
  useEffect(() => {
    apiGet<CategoryItem[]>('/categories')
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch((err) => console.warn('Categories error:', err));
  }, []);

  // Fetch Products with active filters
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (brand) params.set('brand', brand);
      if (inStockOnly) params.set('inStock', 'true');
      if (rxRequired) params.set('isPrescriptionRequired', 'true');
      params.set('sortBy', sortBy);
      params.set('page', String(page));
      params.set('limit', '12');

      const data = await apiGet<{ items: ProductItem[]; pagination: { total: number } }>(`/products?${params.toString()}`);
      if (data && data.items && data.items.length > 0) {
        setProducts(data.items);
        setTotal(data.pagination.total);
      } else {
        // Filter default products by active category / query
        const filtered = defaultCatalogProducts.filter((p) => {
          if (selectedCategory && p.category?.slug !== selectedCategory) return false;
          if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        setProducts(filtered.length > 0 ? filtered : defaultCatalogProducts);
        setTotal(filtered.length > 0 ? filtered.length : defaultCatalogProducts.length);
      }
    } catch (err) {
      console.warn('Products fetch error, using fallbacks:', err);
      const filtered = defaultCatalogProducts.filter((p) => {
        if (selectedCategory && p.category?.slug !== selectedCategory) return false;
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
      setProducts(filtered.length > 0 ? filtered : defaultCatalogProducts);
      setTotal(filtered.length > 0 ? filtered.length : defaultCatalogProducts.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, minPrice, maxPrice, brand, inStockOnly, rxRequired, sortBy, page]);

  const currentCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const resetFilters = () => {
    setSelectedCategory(categorySlug || '');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setBrand('');
    setInStockOnly(false);
    setRxRequired(false);
    setSortBy('newest');
    setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900" suppressHydrationWarning>
      <div suppressHydrationWarning>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-16 space-y-8">
          {/* Luxury Deep Forest Green Top Banner (Matching Hero Section) */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#061B12] via-[#0C291D] to-[#0A2616] p-7 sm:p-9 text-white shadow-xl border border-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 max-w-xl z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#B4F83C] border border-emerald-700/60 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#B4F83C]" />
                <span>Verified Town Directory</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                {currentCategoryObj ? currentCategoryObj.name : categorySlug ? categorySlug.replace('-', ' ').toUpperCase() : 'All Town Products & Essentials'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
                Verified 15-minute express dispatch for fresh organic produce, dairy, groceries, and doctor-verified medicines.
              </p>
            </div>
            <div className="flex items-center gap-3 z-10">
              <span className="text-xs font-black px-4 py-2.5 rounded-2xl bg-[#061B12]/90 backdrop-blur-md border border-emerald-700/60 text-[#B4F83C] shadow-sm">
                {total} Items Available
              </span>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="md:hidden flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-2xl bg-[#B4F83C] text-[#061B12] shadow-sm"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Desktop Left Filter Sidebar (Crisp Pure White Luxury Card) */}
            <aside className="hidden md:block space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  <span>Filter Products</span>
                </div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Categories Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categories</label>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !selectedCategory
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat.slug
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] opacity-70">({cat.productCount})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Price Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                  <span className="text-xs text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Brand Filter */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand</label>
                <input
                  type="text"
                  placeholder="Filter by brand..."
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium"
                />
              </div>

              {/* Checkbox Options */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="font-bold">In Stock Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
                  <input
                    type="checkbox"
                    checked={rxRequired}
                    onChange={(e) => setRxRequired(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>Prescription Required (Rx)</span>
                  </span>
                </label>
              </div>
            </aside>

            {/* Right Product Grid Area */}
            <div className="md:col-span-3 space-y-6">
              {/* Sorting Bar (Crisp White Card) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <span className="text-xs font-semibold text-slate-600">
                  Showing <strong className="text-slate-900 font-black">{products.length}</strong> of {total} products
                </span>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Products View */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="h-80 rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3 animate-pulse shadow-xs">
                      <div className="aspect-square w-full rounded-xl bg-slate-100" />
                      <div className="h-4 w-3/4 bg-slate-100 rounded-lg" />
                      <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center space-y-4 shadow-xs">
                  <div className="text-5xl">🥦💊</div>
                  <h3 className="text-lg font-black text-slate-900">No Products Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                    We couldn't find any products matching your active filters. Try resetting filters or searching for something else.
                  </p>
                  <PrimaryButton size="sm" onClick={resetFilters}>
                    Reset All Filters
                  </PrimaryButton>
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

              {/* Pagination */}
              {total > 12 && (
                <div className="flex justify-center items-center gap-3 pt-6">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-30 transition-all shadow-xs cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">Page {page}</span>
                  <button
                    type="button"
                    disabled={page * 12 >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-30 transition-all shadow-xs cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm md:hidden animate-fadeIn">
          <div className="fixed inset-0 cursor-pointer" onClick={() => setIsMobileFilterOpen(false)} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-xs h-full bg-white p-6 shadow-2xl overflow-y-auto flex flex-col justify-between text-slate-900 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                  <Filter className="h-4 w-4 text-emerald-600" />
                  <span>Filter Products</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 font-bold"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Categories Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Categories</label>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      !selectedCategory
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === cat.slug
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] opacity-70">({cat.productCount})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Price Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                  <span className="text-xs text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs font-medium text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                  />
                  <span className="font-bold">In Stock Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rxRequired}
                    onChange={(e) => setRxRequired(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 h-4 w-4"
                  />
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Prescription (Rx)</span>
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

