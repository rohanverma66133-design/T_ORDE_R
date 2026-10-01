'use client';

import { type ReactNode, useState } from 'react';
import { Heart, Star, Check, Eye, Plus } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from './button';

export interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  className?: string;
}

export function PriceDisplay({ price, compareAtPrice, currency = '₹', className }: PriceDisplayProps) {
  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  return (
    <div suppressHydrationWarning className={cn('flex items-baseline gap-1.5 flex-wrap', className)}>
      <span className="text-base sm:text-lg font-bold text-emerald-700 tracking-tight">
        {currency}
        {price.toFixed(2)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-xs text-slate-400 line-through font-normal">
          {currency}
          {compareAtPrice.toFixed(2)}
        </span>
      )}
      {discountPercent ? (
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
          {discountPercent}% OFF
        </span>
      ) : null}
    </div>
  );
}

export interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  disabled = false,
}: QuantitySelectorProps) {
  return (
    <div suppressHydrationWarning className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        className="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
      >
        -
      </button>
      <span className="w-6 text-center text-xs font-bold text-slate-800">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        className="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
      >
        +
      </button>
    </div>
  );
}

export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string | null;
  unit: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string;
  categoryName?: string;
  isPrescriptionRequired?: boolean;
  isMedicine?: boolean;
  inStock?: boolean;
  rating?: number;
  ratingCount?: number;
  onAddToCart?: () => void;
  onQuickView?: () => void;
}

export function ProductCard({
  name,
  brand,
  unit,
  price,
  compareAtPrice,
  imageUrl,
  categoryName,
  isPrescriptionRequired,
  isMedicine,
  inStock = true,
  rating = 4.8,
  ratingCount = 36,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) onAddToCart();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div
      suppressHydrationWarning
      className="group relative flex flex-col justify-between h-full rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200"
    >
      {/* Top Badges & Floating Wishlist Icon */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {discountPercent ? (
            <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {discountPercent}% OFF
            </span>
          ) : null}

          {isPrescriptionRequired && (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
              Rx Req
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted(!isWishlisted);
          }}
          aria-label="Add to wishlist"
          className="pointer-events-auto h-7 w-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 cursor-pointer"
        >
          <Heart className={cn('h-3.5 w-3.5 transition-colors', isWishlisted && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <div suppressHydrationWarning className="flex flex-col">
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:bg-slate-100/60 transition-colors p-2">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="text-4xl select-none">
              {isMedicine ? '💊' : '🥦'}
            </div>
          )}

          {/* Quick View Hover Trigger */}
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView();
              }}
              className="absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 rounded-lg bg-white/95 hover:bg-white border border-slate-200 text-slate-800 text-[11px] font-bold py-1.5 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>Quick View</span>
            </button>
          )}
        </div>

        {/* Category & Star Rating */}
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1">
          <span className="uppercase tracking-wider text-emerald-700 font-bold text-[10px] truncate max-w-[120px]">
            {categoryName || (isMedicine ? 'Healthcare' : 'Fresh Harvest')}
          </span>
          <div className="flex items-center gap-0.5 text-amber-500 font-semibold text-[10px]">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-slate-700">{rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({ratingCount})</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 h-9 leading-snug group-hover:text-emerald-700 transition-colors">
          {name}
        </h3>

        {/* Unit & Brand */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
          <span className="truncate max-w-[100px]">{brand || ''}</span>
          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{unit}</span>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2" suppressHydrationWarning>
        <PriceDisplay price={price} compareAtPrice={compareAtPrice} />

        <Button
          size="sm"
          disabled={!inStock}
          onClick={handleAdd}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer shrink-0',
            isAdded
              ? 'bg-emerald-700 text-white animate-bounce-cart shadow-xs'
              : inStock
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          )}
        >
          {isAdded ? (
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-white stroke-[3]" />
              <span>Added</span>
            </div>
          ) : inStock ? (
            <div className="flex items-center gap-1">
              <span>Add</span>
              <Plus className="h-3 w-3 stroke-[2.5]" />
            </div>
          ) : (
            'Sold Out'
          )}
        </Button>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-pulse flex flex-col justify-between h-full">
      <div>
        <div className="aspect-square w-full rounded-xl bg-slate-100 mb-3" />
        <div className="h-2.5 w-16 rounded-full bg-slate-200 mb-1.5" />
        <div className="h-4 w-full rounded-md bg-slate-200 mb-1" />
        <div className="h-3 w-2/3 rounded-md bg-slate-100 mb-3" />
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
        <div className="h-4 w-14 rounded-md bg-slate-200" />
        <div className="h-7 w-16 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

export interface ProductGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function ProductGrid({ children, columns = 4, className }: ProductGridProps) {
  const colClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }[columns];

  return (
    <div suppressHydrationWarning className={cn('grid gap-4 sm:gap-5', colClass, className)}>
      {children}
    </div>
  );
}
