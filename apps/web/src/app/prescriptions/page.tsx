'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Badge, PrimaryButton } from '@tord/ui';
import { FileText, Upload, ShieldCheck, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { apiGet, apiUpload } from '@/lib/api';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/providers/auth-provider';

export default function PrescriptionsPage() {
  const { isAuthenticated } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPrescriptions = () => {
    if (isAuthenticated) {
      apiGet<any[]>('/prescriptions')
        .then(setPrescriptions)
        .catch((err) => console.warn('Fetch prescriptions error:', err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [isAuthenticated]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiUpload('/prescriptions/upload', formData);
      setFile(null);
      fetchPrescriptions();
      alert('Prescription uploaded successfully for review!');
    } catch (err: any) {
      alert('Failed to upload prescription');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <SiteHeader />
        <main className="mx-auto w-[min(500px,calc(100%-1.5rem))] mt-16 mb-20 text-center space-y-4">
          <div className="p-10 space-y-5 rounded-3xl bg-white border border-slate-200/90 shadow-md">
            <div className="h-16 w-16 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <FileText className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Sign In to Prescription Vault</h1>
            <p className="text-xs text-slate-500 font-medium">Access your uploaded doctor notes and pharmacist verification status</p>
            <Link href="/login?redirect=/prescriptions" className="inline-block pt-2">
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
          {/* Top Banner (Luxury Forest Green) */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#061B12] via-[#0C291D] to-[#0A2616] p-7 sm:p-10 text-white shadow-xl border border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-2 text-center sm:text-left z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#B4F83C] border border-emerald-700/60 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B4F83C]" />
                <span>256-Bit Encrypted Health Vault</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight tracking-tight">
                My Doctor Prescriptions ({prescriptions.length})
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-normal">
                Upload your Rx documents for licensed pharmacist verification and fast medicine doorstep delivery.
              </p>
            </div>
          </div>

          {/* Upload Card (Crisp Pure White) */}
          <div className="p-7 sm:p-8 space-y-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 border border-emerald-200 shadow-2xs">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Upload New Doctor Prescription</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Attach an image or PDF of your doctor note. Licensed pharmacists will verify it for quick town dispatch.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-slate-100">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 cursor-pointer"
              />
              <button
                type="submit"
                disabled={isUploading}
                className="w-full sm:w-auto shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Prescription'}
              </button>
            </form>
          </div>

          {/* Prescriptions Vault Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Uploaded Prescription Documents</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, idx) => (
                  <div key={idx} className="h-32 rounded-3xl bg-white border border-slate-200/80 animate-pulse p-4 shadow-xs" />
                ))}
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 font-semibold rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                No prescription documents uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="p-6 flex items-start justify-between gap-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 text-emerald-700 shrink-0" />
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                          {rx.fileKey.split('/').pop()}
                        </h4>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium" suppressHydrationWarning>
                        Uploaded on {formatDate(rx.uploadedAt)}
                      </p>

                      {rx.orderNumber && (
                        <p className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200 inline-block">
                          Linked to Order #{rx.orderNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                        {rx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
