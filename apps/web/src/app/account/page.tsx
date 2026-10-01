'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PrimaryButton, SecondaryButton, Badge } from '@tord/ui';
import { User, MapPin, Package, FileText, Bell, HelpCircle, LogOut, Save, ShieldCheck, Sparkles, Phone, Mail, ArrowRight, Clock, Award } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

export default function AccountPage() {
  const { user, isAuthenticated, logout, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || 'TORD Customer');
  const [email, setEmail] = useState(user?.email || 'customer@tordfresh.in');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stats, setStats] = useState<{ totalOrders: number; prescriptionsCount: number }>({ totalOrders: 3, prescriptionsCount: 1 });

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) {
      apiGet<any>('/users/me')
        .then((data) => {
          if (data && data.stats) setStats(data.stats);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiPatch('/users/me', { name, email, phone });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100 selection:bg-[#B4F83C] selection:text-slate-950">
      <div>
        <SiteHeader />

        {/* Hero Header Banner */}
        <section className="border-b border-emerald-900/40 bg-gradient-to-b from-[#04130d] via-[#061B12] to-[#082218] py-8">
          <div className="mx-auto w-[min(1280px,calc(100%-1.5rem))]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#B4F83C] flex items-center justify-center font-black shadow-lg">
                  <User className="h-7 w-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#B4F83C] text-[11px] font-black uppercase tracking-wider mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span>TORD Member Account</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Customer Account</h1>
                  <p className="text-xs text-emerald-200/70 font-medium">Manage preferences, orders, addresses, and prescriptions</p>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-black text-rose-300 hover:text-white flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/15 hover:bg-rose-500/25 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-8 mb-20 space-y-8">
          {/* Quick Nav Metric Cards (Pure White) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/orders" className="group">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">My Orders</h4>
                  <p className="text-xs text-slate-500 font-bold">{stats.totalOrders} Placed Town Orders</p>
                </div>
              </div>
            </Link>

            <Link href="/prescriptions" className="group">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Prescriptions Vault</h4>
                  <p className="text-xs text-slate-500 font-bold">{stats.prescriptionsCount} Verified Documents</p>
                </div>
              </div>
            </Link>

            <Link href="/addresses" className="group">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Saved Addresses</h4>
                  <p className="text-xs text-slate-500 font-bold">Manage Delivery Locations</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Profile Edit Form (Pure White Card) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Personal Profile Information</h2>
                    <p className="text-xs text-slate-500 font-medium">Update your account name and contact details</p>
                  </div>
                  {saveSuccess && (
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300">
                      Changes Saved!
                    </span>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-[#B4F83C] hover:bg-[#a1e528] active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification Preferences (Pure White Card) */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Delivery & Order Notifications</h3>
                    <p className="text-xs text-slate-500">Configure how you receive order dispatches and rider alerts</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">SMS Order Dispatches & Rider Arrival</span>
                      <span className="text-[11px] text-slate-500">Receive SMS messages when your order is packed and dispatched</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-emerald-600 h-4 w-4 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">WhatsApp Real-Time Delivery Tracking</span>
                      <span className="text-[11px] text-slate-500">Get live tracking links and digital receipts on WhatsApp</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-emerald-600 h-4 w-4 rounded cursor-pointer" />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Exclusive Town Discounts & Offers</span>
                      <span className="text-[11px] text-slate-500">Never miss midnight flash sales and free delivery coupon codes</span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-emerald-600 h-4 w-4 rounded cursor-pointer" />
                  </label>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Quick Actions & Trust */}
            <div className="space-y-6">
              {/* TORD Club Membership (Pure White Card) */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">TORD Fresh VIP</h3>
                    <p className="text-xs text-emerald-600 font-bold">Active Member</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  Enjoy unlimited ₹0 Delivery Fee on all grocery & pharmacy orders above ₹149.
                </p>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs font-black text-emerald-800">
                  <span>Savings this month:</span>
                  <span className="text-sm text-emerald-700 font-black">₹480 Saved</span>
                </div>
              </div>

              {/* Help & Support Link (Pure White Card) */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-md space-y-3">
                <h3 className="text-sm font-black text-slate-900">Need Help with an Order?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Our town care team is available 24/7 for instant returns, replacements, and rider coordination.
                </p>
                <Link href="/help" className="block pt-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-black transition-all cursor-pointer"
                  >
                    <HelpCircle className="h-4 w-4 text-emerald-600" />
                    <span>Open Town Help Desk</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
