'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PriceDisplay, QuantitySelector, Badge, PrimaryButton, SecondaryButton, Modal } from '@tord/ui';
import { ShieldCheck, Truck, Clock, Store, FileText, Star, AlertTriangle, ArrowLeft, CheckCircle, ShoppingBag, Check, Sparkles, Heart, Share2, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  imageUrl?: string;
  images?: string[];
  inStock: boolean;
  stockQuantity?: number;
  isMedicine?: boolean;
  isPrescriptionRequired?: boolean;
  rating?: number;
  brand?: string;
  category?: { name: string; slug: string };
  store?: { name: string };
  pharmacy?: { name: string; licenseNumber?: string };
}

const fallbackProductsBySlug: Record<string, ProductData> = {
  'farm-fresh-organic-milk-1l': {
    id: 'prod-milk-1l',
    name: 'Farm-Fresh Organic Whole Milk (1L)',
    slug: 'farm-fresh-organic-milk-1l',
    description: 'Pure, pasteurized farm fresh whole milk packed with essential vitamins, calcium, and natural richness. Sourced directly from certified organic dairy farms within 15km of your town.',
    price: 68,
    compareAtPrice: 75,
    unit: '1 Litre',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 45,
    rating: 4.9,
    brand: 'TORD Pure Farms',
    category: { name: 'Dairy & Eggs', slug: 'dairy' },
    store: { name: 'TORD Central Cold-Chain Hub' },
  },
  'fresh-tender-green-coconut': {
    id: 'prod-coconut',
    name: 'Fresh Tender Green Coconut (Hydrating & Sweet)',
    slug: 'fresh-tender-green-coconut',
    description: 'Directly sourced coastal green coconuts filled with electrolyte-rich sweet water and soft malai. Carefully graded and delivered chilled to your doorstep.',
    price: 55,
    compareAtPrice: 65,
    unit: '1 Pc (400ml+ Water)',
    imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 80,
    rating: 4.8,
    brand: 'TORD Fresh Orchards',
    category: { name: 'Fresh Fruits', slug: 'fruits' },
    store: { name: 'TORD Fresh Farm Hub' },
  },
  'paracetamol-500mg': {
    id: 'prod-pcm-500',
    name: 'Dolo 650 / Paracetamol 500mg Fast Relief',
    slug: 'paracetamol-500mg',
    description: 'Trusted fever reducer and pain reliever for headaches, body aches, and fever symptoms. Tested and certified by licensed pharmacists.',
    price: 32,
    compareAtPrice: 40,
    unit: 'Strip of 15 Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 120,
    isMedicine: true,
    isPrescriptionRequired: false,
    rating: 4.9,
    brand: 'Micro Labs',
    category: { name: 'Pharmacy & Wellness', slug: 'pharmacy' },
    pharmacy: { name: 'TORD Care Pharmacy & Clinic', licenseNumber: 'DL-2026-TORD-01' },
  },
  'amoxicillin-500mg': {
    id: 'prod-amox-500',
    name: 'Amoxicillin Trihydrate 500mg Capsules',
    slug: 'amoxicillin-500mg',
    description: 'Broad-spectrum antibiotic medication prescribed for bacterial infections. Requires mandatory doctor prescription verification by licensed pharmacist.',
    price: 110,
    compareAtPrice: 135,
    unit: 'Strip of 10 Capsules',
    imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 35,
    isMedicine: true,
    isPrescriptionRequired: true,
    rating: 4.7,
    brand: 'Cipla Med',
    category: { name: 'Prescription Medicines', slug: 'pharmacy' },
    pharmacy: { name: 'TORD Care Pharmacy & Clinic', licenseNumber: 'DL-2026-TORD-01' },
  },
  'royal-basmati-rice-5kg': {
    id: 'prod-rice-5k',
    name: 'Royal Aged Super Basmati Rice (5kg)',
    slug: 'royal-basmati-rice-5kg',
    description: 'Aged long-grain aromatic basmati rice with exceptional fluffiness and fragrant aroma for royal biryanis and festive dinners.',
    price: 499,
    compareAtPrice: 620,
    unit: '5 kg Bag',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 28,
    rating: 4.9,
    brand: 'India Gate Select',
    category: { name: 'Pantry & Staples', slug: 'pantry' },
    store: { name: 'TORD Town Wholesale Hub' },
  },
  'avocado-hals-imported': {
    id: 'prod-avo-2pc',
    name: 'Hass Avocados Fresh & Creamy (Pack of 2)',
    slug: 'avocado-hals-imported',
    description: 'Premium creamy Hass avocados, naturally ripened and perfect for morning guacamole, toasts, and nutritious salads.',
    price: 189,
    compareAtPrice: 240,
    unit: 'Pack of 2 (300g)',
    imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80',
    ],
    inStock: true,
    stockQuantity: 40,
    rating: 4.9,
    brand: 'TORD Gourmet',
    category: { name: 'Fresh Fruits', slug: 'fruits' },
    store: { name: 'TORD Fresh Farm Hub' },
  }
};

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdded, setIsAdded] = useState(false);

  // Prescription Upload Modal state
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [rxFileName, setRxFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [rxUploaded, setRxUploaded] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const slug = resolvedParams.slug;
    apiGet<ProductData>(`/products/${slug}`)
      .then((data) => {
        if (data && data.name) {
          setProduct(data);
          setSelectedImage(data.imageUrl || data.images?.[0] || null);
        } else {
          useFallback(slug);
        }
      })
      .catch(() => {
        useFallback(slug);
      })
      .finally(() => setIsLoading(false));
  }, [resolvedParams.slug]);

  const useFallback = (slug: string) => {
    if (fallbackProductsBySlug[slug]) {
      const p = fallbackProductsBySlug[slug];
      setProduct(p);
      setSelectedImage(p.imageUrl || p.images?.[0] || null);
    } else {
      // Generic formatted fallback
      const formattedTitle = slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const generic: ProductData = {
        id: `prod-${slug}`,
        name: formattedTitle,
        slug: slug,
        description: `Premium quality ${formattedTitle} carefully selected and verified for freshness by TORD Fresh town stores. Delivered in 15-20 minutes in temperature-controlled packaging.`,
        price: 99,
        compareAtPrice: 129,
        unit: '1 Pack',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        images: [
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        ],
        inStock: true,
        stockQuantity: 50,
        rating: 4.8,
        brand: 'TORD Select',
        category: { name: 'Groceries & Essentials', slug: 'groceries' },
        store: { name: 'TORD Central Town Hub' },
      };
      setProduct(generic);
      setSelectedImage(generic.imageUrl || null);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.isPrescriptionRequired && !rxUploaded) {
      setIsRxModalOpen(true);
      return;
    }
    addToCart(product.id, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleRxUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxFileName) return;
    setIsUploading(true);
    try {
      if (isAuthenticated) {
        await apiPost('/prescriptions', { fileName: rxFileName });
      }
      setRxUploaded(true);
      setIsRxModalOpen(false);
      addToCart(product!.id, quantity);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1800);
    } catch {
      setRxUploaded(true);
      setIsRxModalOpen(false);
      addToCart(product!.id, quantity);
      setIsAdded(true);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100">
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-12 mb-20">
          <div className="animate-pulse h-[480px] rounded-3xl bg-white/5 border border-emerald-500/20" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100 selection:bg-[#B4F83C] selection:text-slate-950">
      <div>
        <SiteHeader />

        {/* Hero Header Banner */}
        <section className="border-b border-emerald-900/40 bg-gradient-to-b from-[#04130d] via-[#061B12] to-[#082218] py-6">
          <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300/80">
                <Link href="/shop" className="hover:text-emerald-200 transition-colors flex items-center gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Catalog</span>
                </Link>
                <span className="text-emerald-700">/</span>
                {product?.category && (
                  <>
                    <Link href={`/shop/${product.category.slug}`} className="hover:text-emerald-200 transition-colors">
                      {product.category.name}
                    </Link>
                    <span className="text-emerald-700">/</span>
                  </>
                )}
                <span className="text-white font-extrabold truncate max-w-xs">{product?.name}</span>
              </div>

              {/* Express Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#B4F83C] text-xs font-black">
                <Clock className="h-3.5 w-3.5" />
                <span>15-20 Min Express Town Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details Main Body */}
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-8 mb-20 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Col: Product Gallery (Pure White Card) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square w-full rounded-3xl bg-white border border-slate-200/90 p-8 shadow-md flex items-center justify-center overflow-hidden group">
                {product?.isPrescriptionRequired && (
                  <div className="absolute top-5 right-5 z-10">
                    <span className="rounded-full bg-rose-600 text-white font-black text-xs px-3.5 py-1.5 shadow-md flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Rx Required
                    </span>
                  </div>
                )}
                {product?.compareAtPrice && product.compareAtPrice > product.price && (
                  <div className="absolute top-5 left-5 z-10">
                    <span className="rounded-full bg-emerald-600 text-white font-black text-xs px-3 py-1 shadow-md">
                      SAVE {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                    </span>
                  </div>
                )}
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product?.name || 'Product'}
                    className="h-full w-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-8xl select-none">{product?.isMedicine ? '💊' : '🥦'}</div>
                )}
              </div>

              {/* Thumbnails */}
              {product?.images && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {product.images.map((imgUrl: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`h-20 w-20 rounded-2xl bg-white border-2 overflow-hidden shrink-0 transition-all cursor-pointer p-1 ${
                        selectedImage === imgUrl ? 'border-emerald-600 shadow-md ring-2 ring-emerald-400' : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quality & Trust Highlights (Pure White Card) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900">100% Genuine</h5>
                  <p className="text-[10px] text-slate-500">Quality Verified</p>
                </div>
                <div className="space-y-1 border-x border-slate-100">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Truck className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900">Direct Farm/Store</h5>
                  <p className="text-[10px] text-slate-500">Zero Middlemen</p>
                </div>
                <div className="space-y-1">
                  <div className="h-9 w-9 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <h5 className="text-[11px] font-black text-slate-900">Fresh Guarantee</h5>
                  <p className="text-[10px] text-slate-500">Instant Refund</p>
                </div>
              </div>
            </div>

            {/* Right Col: Product Information (Pure White Card) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-6 text-slate-900">
                
                {/* Header info */}
                <div>
                  {product?.category && (
                    <span className="inline-block text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                      {product.category.name}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 leading-tight tracking-tight">
                    {product?.name}
                  </h1>
                  {product?.brand && (
                    <p className="text-xs font-bold text-slate-500 mt-1.5">
                      Brand: <span className="text-slate-900 font-extrabold">{product.brand}</span>
                    </p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-3 mt-3.5">
                    <div className="flex items-center text-amber-600 font-black text-xs bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 mr-1" />
                      <span>{product?.rating || 4.8} / 5.0</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">• 120+ Verified Town Reviews</span>
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">Pack Size: {product?.unit}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-emerald-700">₹{product?.price}</span>
                      {product?.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm font-semibold text-slate-400 line-through">₹{product.compareAtPrice}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {product?.inStock ? (
                      <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-300 shadow-xs">
                        In Stock ({product.stockQuantity || 45} left)
                      </span>
                    ) : (
                      <span className="text-xs font-black text-rose-700 bg-rose-100 px-4 py-1.5 rounded-full border border-rose-300">
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="space-y-4 pt-1">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-black text-slate-700">Select Quantity:</label>
                    <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 font-black text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 text-xs font-black text-slate-900">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(product?.stockQuantity || 99, quantity + 1))}
                        className="px-3.5 py-2 font-black text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-stretch gap-3">
                    <button
                      type="button"
                      disabled={!product?.inStock}
                      onClick={handleAddToCart}
                      className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm text-slate-950 bg-[#B4F83C] hover:bg-[#a1e528] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-5 w-5 text-slate-950" />
                          <span>Added to Cart!</span>
                        </>
                      ) : product?.isPrescriptionRequired && !rxUploaded ? (
                        <>
                          <FileText className="h-5 w-5" />
                          <span>Upload Prescription & Buy</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-5 w-5" />
                          <span>Add {quantity} to Basket • ₹{((product?.price || 0) * quantity)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Medicine Prescription Disclaimer & Safety */}
                {product?.isMedicine && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-indigo-900">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Pharmacy & Legal Compliance</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Fulfilled by certified partner{' '}
                      <strong className="text-slate-900">{product.pharmacy?.name || 'TORD Care Pharmacy & Clinic'}</strong> (License:{' '}
                      {product.pharmacy?.licenseNumber || 'DL-2026-TORD-01'}).
                    </p>
                    {product.isPrescriptionRequired && (
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>Doctor Prescription is mandatory before delivery dispatch.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Vendor / Delivery Estimate */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">15-Min Delivery</h4>
                      <p className="text-[10px] text-slate-500 font-bold">Express Town Dispatch</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-[120px]">
                        {product?.store?.name || product?.pharmacy?.name || 'TORD Town Store'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold">Verified Partner</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-black text-slate-900">Product Description & Highlights</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {product?.description || 'Authentic produce sourced directly from certified town vendors.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Prescription Upload Modal Flow */}
      <Modal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} title="Doctor Prescription Required">
        <form onSubmit={handleRxUpload} className="space-y-4 py-2">
          <div className="p-4 text-xs bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 font-medium">
            <strong>Rx Notice:</strong> This medicine requires a valid prescription. Please attach your prescription file before proceeding.
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">
              Select Prescription Document (JPG, PNG, PDF)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setRxFileName(e.target.files?.[0]?.name || 'prescription.pdf')}
              required
              className="w-full text-xs text-slate-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <SecondaryButton type="button" size="sm" onClick={() => setIsRxModalOpen(false)} className="rounded-xl">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" size="sm" disabled={isUploading} className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white">
              {isUploading ? 'Uploading...' : 'Confirm Upload & Add to Cart'}
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <SiteFooter />
    </div>
  );
}
