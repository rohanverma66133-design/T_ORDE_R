'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PrimaryButton, SecondaryButton } from '@tord/ui';
import { MapPin, Truck, CreditCard, ShieldCheck, CheckCircle2, ArrowRight, Plus, AlertTriangle, Sparkles, Lock } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';

interface Address {
  id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'UPI' | 'CARD'>('CASH_ON_DELIVERY');
  const [deliveryOption, setDeliveryOption] = useState<'EXPRESS' | 'STANDARD'>('EXPRESS');
  const [orderNotes, setOrderNotes] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Address Form Modal
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', line1: '', line2: '', city: 'Townsville', postalCode: '395007' });

  // Load Addresses
  useEffect(() => {
    if (isAuthenticated) {
      apiGet<Address[]>('/addresses')
        .then((data) => {
          setAddresses(data);
          const defaultAddr = data.find((a) => a.isDefault) || data[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        })
        .catch((err) => console.warn('Fetch addresses error:', err));
    }
  }, [isAuthenticated]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiPost<Address>('/addresses', newAddress);
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created.id);
      setShowAddAddress(false);
      setNewAddress({ label: 'Home', line1: '', line2: '', city: 'Townsville', postalCode: '395007' });
    } catch (err: any) {
      alert('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (!selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const createdOrder = await apiPost<any>('/orders', {
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        notes: orderNotes,
      });

      await refreshCart();
      router.push(`/order/${createdOrder.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to place order. Backend recalculation failed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <SiteHeader />
        <main className="mx-auto w-[min(500px,calc(100%-1.5rem))] mt-16 mb-20 text-center space-y-4">
          <div className="p-10 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Authentication Required</h1>
            <p className="text-xs text-slate-500">Please sign in to proceed through secure encrypted checkout.</p>
            <Link href="/login?redirect=/checkout" className="inline-block pt-2">
              <button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Login to Continue
              </button>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const subtotal = cart?.subtotal || 0;
  const deliveryFee = subtotal >= 500 ? 0 : 25;
  const estimatedTax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = subtotal + deliveryFee + estimatedTax;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-20 space-y-8">
          {/* Header & Step Progression (Crisp White Card) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span>Direct Checkout</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>256-Bit Encrypted</span>
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Safe healthcare &amp; town grocery direct fulfillment</p>
            </div>

            {/* Step Progress Pills */}
            <div className="flex items-center gap-2 text-xs font-bold overflow-x-auto pb-1 sm:pb-0">
              {[
                { stepNum: 1, label: '1. Address' },
                { stepNum: 2, label: '2. Delivery' },
                { stepNum: 3, label: '3. Review' },
                { stepNum: 4, label: '4. Payment' },
              ].map((s) => (
                <button
                  key={s.stepNum}
                  type="button"
                  onClick={() => setStep(s.stepNum)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap text-xs ${
                    step === s.stepNum
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : step > s.stepNum
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* STEP 1: Address Selection */}
              <div className={`p-6 sm:p-7 space-y-4 rounded-3xl bg-white border transition-all ${step === 1 ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs' : 'border-slate-200/90'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span>Step 1: Select Delivery Address</span>
                  </div>
                  {step !== 1 && (
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                      Edit Address
                    </button>
                  )}
                </div>

                {step === 1 && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                              : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{addr.label || 'Address'}</span>
                            {selectedAddressId === addr.id && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{addr.line1}, {addr.line2}</p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-1">{addr.city} - {addr.postalCode}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add New Address</span>
                      </button>

                      {showAddAddress && (
                        <form onSubmit={handleCreateAddress} className="mt-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Label (e.g. Home, Office)"
                              value={newAddress.label}
                              onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                            <input
                              type="text"
                              placeholder="Pincode"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                              className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </div>
                          <input
                            type="text"
                            placeholder="Flat / Building / Street Line 1"
                            value={newAddress.line1}
                            onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                            required
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                          <input
                            type="text"
                            placeholder="Sector / Colony Line 2"
                            value={newAddress.line2}
                            onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                          />
                          <button
                            type="submit"
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            Save &amp; Use Address
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!selectedAddressId}
                        onClick={() => setStep(2)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        Continue to Delivery Option →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Delivery Option */}
              <div className={`p-6 sm:p-7 space-y-4 rounded-3xl bg-white border transition-all ${step === 2 ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs' : 'border-slate-200/90'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <Truck className="h-4 w-4" />
                    </div>
                    <span>Step 2: Choose Delivery Option</span>
                  </div>
                  {step !== 2 && (
                    <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                      Change Option
                    </button>
                  )}
                </div>

                {step === 2 && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setDeliveryOption('EXPRESS')}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                          deliveryOption === 'EXPRESS'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <span>⚡ Express 15-Min Town Dispatch</span>
                        </span>
                        <p className="text-xs text-slate-600 mt-1">Direct store delivery under 15-20 minutes.</p>
                      </div>

                      <div
                        onClick={() => setDeliveryOption('STANDARD')}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                          deliveryOption === 'STANDARD'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">Standard Scheduled Delivery</span>
                        <p className="text-xs text-slate-600 mt-1">Delivered within 2-3 hours today.</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Continue to Review Items →
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 3: Order Review */}
              <div className={`p-6 sm:p-7 space-y-4 rounded-3xl bg-white border transition-all ${step === 3 ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs' : 'border-slate-200/90'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span>Step 3: Review Items &amp; Instructions</span>
                  </div>
                  {step !== 3 && (
                    <button type="button" onClick={() => setStep(3)} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                      Review Items
                    </button>
                  )}
                </div>

                {step === 3 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2.5 divide-y divide-slate-100">
                      {cart?.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs py-2.5">
                          <div>
                            <span className="font-bold text-slate-900">{item.productName}</span>
                            <span className="text-slate-500 ml-2">x {item.quantity}</span>
                          </div>
                          <span className="font-bold text-slate-900">₹{item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Delivery Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Call before arrival, leave at security gate..."
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Continue to Payment Method →
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 4: Payment Selection */}
              <div className={`p-6 sm:p-7 space-y-4 rounded-3xl bg-white border transition-all ${step === 4 ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs' : 'border-slate-200/90'}`}>
                <div className="flex items-center gap-2.5 font-bold text-base text-slate-900">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <span>Step 4: Select Payment Method</span>
                </div>

                {step === 4 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-3">
                      <label
                        onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'CASH_ON_DELIVERY' ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" checked={paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => {}} className="accent-emerald-700" />
                          <div>
                            <span className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</span>
                            <p className="text-[11px] text-slate-500">Pay cash or scan QR code upon doorstep arrival.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      </label>

                      <label
                        onClick={() => setPaymentMethod('UPI')}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          paymentMethod === 'UPI' ? 'border-emerald-600 bg-emerald-50/50 shadow-xs' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input type="radio" name="payment" checked={paymentMethod === 'UPI'} onChange={() => {}} className="accent-emerald-700" />
                          <div>
                            <span className="text-xs font-bold text-slate-900">Instant Online Payment (UPI / QR)</span>
                            <p className="text-[11px] text-slate-500">Pay via GooglePay, PhonePe, Paytm or Credit Card.</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isPlacingOrder}
                        onClick={handlePlaceOrder}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <span>{isPlacingOrder ? 'Confirming Order & Recalculating...' : 'Place Order & Confirm'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary (Crisp White Card) */}
            <div className="p-6 sm:p-7 space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Order Total Breakdown
              </h3>
              <div className="space-y-2.5 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="text-slate-900 font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Taxes (5%)</span>
                  <span className="text-slate-900 font-bold">₹{estimatedTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Town Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <strong className="text-emerald-700 font-bold">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-3 border-t border-slate-100 text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-emerald-800 text-xl font-black">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200">
                🔒 Protected by backend price recalculation engine. Prices verified against database contracts.
              </div>
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
