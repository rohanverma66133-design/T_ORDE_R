'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Phone, Mail, ArrowRight, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { env } from '@/lib/env';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');

  const [channel, setChannel] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError ? decodeURIComponent(urlError) : null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleGoogleLogin = () => {
    setError(null);
    setIsGoogleLoading(true);
    window.location.href = `${env.apiBaseUrl}/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedDest = destination.trim();
    if (!trimmedDest) {
      setError(`Please enter your ${channel === 'EMAIL' ? 'email address' : 'phone number'}`);
      return;
    }

    if (channel === 'EMAIL' && !validateEmail(trimmedDest)) {
      setError('Please enter a valid email address (e.g. name@example.com)');
      return;
    }

    setIsLoading(true);
    try {
      await apiPost('/auth/otp/request', {
        channel,
        destination: trimmedDest,
        purpose: 'LOGIN',
      });

      router.push(
        `/verify-otp?channel=${channel}&destination=${encodeURIComponent(
          trimmedDest,
        )}&purpose=LOGIN&redirect=${encodeURIComponent(redirect)}`,
      );
    } catch (err: unknown) {
      const errorObj = err as Error & { message?: string };
      setError(errorObj?.message || 'Failed to request OTP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#061B12] font-sans text-slate-100 selection:bg-[#B4F83C] selection:text-slate-950">
      <div>
        <SiteHeader />

        <main className="mx-auto w-[min(460px,calc(100%-1.5rem))] mt-10 mb-20 space-y-6">
          {/* Pure White Card */}
          <div className="p-8 sm:p-10 space-y-6 rounded-3xl bg-white border border-slate-200/90 text-slate-900 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Customer Login</h1>
              <p className="text-xs text-slate-500 font-medium">
                Log in to access your TORD Fresh orders, addresses & prescriptions
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                {error}
              </div>
            )}

            {/* Google OAuth Login Option */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm hover:border-slate-400 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                OR LOGIN VIA OTP
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Email / Phone OTP Toggle */}
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setChannel('EMAIL')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'EMAIL'
                    ? 'bg-[#B4F83C] text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('PHONE')}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'PHONE'
                    ? 'bg-[#B4F83C] text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Phone OTP</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  {channel === 'EMAIL' ? 'Email Address' : 'Mobile Phone Number'}
                </label>
                <div className="relative">
                  {channel === 'EMAIL' ? (
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  ) : (
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  )}
                  <input
                    type={channel === 'EMAIL' ? 'email' : 'tel'}
                    placeholder={channel === 'EMAIL' ? 'name@example.com' : '+91 98765 43210'}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full justify-center gap-2 rounded-2xl bg-[#B4F83C] hover:bg-[#a1e528] text-slate-950 font-black py-3.5 px-6 text-xs sm:text-sm flex items-center transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
                disabled={isLoading || isGoogleLoading}
              >
                <span>{isLoading ? 'Sending Verification Code...' : 'Send Verification Code'}</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
              <span>New to TORD Fresh? </span>
              <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-black text-emerald-700 hover:underline">
                Create Account
              </Link>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>256-Bit Encrypted Secure Town Verification</span>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-400">Loading TORD login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
