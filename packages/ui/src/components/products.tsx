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
  return (
    <div suppressHydrationWarning className={cn('flex items-baseline gap-1 flex-wrap', className)}>
      <span className="text-sm sm:text-base lg:text-lg font-black text-emerald-800 tracking-tight leading-none whitespace-nowrap">
        {currency}{price % 1 === 0 ? price : price.toFixed(2)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium leading-none whitespace-nowrap">
          {currency}{compareAtPrice % 1 === 0 ? compareAtPrice : compareAtPrice.toFixed(2)}
        </span>
      )}
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
      className="group relative flex flex-col justify-between h-full rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3.5 lg:p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 overflow-hidden"
    >
      {/* Top Badges & Floating Wishlist Icon */}
      <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap max-w-[75%]">
          {discountPercent ? (
            <span className="rounded-md bg-emerald-700 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs leading-tight">
              {discountPercent}% OFF
            </span>
          ) : null}

          {isPrescriptionRequired && (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs leading-tight">
              Rx
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
          className="pointer-events-auto h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 cursor-pointer"
        >
          <Heart className={cn('h-3 w-3 sm:h-3.5 sm:w-3.5 transition-colors', isWishlisted && 'fill-rose-500 text-rose-500')} />
        </button>
      </div>

      <div suppressHydrationWarning className="flex flex-col">
        {/* Product Image Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-slate-100/60 transition-colors p-1.5 sm:p-2">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.opacity = '0.3';
              }}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="text-3xl sm:text-4xl select-none">
              {isMedicine ? '💊' : '🛒'}
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
              className="hidden sm:flex absolute inset-x-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 rounded-lg bg-white/95 hover:bg-white border border-slate-200 text-slate-800 text-[11px] font-bold py-1.5 shadow-sm items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              <span>Quick View</span>
            </button>
          )}
        </div>

        {/* Category & Star Rating */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-slate-500 mb-1 gap-1">
          <span className="uppercase tracking-wider text-emerald-700 font-bold text-[9px] sm:text-[10px] truncate max-w-[90px] sm:max-w-[120px]">
            {categoryName || (isMedicine ? 'Health' : 'Produce')}
          </span>
          <div className="flex items-center gap-0.5 text-amber-500 font-semibold text-[9px] sm:text-[10px] shrink-0">
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
            <span className="text-slate-700">{rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal hidden xs:inline">({ratingCount})</span>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2rem] sm:min-h-[2.25rem] leading-snug group-hover:text-emerald-700 transition-colors">
          {name}
        </h3>

        {/* Unit & Brand */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mt-1 gap-1">
          <span className="truncate max-w-[70px] sm:max-w-[100px]">{brand || ''}</span>
          <span className="font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] truncate shrink-0">{unit}</span>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 min-w-0" suppressHydrationWarning>
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm sm:text-base lg:text-lg font-black text-emerald-800 tracking-tight leading-none whitespace-nowrap">
              ₹{price % 1 === 0 ? price : price.toFixed(2)}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium leading-none whitespace-nowrap">
                ₹{compareAtPrice % 1 === 0 ? compareAtPrice : compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          disabled={!inStock}
          onClick={handleAdd}
          className={cn(
            'rounded-lg px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 min-h-[28px] sm:min-h-[32px] h-7 sm:h-8',
            isAdded
              ? 'bg-emerald-700 text-white shadow-xs'
              : inStock
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          )}
        >
          {isAdded ? (
            <div className="flex items-center gap-1">
              <Check className="h-3 w-3 text-white stroke-[3]" />
              <span className="text-[10px] sm:text-xs">Added</span>
            </div>
          ) : inStock ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs">Add</span>
              <Plus className="h-3 w-3 stroke-[2.5]" />
            </div>
          ) : (
            <span className="text-[10px]">Sold Out</span>
          )}
        </Button>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs animate-pulse flex flex-col justify-between h-full">
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
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  }[columns];

  return (
    <div suppressHydrationWarning className={cn('grid gap-3 sm:gap-4 lg:gap-5', colClass, className)}>
      {children}
    </div>
  );
}
