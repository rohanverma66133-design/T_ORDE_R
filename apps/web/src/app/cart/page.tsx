'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PriceDisplay, QuantitySelector, PrimaryButton, SecondaryButton, GlassCard, Badge } from '@tord/ui';
import { ShoppingCart, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { apiPost } from '@/lib/api';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const subtotal = cart?.subtotal || 0;
  const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0 : 25;
  const estimatedTax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST avg
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee + estimatedTax - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponCode.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const res = await apiPost<{ valid: boolean; code: string; discountAmount: number }>('/coupons/validate', {
        code: couponCode.trim(),
        subtotal,
      });
      setAppliedCoupon({ code: res.code, discountAmount: res.discountAmount });
    } catch (err: any) {
      setCouponError(err?.message || 'Invalid coupon code');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <div>
          <SiteHeader />
          <main className="mx-auto w-[min(560px,calc(100%-1.5rem))] mt-16 mb-20 text-center space-y-6">
            <div className="p-10 sm:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Please Sign In to View Cart</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                  Access your active cart items across devices, apply personal promo vouchers, and place instant deliveries.
                </p>
              </div>
              <Link href="/login?redirect=/cart" className="inline-block pt-2 w-full sm:w-auto">
                <button
                  type="button"
                  className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-10 py-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Login / Register
                </button>
              </Link>
            </div>
          </main>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-20 space-y-8">
          {/* Header Title Bar (Crisp White Card) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-2xs">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span>Shopping Cart</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {cart?.itemCount || 0} items
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Verify items for instant 15-minute direct town dispatch</p>
              </div>
            </div>

            {cart?.items && cart.items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All Items</span>
              </button>
            )}
          </div>

          {!cart?.items || cart.items.length === 0 ? (
            <div className="p-16 text-center space-y-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                <ShoppingBag className="h-10 w-10 text-slate-400" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900">Your Cart is Currently Empty</h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
                  Explore fresh town groceries or certified pharmacy medicine catalog to fill your cart.
                </p>
              </div>
              <Link href="/shop" className="inline-block pt-3">
                <button
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Explore Catalog Now
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {cart.hasPrescriptionItems && (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3.5">
                    <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Doctor Prescription Required</h4>
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        Items in this cart will be reviewed by a certified licensed pharmacist before doorstep dispatch.
                      </p>
                    </div>
                  </div>
                )}

                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-emerald-300 transition-colors">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-3xl select-none">{item.isMedicine ? '💊' : '🥦'}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/product/${item.productSlug}`} className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                            {item.productName}
                          </Link>
                          {item.isPrescriptionRequired && (
                            <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[9px] font-bold text-rose-700">
                              Rx Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Pack: {item.unit} | ₹{item.unitPrice.toFixed(2)} each</p>
                        {item.storeName && (
                          <p className="text-[10px] font-bold text-emerald-700">Store: {item.storeName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center pt-2 sm:pt-0">
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => updateQuantity(item.id, Math.min(item.stockAvailable, item.quantity + 1))}
                        onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                        max={item.stockAvailable}
                      />

                      <span className="text-base font-black text-slate-900 w-24 text-right">
                        ₹{item.subtotal.toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary & Coupon Card (Crisp White Luxury Card) */}
              <div className="space-y-4">
                <div className="p-6 sm:p-7 space-y-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <h3 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>Order Summary</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">TORD Direct</span>
                  </h3>

                  {/* Coupon Input */}
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Apply Promo Voucher</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. WEEKEND30"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 uppercase font-bold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={isValidatingCoupon}
                        className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isValidatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-[11px] text-rose-500 font-bold">{couponError}</p>}
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                        <span>Voucher '{appliedCoupon.code}' Applied</span>
                        <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </form>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-xs font-medium text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Items Subtotal</span>
                      <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Estimated GST Tax (5%)</span>
                      <span className="text-slate-900 font-bold">₹{estimatedTax.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Express Delivery Fee</span>
                      <span>
                        {deliveryFee === 0 ? (
                          <strong className="text-emerald-700 font-bold">FREE</strong>
                        ) : (
                          <span className="text-slate-900 font-bold">₹{deliveryFee.toFixed(2)}</span>
                        )}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Promo Discount</span>
                        <span>-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-black text-slate-900 pt-4 border-t border-slate-100">
                      <span>Total Payable</span>
                      <span className="text-emerald-800 text-xl font-black">₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className="block pt-2">
                    <button
                      type="button"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>

                  <p className="text-[10px] text-center text-slate-500 font-medium">
                    🔒 256-Bit SSL Encrypted Healthcare &amp; Grocery Checkout.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
