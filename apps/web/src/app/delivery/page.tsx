import { SiteHeader } from '@/components/site-header';
import { GlassCard, PrimaryButton, SecondaryButton, StatusBadge } from '@tord/ui';
import { Navigation, Package, CheckCircle } from 'lucide-react';

export default function DeliveryDashboardPage() {
  const activeAssignment = {
    orderNumber: 'ORD-2026-000002',
    status: 'OUT_FOR_DELIVERY',
    pickup: 'Town Care Pharmacy, Block A',
    dropoff: 'Anita Sharma, House #18, Sector 3, Town',
    customerPhone: '+91 9876543211',
    itemSummary: '1x Amoxicillin 500mg (Rx Verified)',
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Delivery Partner Portal</h1>
            <p className="text-xs text-[var(--color-silver)]">Active assignments and route dispatch</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            🟢 Online & Available
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--color-background)]">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[var(--color-primary)]" />
                <h3 className="text-base font-bold text-[var(--color-charcoal)]">
                  Active Assignment: {activeAssignment.orderNumber}
                </h3>
              </div>
              <StatusBadge status={activeAssignment.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <span className="font-bold text-amber-900">Pickup Location:</span>
                <p className="text-amber-800 mt-0.5">{activeAssignment.pickup}</p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200">
                <span className="font-bold text-teal-900">Delivery Address:</span>
                <p className="text-teal-800 mt-0.5">{activeAssignment.dropoff}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <PrimaryButton size="md" className="gap-2">
                <Navigation className="h-4 w-4" />
                <span>Start Turn-by-Turn GPS</span>
              </PrimaryButton>
              <SecondaryButton size="md" className="gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>Mark as Delivered</span>
              </SecondaryButton>
            </div>
          </GlassCard>

          <GlassCard className="space-y-3 h-fit">
            <h4 className="text-sm font-bold text-[var(--color-charcoal)]">Today's Earnings</h4>
            <span className="text-3xl font-extrabold text-[var(--color-primary-dark)]">₹850.00</span>
            <p className="text-xs text-[var(--color-silver)]">12 deliveries completed cleanly</p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
