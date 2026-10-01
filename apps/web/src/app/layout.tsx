import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { CartProvider } from '@/providers/cart-provider';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { ToastProvider } from '@/components/toast';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TORD - Fresh Groceries & Essentials Delivered | 15-Min Fast Delivery',
  description: 'Farm-fresh organic produce, everyday groceries, and healthcare essentials delivered to your doorstep in 15 minutes by TORD.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#15803D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (var r of registrations) { r.unregister(); }
                  });
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var k of keys) { caches.delete(k); }
                  });
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[#F8FAFC] text-slate-900 min-h-screen selection:bg-emerald-100 selection:text-emerald-900`}
      >
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <ServiceWorkerRegister />
                {children}
                <MobileBottomNav />
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
