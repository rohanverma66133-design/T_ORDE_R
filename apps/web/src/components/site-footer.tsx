import Link from 'next/link';
import { ShieldCheck, Phone, Mail, MapPin, CreditCard, Lock, Leaf, CheckCircle2, Clock, Truck, RotateCcw } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="border-t border-emerald-950 bg-[#0A2616] text-slate-300 pt-16 pb-12 font-sans">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 5-Column Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-xs leading-relaxed">
          
          {/* Column 1: Brand Info & Trust */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 font-black text-lg text-white tracking-tight group">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Leaf className="h-5 w-5 text-emerald-200 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-black tracking-tight leading-tight">
                  TORD <span className="text-emerald-400">FRESH</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-300/70 tracking-wider uppercase">
                  Town Grocery Express
                </span>
              </div>
            </Link>

            <p className="text-emerald-100/70 leading-relaxed text-xs">
              Farm-fresh organic produce, pure daily staples, and verified medicines delivered to your doorstep in 15 minutes by TORD.
            </p>

            <div className="space-y-2 pt-1 text-emerald-100 text-xs font-medium">
              <div className="flex items-center gap-2 text-emerald-300 bg-emerald-900/50 px-2.5 py-1.5 rounded-lg border border-emerald-800/60 w-fit">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>FSSAI &amp; CDSCO Certified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-200/80">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>256-Bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2.5 text-emerald-100/80">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors">All Categories</Link></li>
              <li><Link href="/offers" className="hover:text-white transition-colors flex items-center gap-1.5"><span>Daily Deals</span><span className="bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 text-[9px] rounded">HOT</span></Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Customer Service</h4>
            <ul className="space-y-2.5 text-emerald-100/80">
              <li><Link href="/account" className="hover:text-white transition-colors">My Account</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link href="/prescriptions" className="hover:text-white transition-colors">Upload Prescription</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Doorstep Returns Policy</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Delivery &amp; Shipping Terms</Link></li>
            </ul>
          </div>

          {/* Column 4: Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Categories</h4>
            <ul className="space-y-2.5 text-emerald-100/80">
              <li><Link href="/shop/fruits-vegetables" className="hover:text-white transition-colors">Fruits &amp; Vegetables</Link></li>
              <li><Link href="/shop/dairy-eggs" className="hover:text-white transition-colors">Dairy &amp; Eggs</Link></li>
              <li><Link href="/shop/bakery-sweets" className="hover:text-white transition-colors">Bakery &amp; Bread</Link></li>
              <li><Link href="/shop/staples-grains" className="hover:text-white transition-colors">Organic Staples</Link></li>
              <li><Link href="/shop/wellness-otc" className="hover:text-white transition-colors">Pharmacy &amp; Health</Link></li>
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact &amp; Support</h4>
            <div className="space-y-2.5 text-emerald-100/80">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sector 4 Express Dispatch Hub, Town Market Plaza</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">+91 1800-287-672</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>care@tord.in</span>
              </p>
              <p className="flex items-center gap-2 text-emerald-300">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Mon–Sun: 7:00 AM – 11:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Payment Row */}
        <div className="pt-8 border-t border-emerald-900/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-emerald-200/60">
          <p>© 2026 TORD Marketplace Inc. All rights reserved.</p>

          <div className="flex items-center gap-3 text-emerald-100/90 font-medium">
            <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-emerald-400" /> UPI / Google Pay</span>
            <span>•</span>
            <span>Visa</span>
            <span>•</span>
            <span>Mastercard</span>
            <span>•</span>
            <span>NetBanking</span>
            <span>•</span>
            <span>Cash on Delivery</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/help" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/help" className="hover:text-white transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
