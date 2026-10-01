'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { apiPost, apiPatch } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const channel = (searchParams.get('channel') as 'PHONE' | 'EMAIL') || 'EMAIL';
  const destination = searchParams.get('destination') || '';
  const purpose = searchParams.get('purpose') || 'LOGIN';
  const name = searchParams.get('name') || '';
  const redirect = searchParams.get('redirect') || '/';

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState<string>('');

  // 60-second Resend Cooldown Countdown
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiPost<{
        user: { id: string; name?: string | null; email?: string | null; phone?: string | null };
        tokens: { accessToken: string; refreshToken: string };
      }>('/auth/otp/verify', {
        channel,
        destination,
        purpose,
        code: trimmedCode,
      });

      login(res.tokens.accessToken, res.tokens.refreshToken, res.user as any);

      if (name) {
        try {
          await apiPatch('/users/me', { name });
        } catch {
          // ignore profile update error
        }
      }

      setSuccessUser(res.user.name || res.user.email || destination);
      setIsSuccess(true);

      setTimeout(() => {
        router.push(redirect);
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as Error & { message?: string };
      setError(errorObj?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setError(null);
    setIsResending(true);
    try {
      const res = await apiPost<{ cooldownRemaining?: number }>('/auth/otp/request', {
        channel,
        destination,
        purpose,
      });

      setCooldown(res.cooldownRemaining || 60);
    } catch (err: unknown) {
      const errorObj = err as Error & { message?: string };
      setError(errorObj?.message || 'Failed to resend code. Please wait before retrying.');
    } finally {
      setIsResending(false);
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
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Enter Security OTP</h1>
              <p className="text-xs text-slate-500 font-medium">
                We sent a 6-digit code to{' '}
                <strong className="text-slate-900 font-black">{destination || 'your contact'}</strong>
              </p>
            </div>

            {error && (
              <div className="p-3.5 text-xs font-bold text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-4 text-xs font-black text-emerald-800 bg-emerald-100 rounded-2xl border border-emerald-300 flex items-center justify-center gap-2 shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <span>Verification Successful! Logging in...</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  required
                  className="w-full text-center tracking-[0.6em] text-2xl font-black py-3.5 rounded-2xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || isSuccess || code.length < 6}
                className="w-full justify-center gap-2 rounded-2xl bg-[#B4F83C] hover:bg-[#a1e528] text-slate-950 font-black py-3.5 px-6 text-xs sm:text-sm flex items-center transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 font-bold">
              <span>Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <span>Resending...</span>
                ) : cooldown > 0 ? (
                  <span>Resend in {cooldown}s</span>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#061B12] flex items-center justify-center font-bold text-slate-400">Loading verification...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
