import { SiteHeader } from '@/components/site-header';
import { Card, StatusBadge, Badge } from '@tord/ui';
import { Users, Store, ShoppingBag, DollarSign } from 'lucide-react';

export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Orders', value: '1,284', icon: ShoppingBag, change: '+12% this week' },
    { label: 'Active Stores & Pharmacies', value: '48', icon: Store, change: '3 pending review' },
    { label: 'Registered Customers', value: '8,920', icon: Users, change: '+140 today' },
    { label: 'Platform Revenue', value: '₹4.82L', icon: DollarSign, change: '+18% vs last month' },
  ];

  const recentOrders = [
    { id: 'ORD-2026-000001', customer: 'Town Resident', type: 'Grocery', store: 'Town Fresh Mart', amount: '₹290.00', status: 'DELIVERED', date: '2026-09-14 10:30' },
    { id: 'ORD-2026-000002', customer: 'Anita Sharma', type: 'Pharmacy (Rx)', store: 'Town Care Pharmacy', amount: '₹145.00', status: 'OUT_FOR_DELIVERY', date: '2026-09-14 16:15' },
    { id: 'ORD-2026-000003', customer: 'Vikram Singh', type: 'Grocery', store: 'Town Fresh Mart', amount: '₹680.00', status: 'CONFIRMED', date: '2026-09-14 16:45' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <SiteHeader />
      <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Platform Super Admin Dashboard</h1>
          <p className="text-xs text-[var(--color-silver)]">Structured data management and system metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-silver)]">
                  {stat.label}
                </span>
                <stat.icon className="h-5 w-5 text-[var(--color-primary-dark)]" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-extrabold text-[var(--color-charcoal)]">{stat.value}</span>
                <p className="text-[11px] text-[var(--color-primary-dark)] font-semibold mt-0.5">{stat.change}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Structured Data Table for High Readability */}
        <Card className="p-6">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-[var(--color-background)]">
            <h3 className="text-base font-bold text-[var(--color-charcoal)]">Recent System Orders</h3>
            <span className="text-xs font-semibold text-[var(--color-primary-dark)] cursor-pointer hover:underline">
              View All Orders →
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-light-silver)] text-[var(--color-silver)] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Fulfillment Store</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-background)]">
                {recentOrders.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--color-background)]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[var(--color-charcoal)]">{row.id}</td>
                    <td className="py-3.5 px-4 font-medium">{row.customer}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={row.type.includes('Rx') ? 'prescription' : 'primary'}>{row.type}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{row.store}</td>
                    <td className="py-3.5 px-4 font-bold text-[var(--color-charcoal)]">{row.amount}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3.5 px-4 text-[var(--color-silver)]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
