'use client';

import { useState, useEffect } from 'react';
import { X, Star, ShoppingBag, Heart, Check, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { PriceDisplay, QuantitySelector } from '@tord/ui';
import { cn } from '@tord/ui';

export interface QuickViewProduct {
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
  description?: string;
}

export interface QuickViewModalProps {
  product: QuickViewProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: string, quantity: number) => void;
}

export function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setIsAdded(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    if (onAddToCart) onAddToCart(product.id, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* Backdrop listener */}
      <div className="fixed inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl p-5 sm:p-8 my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Left Product Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" />
            ) : (
              <div className="text-6xl select-none">
                {product.isMedicine ? '💊' : '🥦'}
              </div>
            )}
            {product.isPrescriptionRequired && (
              <span className="absolute top-3 left-3 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-xs">
                Doctor Rx Required
              </span>
            )}
          </div>

          {/* Right Product Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span className="uppercase tracking-wider text-emerald-700 font-bold text-[10px]">
                  {product.categoryName || (product.isMedicine ? 'Healthcare' : 'Fresh Grocery')}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-slate-700">{(product.rating || 4.8).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({product.ratingCount || 36})</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>
              {product.brand && <p className="text-xs text-slate-500 font-medium mt-0.5">{product.brand}</p>}
              <p className="text-xs text-slate-600 font-medium mt-0.5">Net Content: {product.unit}</p>
            </div>

            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} />

            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {product.description ||
                '100% genuine guaranteed quality. Direct farm harvest & verified dispatch with 15-minute doorstep express delivery.'}
            </p>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity((q) => Math.min(q + 1, 99))}
                onDecrease={() => setQuantity((q) => Math.max(q - 1, 1))}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={product.inStock === false}
                className={cn(
                  'flex-1 rounded-xl py-3 px-5 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95',
                  isAdded
                    ? 'bg-emerald-700 text-white animate-bounce-cart'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>Add to Cart ({quantity})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Wishlist toggle"
                className="h-11 w-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors cursor-pointer"
              >
                <Heart className={cn('h-5 w-5', isWishlisted && 'fill-rose-500 text-rose-500')} />
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-3 flex items-center gap-4 text-[11px] font-medium text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1 text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> 100% Genuine</span>
              <span className="flex items-center gap-1 text-slate-700"><Truck className="h-3.5 w-3.5 text-emerald-600" /> 15-Min Express</span>
              <span className="flex items-center gap-1 text-slate-700"><RotateCcw className="h-3.5 w-3.5 text-emerald-600" /> Easy Returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
