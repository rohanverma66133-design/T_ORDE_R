'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge, PrimaryButton, SecondaryButton } from '@tord/ui';
import { CheckCircle2, Clock, MapPin, Phone, HelpCircle, Package, Truck, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface OrderTrackingViewProps {
  orderId: string;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = () => {
    setIsLoading(true);
    apiGet<any>(`/orders/${orderId}`)
      .then((data) => {
        setOrder(data);
        setError(null);
      })
      .catch((err) => {
        setError('Order not found');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // Polling every 15s for live updates
    return () => clearInterval(interval);
  }, [orderId]);

  if (isLoading && !order) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-midnight font-sans text-slate-100">
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-12 mb-20">
          <div className="h-96 rounded-3xl glass-surface border border-white/10 animate-pulse" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-midnight font-sans text-slate-100">
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-20 mb-20 text-center space-y-4">
          <h1 className="text-3xl font-black text-white">Order Details Not Found</h1>
          <Link href="/orders" className="text-xs font-black text-aurora hover:underline">
            ← Return to My Orders
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-20 space-y-8">
          {/* Header Banner (Crisp White Card) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                  {order.status}
                </span>
                <span className="text-xs text-slate-500 font-medium">• Placed on {new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fulfilled by <strong className="text-slate-900">{order.storeName}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchOrder}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-emerald-700 flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Live Status</span>
              </button>
              <Link href="/help">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Support</span>
                </button>
              </Link>
            </div>
          </div>

          {/* RESPONSIVE TRACKING TIMELINE (Crisp White Card with Emerald Status) */}
          <div className="p-6 sm:p-8 space-y-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <Truck className="h-5 w-5 text-emerald-600" />
              <span>Live Order Delivery Tracking</span>
            </h2>

            <div className="relative pt-2">
              {/* Timeline Steps (Desktop Grid & Mobile List) */}
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                {order.timeline?.map((step: any, idx: number) => (
                  <div key={idx} className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        step.isCurrent
                          ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-md scale-110'
                          : step.isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {step.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-xs font-bold ${step.isCurrent ? 'text-emerald-800 font-black' : 'text-slate-700'}`}>
                        {step.label}
                      </h4>
                      {step.timestamp && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details & Address Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Items Summary */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 sm:p-7 space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2.5">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <span>Items Ordered ({order.items?.length})</span>
                </h3>

                <div className="space-y-3 divide-y divide-slate-100">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between pt-3 text-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-2xl">📦</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{item.productName}</h4>
                          <p className="text-[11px] text-slate-500">Quantity: {item.quantity} | ₹{item.unitPrice.toFixed(2)} each</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Address & Payment Status */}
            <div className="space-y-4">
              <div className="p-6 space-y-3 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Delivery Address</span>
                </h3>
                {order.deliveryAddress ? (
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900">{order.deliveryAddress.label || 'Home'}</p>
                    <p>{order.deliveryAddress.line1}</p>
                    {order.deliveryAddress.line2 && <p>{order.deliveryAddress.line2}</p>}
                    <p className="text-slate-400">{order.deliveryAddress.city} - {order.deliveryAddress.postalCode}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Town Center Direct Delivery</p>
                )}
              </div>

              <div className="p-6 space-y-3 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Payment &amp; Cost Summary
                </h3>
                <div className="space-y-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <strong className="text-slate-900">{order.paymentMethod}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment State</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2.5 border-t border-slate-100">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">₹{order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%)</span>
                    <span className="text-slate-900 font-bold">₹{order.taxAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{order.deliveryFee === 0 ? <strong className="text-emerald-700 font-bold">FREE</strong> : `₹${order.deliveryFee?.toFixed(2)}`}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount</span>
                      <span>-₹{order.discountAmount?.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black pt-3 border-t border-slate-100 text-slate-900">
                    <span>Total Amount</span>
                    <span className="text-emerald-800 text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
