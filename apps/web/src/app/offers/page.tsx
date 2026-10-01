'use client';

import { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { GlassCard, Badge } from '@tord/ui';
import { Sparkles, Check, Copy, Tag, Percent } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatDate } from '@/lib/date';

const defaultCoupons = [
  {
    id: 'c-1',
    code: 'WEEKEND30',
    title: 'Weekend Mega Savings',
    description: 'Flat ₹30 off on organic harvest vegetables & fruit orders above ₹299.',
    discountType: 'FIXED',
    value: 30,
    minOrderValue: 299,
    validTo: '2026-12-31T23:59:59Z',
  },
  {
    id: 'c-2',
    code: 'FRESH50',
    title: 'First Order Discount',
    description: 'Get flat 20% off up to ₹150 on your first grocery delivery with TORD.',
    discountType: 'PERCENT',
    value: 20,
    minOrderValue: 199,
    validTo: '2026-12-31T23:59:59Z',
  },
  {
    id: 'c-3',
    code: 'HEALTH15',
    title: 'Pharmacy Essentials',
    description: 'Get 15% discount on all wellness, supplements, and OTC health products.',
    discountType: 'PERCENT',
    value: 15,
    minOrderValue: 399,
    validTo: '2026-12-31T23:59:59Z',
  },
  {
    id: 'c-4',
    code: 'FREESHIP',
    title: 'Free Express Delivery',
    description: 'Enjoy 100% free doorstep dispatch with zero delivery charge on orders over ₹199.',
    discountType: 'FIXED',
    value: 40,
    minOrderValue: 199,
    validTo: '2026-12-31T23:59:59Z',
  },
];

export default function OffersPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<any[]>('/coupons')
      .then((data) => setCoupons(data && data.length > 0 ? data : defaultCoupons))
      .catch(() => setCoupons(defaultCoupons))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-16 space-y-8">
          {/* Luxury Deep Forest Green Header Banner */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#061B12] via-[#0C291D] to-[#0A2616] p-7 sm:p-10 text-white shadow-xl border border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 text-center sm:text-left z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#B4F83C] border border-emerald-700/60 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-[#B4F83C]" />
                <span>Town Promo Directory</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight">
                Exclusive Deals & Promo Codes
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
                Copy active promo vouchers below to claim instant discounts on fresh groceries and prescription medicines.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-44 rounded-3xl bg-white border border-slate-200/80 animate-pulse p-6 shadow-xs" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coupons.map((c) => (
                <div
                  key={c.id}
                  className="p-6 sm:p-7 flex flex-col justify-between space-y-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 uppercase shadow-2xs">
                        {c.discountType === 'FIXED' ? `₹${c.value} FLAT OFF` : `${c.value}% OFF`}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500" suppressHydrationWarning>
                        Valid till {formatDate(c.validTo)}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {c.discountType === 'FIXED' ? `Flat ₹${c.value} Instant Discount` : `Get ${c.value}% Off Your Order`}
                    </h3>

                    <p className="text-xs text-slate-600 font-normal">
                      Valid on orders above <strong className="text-slate-900 font-black">₹{c.minOrderValue}</strong>
                      {c.maxDiscount ? ` (Up to ₹${c.maxDiscount})` : ''}.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="px-4 py-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/70 text-xs font-mono font-black text-emerald-900 tracking-wider">
                      {c.code}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(c.code)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
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

