'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@tord/ui';
import {
  MapPin,
  Search,
  User,
  Menu,
  ShoppingCart,
  LogOut,
  X,
  ChevronDown,
  Phone,
  Clock,
  Flame,
  FileText,
  Heart,
  Sparkles,
  Leaf,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';
import { LocationSelectorModal } from './location-selector';

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, location } = useAuth();
  const { cart } = useCart();

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartBounced, setCartBounced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartItemCount = mounted ? (cart?.itemCount || 0) : 0;
  const cartTotal = mounted ? (cart?.subtotal || 0) : 0;

  useEffect(() => {
    if (cartItemCount > 0) {
      setCartBounced(true);
      const timer = setTimeout(() => setCartBounced(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartItemCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const query = term || searchQuery;
    if (query.trim()) {
      setIsSearchFocused(false);
      const catQuery = selectedCategory !== 'all' ? `&category=${selectedCategory}` : '';
      router.push(`/search?q=${encodeURIComponent(query.trim())}${catQuery}`);
    }
  };

  const popularSearches = [
    'Organic Tomatoes',
    'Farm Fresh Milk',
    'Crisp Apples',
    'Sourdough Bread',
    'Fresh Broccoli',
    'Olive Oil',
    'Paracetamol 650mg',
  ];

  const categoryMenu = [
    { name: 'Fresh Fruits & Vegetables', href: '/shop/fruits-vegetables', count: '140+ items' },
    { name: 'Dairy, Eggs & Butter', href: '/shop/dairy-eggs', count: '65+ items' },
    { name: 'Artisanal Bakery & Breads', href: '/shop/bakery-sweets', count: '45+ items' },
    { name: 'Organic Staples & Grains', href: '/shop/staples-grains', count: '90+ items' },
    { name: 'Pharmacy & OTC Healthcare', href: '/shop/wellness-otc', count: '300+ items' },
    { name: 'Snacks & Beverages', href: '/shop/wellness-otc', count: '80+ items' },
  ];

  return (
    <header suppressHydrationWarning className="w-full bg-[#061B12] text-white sticky top-0 z-40 border-b border-emerald-950/80 shadow-md">
      {/* 1. Top Mini Utility Ticker */}
      <div suppressHydrationWarning className="bg-[#04140D] text-emerald-200/90 text-[11px] py-1.5 border-b border-emerald-950/60 overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-4 overflow-hidden">
          {/* Store / Delivery Location */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B4F83C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B4F83C]"></span>
            </span>
            <span className="font-medium text-emerald-300 shrink-0">Express:</span>
            <button
              type="button"
              onClick={() => setIsLocationOpen(true)}
              className="text-white hover:text-[#B4F83C] font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer min-w-0"
            >
              <span className="truncate max-w-[140px] xs:max-w-[200px] sm:max-w-xs">{location || 'Town Center, Sector 4'}</span>
              <ChevronDown className="h-3 w-3 text-emerald-400 shrink-0" />
            </button>
          </div>

          {/* Delivery Promo & Store Timing */}
          <div className="hidden md:flex items-center gap-6">
            <span className="text-emerald-100/90 font-medium">
              Free delivery on orders above ₹499 • 15-Minute Doorstep Dispatch
            </span>
            <div className="flex items-center gap-4 text-emerald-200/80">
              <span className="flex items-center gap-1 text-emerald-300">
                <Clock className="h-3 w-3 text-[#B4F83C]" />
                <span>7:00 AM - 11:00 PM</span>
              </span>
              <span className="flex items-center gap-1 text-white font-medium">
                <Phone className="h-3 w-3 text-[#B4F83C]" />
                <span>1800-287-672</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Luxury Header Bar */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sm:gap-6">
        {/* LEFT: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#B4F83C] to-emerald-500 text-[#061B12] flex items-center justify-center shadow-[0_0_15px_rgba(180,248,60,0.3)] group-hover:scale-105 transition-transform">
            <Leaf className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black tracking-tight text-white font-sans">
              TORD
            </span>
            <span className="text-[10px] font-bold text-[#B4F83C] tracking-wider uppercase hidden sm:inline">
              Fresh
            </span>
          </div>
        </Link>

        {/* CENTER: Rounded Pill Search Bar (Matching Reference) */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg mx-2 relative">
          <form
            onSubmit={(e) => handleSearchSubmit(e)}
            className={`flex items-center w-full rounded-full border bg-[#0C291D]/80 backdrop-blur-md transition-all ${
              isSearchFocused
                ? 'border-[#B4F83C] ring-2 ring-[#B4F83C]/20 shadow-[0_0_20px_rgba(180,248,60,0.15)]'
                : 'border-emerald-800/60 hover:border-emerald-700'
            }`}
          >
            {/* Category Dropdown Pill */}
            <div className="relative shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-emerald-200 pl-4 pr-3 py-2.5 appearance-none focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#0C291D] text-white">Search ▾</option>
                <option value="fruits-vegetables" className="bg-[#0C291D] text-white">Produce</option>
                <option value="dairy-eggs" className="bg-[#0C291D] text-white">Dairy</option>
                <option value="bakery-sweets" className="bg-[#0C291D] text-white">Bakery</option>
                <option value="staples-grains" className="bg-[#0C291D] text-white">Staples</option>
                <option value="wellness-otc" className="bg-[#0C291D] text-white">Pharmacy</option>
              </select>
            </div>

            <div className="h-4 w-[1px] bg-emerald-800/80" />

            {/* Text Input with Search Icon */}
            <div className="relative flex-1 flex items-center pl-3 pr-4">
              <Search className="h-4 w-4 text-emerald-400 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search for organic goodness..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 text-xs sm:text-sm text-white placeholder:text-emerald-400/60 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Instant Search Suggestions */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0C291D] rounded-2xl border border-emerald-700/80 shadow-2xl p-3.5 z-50 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                <span>Popular Organic Searches</span>
                <span className="text-[#B4F83C] text-[10px]">Direct Farm Pick</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setSearchQuery(term);
                      handleSearchSubmit(undefined, term);
                    }}
                    className="px-3 py-1 rounded-full bg-emerald-900/60 hover:bg-[#B4F83C]/20 hover:text-[#B4F83C] hover:border-[#B4F83C]/40 text-xs text-emerald-100 font-medium transition-colors border border-emerald-800/60 cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: User Profile & Cart Pill (Matching Reference) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Account Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link href="/account">
                <button
                  type="button"
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full bg-[#0C291D] hover:bg-emerald-900/80 border border-emerald-800/60 text-white text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#B4F83C]" />
                  <span className="max-w-[60px] sm:max-w-[80px] truncate hidden xs:inline">{user?.name || 'Account'}</span>
                </button>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="hidden sm:flex h-10 w-10 rounded-full bg-[#0C291D] border border-emerald-800/60 text-emerald-300 hover:text-rose-400 hover:bg-rose-950/40 items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button
                type="button"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#0C291D] hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-200 hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                title="Sign In"
              >
                <User className="h-4 w-4" />
              </button>
            </Link>
          )}

          {/* Cart Pill Badge with Total & Green Dot (Exact Reference Match) */}
          <Link href="/cart">
            <button
              type="button"
              className={`flex items-center gap-1.5 sm:gap-2.5 h-9 sm:h-10 px-2.5 sm:px-4 rounded-full border transition-all cursor-pointer ${
                cartBounced
                  ? 'bg-[#B4F83C] text-[#061B12] border-[#B4F83C] shadow-[0_0_25px_rgba(180,248,60,0.5)] animate-bounce-cart'
                  : 'bg-[#0C291D] hover:bg-emerald-900/90 text-white border-emerald-800/70 hover:border-emerald-600'
              }`}
            >
              <div className="relative flex items-center">
                <ShoppingCart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${cartBounced ? 'text-[#061B12]' : 'text-emerald-300'}`} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B4F83C] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B4F83C]"></span>
                  </span>
                )}
              </div>
              <span className={`text-[11px] sm:text-xs font-bold font-mono ${cartBounced ? 'text-[#061B12]' : 'text-white'}`}>
                {cartTotal > 0 ? `₹${cartTotal.toFixed(0)}` : `${cartItemCount}`}
              </span>
            </button>
          </Link>

          {/* Mobile Hamburger Menu */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-[#0C291D] border border-emerald-800/60 text-white hover:bg-emerald-900 cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </div>
      </div>

      {/* 3. Primary Navigation Bar */}
      <div className="border-t border-emerald-950/60 bg-[#061B12]/90 backdrop-blur-md hidden md:block">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* "Shop by Categories" Button & Dropdown */}
            <div ref={dropdownRef} className="relative py-2">
              <button
                type="button"
                onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                className="flex items-center gap-2 bg-[#0C291D] hover:bg-emerald-900/90 text-white font-bold text-xs px-4 py-2 rounded-full border border-emerald-800/60 transition-all cursor-pointer"
              >
                <Menu className="h-3.5 w-3.5 text-[#B4F83C]" />
                <span>Shop by Categories</span>
                <ChevronDown className={`h-3 w-3 text-emerald-300 transition-transform duration-200 ${isCategoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Categories Menu Dropdown */}
              {isCategoriesDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#0C291D] rounded-2xl border border-emerald-700/80 shadow-2xl p-2 z-50 space-y-1">
                  {categoryMenu.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      onClick={() => setIsCategoriesDropdownOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-900 hover:text-[#B4F83C] text-xs font-semibold text-emerald-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-[#B4F83C] group-hover:scale-125 transition-transform" />
                        <span>{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-normal">{cat.count}</span>
                    </Link>
                  ))}
                  <div className="pt-2 mt-1 border-t border-emerald-800/60">
                    <Link
                      href="/shop"
                      onClick={() => setIsCategoriesDropdownOpen(false)}
                      className="block text-center py-2 text-xs font-bold text-[#B4F83C] hover:underline"
                    >
                      View All Catalog →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6 text-xs font-medium text-emerald-200/90">
              <Link
                href="/"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors ${
                  pathname === '/' ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                Home
              </Link>
              <Link
                href="/shop"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors ${
                  pathname === '/shop' ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                Categories
              </Link>
              <Link
                href="/offers"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors flex items-center gap-1 ${
                  pathname === '/offers' ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-[#B4F83C] fill-[#B4F83C]" />
                <span>Deals &amp; Offers</span>
              </Link>
              <Link
                href="/shop/fruits-vegetables"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors ${
                  pathname.includes('fruits-vegetables') ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                Fresh Produce
              </Link>
              <Link
                href="/shop/wellness-otc"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors ${
                  pathname.includes('wellness-otc') ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                Pharmacy &amp; Health
              </Link>
              <Link
                href="/prescriptions"
                className={`py-2.5 hover:text-[#B4F83C] flex items-center gap-1 transition-colors ${
                  pathname === '/prescriptions' ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-emerald-400" />
                <span>Upload Rx</span>
              </Link>
              <Link
                href="/help"
                className={`py-2.5 hover:text-[#B4F83C] transition-colors ${
                  pathname === '/help' ? 'text-[#B4F83C] font-bold border-b-2 border-[#B4F83C] -mb-px' : ''
                }`}
              >
                About &amp; Help
              </Link>
            </nav>
          </div>

          {/* Quick Highlight Pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-[#B4F83C] bg-[#0C291D] px-3.5 py-1 rounded-full border border-emerald-800/60">
            <Sparkles className="h-3.5 w-3.5 text-[#B4F83C]" />
            <span>100% Sustainable Local Farms</span>
          </div>
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-950 bg-[#061B12] p-4 space-y-4 shadow-2xl">
          {/* Mobile Search */}
          <form onSubmit={(e) => handleSearchSubmit(e)} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search for organic goodness..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs text-white bg-[#0C291D] border border-emerald-800 rounded-full focus:outline-none focus:border-[#B4F83C]"
            />
            <button
              type="submit"
              className="bg-[#B4F83C] text-[#061B12] p-2.5 rounded-full text-xs font-bold"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* Location Picker */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsLocationOpen(true);
            }}
            className="w-full p-3 rounded-2xl border border-emerald-800/60 bg-[#0C291D] flex items-center justify-between text-xs text-white"
          >
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-[#B4F83C] shrink-0" />
              <span className="truncate">{location || 'Town Center, Sector 4'}</span>
            </div>
            <span className="text-[11px] font-bold text-[#B4F83C]">Change</span>
          </button>

          {/* Navigation Links */}
          <div className="flex flex-col gap-2 text-xs font-semibold text-emerald-100">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D] flex items-center justify-between"
            >
              <span>Home</span>
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D] flex items-center justify-between"
            >
              <span>All Categories &amp; Catalog</span>
            </Link>
            <Link
              href="/shop/fruits-vegetables"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D] flex items-center justify-between"
            >
              <span>Fresh Farm Produce</span>
            </Link>
            <Link
              href="/shop/wellness-otc"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D] flex items-center justify-between"
            >
              <span>Pharmacy &amp; Medicines</span>
            </Link>
            <Link
              href="/prescriptions"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D] flex items-center gap-2"
            >
              <FileText className="h-4 w-4 text-[#B4F83C]" />
              <span>Upload Doctor Prescription</span>
            </Link>
            <Link
              href="/offers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl bg-emerald-900/40 text-[#B4F83C] border border-emerald-800 font-bold flex items-center gap-2"
            >
              <Flame className="h-4 w-4 text-[#B4F83C] fill-[#B4F83C]" />
              <span>Daily Deals &amp; Coupons</span>
            </Link>
            <Link
              href="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-[#0C291D]"
            >
              About &amp; Customer Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
