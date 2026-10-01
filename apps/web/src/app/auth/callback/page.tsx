'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');
    const redirectTarget = searchParams.get('redirect') || '/';
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(decodeURIComponent(errorParam));
      return;
    }

    if (!accessToken || !refreshToken || !userStr) {
      setStatus('error');
      setErrorMessage('Missing authentication tokens from Google response.');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUserName(userData.name || userData.email || 'User');
      login(accessToken, refreshToken, userData);
      setStatus('success');

      // Redirect after showing welcome animation
      const timer = setTimeout(() => {
        router.push(redirectTarget);
      }, 1200);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Error parsing OAuth user payload:', err);
      setStatus('error');
      setErrorMessage('Failed to complete account authentication.');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/70 p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl p-8 border border-white shadow-2xl text-center space-y-6">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Verifying Google Identity...</h2>
            <p className="text-xs text-slate-500 font-medium">Securing session tokens and syncing user profile</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600">Login Successful! 🎉</span>
              <h2 className="text-2xl font-black text-slate-950 mt-1">Welcome back, {userName}!</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Redirecting you to your account...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Authentication Failed</h2>
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
              {errorMessage || 'Something went wrong during Google sign-in.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-semibold text-slate-500">Loading Google authentication...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
