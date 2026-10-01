import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProductCard, ProductGrid, PrimaryButton } from '@tord/ui';
import { Upload, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

const pharmacyProducts = [
  { id: '2', name: 'Paracetamol 650mg Tablets', brand: 'CareMed Labs', unit: '15 Tablets', price: 30.0, compareAtPrice: 35.0, categoryName: 'Wellness & OTC', isPrescriptionRequired: false, isMedicine: true },
  { id: '3', name: 'Amoxicillin 500mg Capsules', brand: 'PharmaCore', unit: '10 Capsules', price: 145.0, compareAtPrice: 160.0, categoryName: 'Antibiotics', isPrescriptionRequired: true, isMedicine: true },
  { id: '6', name: 'Vitamin C 500mg Chewable', brand: 'HealthPlus', unit: '30 Tablets', price: 199.0, categoryName: 'Supplements', isPrescriptionRequired: false, isMedicine: true },
];

export default function PharmacyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <div>
        <SiteHeader />
        <main className="mx-auto w-[min(1280px,calc(100%-1.5rem))] mt-6 mb-20 space-y-10">
          {/* Pharmacy Banner (Luxury Forest Green) */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#061B12] via-[#0C291D] to-[#0A2616] p-7 sm:p-10 text-white shadow-xl border border-emerald-950 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-3 max-w-xl z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#B4F83C] border border-emerald-700/60 shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B4F83C]" />
                <span>Certified Licensed Pharmacy</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-white leading-tight tracking-tight">
                Upload Prescription for Instant 20-Min Dispensing
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
                Our registered town pharmacists verify doctor prescriptions within 5 minutes for fast, certified doorstep dispatch.
              </p>
            </div>

            <Link href="/prescriptions" className="z-10">
              <button
                type="button"
                className="bg-[#B4F83C] hover:bg-[#A3F024] text-[#061B12] font-black text-sm px-8 py-3.5 rounded-full shadow-[0_0_30px_rgba(180,248,60,0.35)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Prescription</span>
              </button>
            </Link>
          </div>

          {/* Medicines Catalog (Crisp White Product Cards) */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">HEALTHCARE HUB</span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">Essential Medicines & Healthcare</h2>
                <p className="text-xs text-slate-500">Authentic medicines sourced directly from verified local pharmacies</p>
              </div>
            </div>
            <ProductGrid>
              {pharmacyProducts.map((prod) => (
                <ProductCard key={prod.id} {...prod} />
              ))}
            </ProductGrid>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
