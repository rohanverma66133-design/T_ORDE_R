'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PrimaryButton, SecondaryButton } from '@tord/ui';
import { MapPin, Plus, Trash2, CheckCircle2, Star, Sparkles, Building2, Home, Briefcase } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

interface AddressItem {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

const defaultMockAddresses: AddressItem[] = [
  {
    id: 'addr-1',
    label: 'Home',
    line1: 'Flat 402, Green Valley Apartments, Near Town Clock Tower',
    line2: 'Civil Lines Road',
    city: 'Townsville',
    postalCode: '395007',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Office',
    line1: '3rd Floor, TORD Tech Park, Commercial Hub Zone 2',
    line2: 'Expressway Avenue',
    city: 'Townsville',
    postalCode: '395001',
    isDefault: false,
  }
];

export default function AddressesPage() {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<AddressItem[]>(defaultMockAddresses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Townsville');
  const [postalCode, setPostalCode] = useState('395007');

  const fetchAddresses = () => {
    if (isAuthenticated) {
      apiGet<AddressItem[]>('/addresses')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAddresses(data);
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line1) return;
    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      label,
      line1,
      line2,
      city,
      postalCode,
      isDefault: addresses.length === 0,
    };
    try {
      if (isAuthenticated) {
        await apiPost('/addresses', { label, line1, line2, city, postalCode });
      }
      setAddresses([...addresses, newAddr]);
      setShowAddForm(false);
      setLine1('');
      setLine2('');
    } catch {
      setAddresses([...addresses, newAddr]);
      setShowAddForm(false);
      setLine1('');
      setLine2('');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (isAuthenticated) {
        await apiDelete(`/addresses/${id}`);
      }
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {
      setAddresses(addresses.filter((a) => a.id !== id));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      if (isAuthenticated) {
        await apiPatch(`/addresses/${id}/default`);
      }
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch {
      setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
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
                  <MapPin className="h-7 w-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#B4F83C] text-[11px] font-black uppercase tracking-wider mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Instant Town Delivery</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Saved Delivery Addresses</h1>
                  <p className="text-xs text-emerald-200/70 font-medium">Manage home, office, and frequent delivery locations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl font-black text-xs sm:text-sm text-slate-950 bg-[#B4F83C] hover:bg-[#a1e528] active:scale-[0.98] transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>{showAddForm ? 'Close Form' : 'Add New Address'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Main Body */}
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-8 mb-20 space-y-8">
          {/* Add Address Form Modal / Expandable (Pure White Card) */}
          {showAddForm && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">Add New Delivery Location</h3>
                <span className="text-xs text-slate-500">15-20 Min Town Dispatch Zone</span>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Address Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Home, Office, Farmhouse"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="395007"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Flat / House / Floor / Building</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Green Valley Apartments"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Street / Landmark (Optional)</label>
                    <input
                      type="text"
                      placeholder="Near Town Clock Tower"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">City / Town</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl font-black text-xs text-slate-950 bg-[#B4F83C] hover:bg-[#a1e528] transition-all shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address Cards Grid (Pure White Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-6 rounded-3xl bg-white border transition-all relative space-y-4 shadow-sm hover:shadow-md ${
                  addr.isDefault ? 'border-emerald-500 ring-2 ring-emerald-400/30' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                      {addr.label.toLowerCase().includes('office') ? (
                        <Briefcase className="h-4 w-4" />
                      ) : (
                        <Home className="h-4 w-4" />
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900">{addr.label}</h3>
                  </div>

                  {addr.isDefault ? (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Default Address</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 font-medium leading-relaxed">
                  <p className="text-slate-900 font-bold">{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>{addr.city} - {addr.postalCode}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-700 font-black">15-Min Delivery Zone</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
