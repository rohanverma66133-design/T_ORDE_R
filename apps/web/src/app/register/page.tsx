'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { User, Phone, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const destination = phone.trim() || email.trim();
    const channel = phone.trim() ? 'PHONE' : 'EMAIL';

    if (!destination) {
      setError('Please provide phone number or email');
      return;
    }

    setIsLoading(true);
    try {
      await apiPost('/auth/otp/request', {
        channel,
        destination,
        purpose: 'VERIFY_CONTACT',
      });
      router.push(
        `/verify-otp?channel=${channel}&destination=${encodeURIComponent(
          destination,
        )}&name=${encodeURIComponent(name)}&purpose=VERIFY_CONTACT&redirect=${encodeURIComponent(redirect)}`,
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to request verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100 selection:bg-[#B4F83C] selection:text-slate-950">
      <div>
        <SiteHeader />

        <main className="mx-auto w-[min(460px,calc(100%-1.5rem))] mt-10 mb-20 space-y-6">
          <div className="p-8 sm:p-10 space-y-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <User className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create TORD Account</h1>
              <p className="text-xs text-slate-500 font-medium">
                Register for instant 15-20 min town grocery & medicine delivery
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full justify-center gap-2 rounded-2xl bg-[#B4F83C] hover:bg-[#a1e528] text-slate-950 font-black py-3.5 px-6 text-xs sm:text-sm flex items-center transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md mt-2"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Creating Account...' : 'Register & Send OTP'}</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              <span>Already have an account? </span>
              <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-black text-emerald-700 hover:underline">
                Sign In here
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>256-Bit Encrypted Secure Registration</span>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#061B12] flex items-center justify-center font-bold text-slate-400">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
