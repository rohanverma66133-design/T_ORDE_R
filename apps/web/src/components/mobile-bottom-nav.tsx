'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, Tag, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { useCart } from '@/providers/cart-provider';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  const cartItemCount = cart?.itemCount || 0;

  const navItems = [
    { label: 'Home', href: '/', icon: Home, isActive: pathname === '/' },
    { label: 'Categories', href: '/shop', icon: Grid, isActive: pathname.startsWith('/shop') },
    { label: 'Deals', href: '/offers', icon: Tag, isActive: pathname === '/offers' },
    { label: 'Cart', href: '/cart', icon: ShoppingCart, isActive: pathname === '/cart', badge: cartItemCount },
    { label: isAuthenticated ? 'Account' : 'Sign In', href: isAuthenticated ? '/account' : '/login', icon: User, isActive: pathname === '/account' || pathname === '/login' },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
      <nav aria-label="Mobile Navigation" className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-all ${
                item.isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${item.isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white shadow-xs">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
