'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge, PrimaryButton } from '@tord/ui';
import { Package, Truck, ArrowRight, Clock, RefreshCcw } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatDate, formatTime } from '@/lib/date';
import { useAuth } from '@/providers/auth-provider';

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      apiGet<any[]>('/orders')
        .then(setOrders)
        .catch((err) => console.warn('Orders fetch error:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <SiteHeader />
        <main className="mx-auto w-[min(500px,calc(100%-1.5rem))] mt-16 mb-20 text-center space-y-4">
          <div className="p-10 space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <Package className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Log in to view Order History</h1>
            <p className="text-xs text-slate-500">Track current town deliveries and review previous order receipts.</p>
            <Link href="/login?redirect=/orders" className="inline-block pt-2">
              <button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Login / Register
              </button>
            </Link>
          </div>
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
          <div className="flex items-center justify-between p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <span>My Orders</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {orders.length} orders
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">Real-time status updates and order records</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-40 rounded-3xl bg-white border border-slate-200/80 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900">No Orders Placed Yet</h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto font-medium">
                Once you place an order for groceries or medicines, you can track live dispatch status right here.
              </p>
              <Link href="/shop" className="inline-block pt-2">
                <button
                  type="button"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Browse Catalog
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 transition-all shadow-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900">Order #{ord.orderNumber}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
                        {ord.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium" suppressHydrationWarning>
                      Placed on {formatDate(ord.createdAt)} at {formatTime(ord.createdAt)}
                    </p>

                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 pt-1">
                      <span>{ord.items?.length || 1} Items</span>
                      <span>•</span>
                      <span className="text-emerald-800 font-black">Total: ₹{ord.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link href={`/orders/${ord.id}`}>
                      <button
                        type="button"
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Truck className="h-4 w-4" />
                        <span>Track Live Delivery</span>
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
