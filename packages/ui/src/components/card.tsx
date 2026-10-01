import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      suppressHydrationWarning
      className={cn(
        'rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_25px_60px_rgba(0,0,0,0.5)]',
        className,
      )}
      {...props}
    />
  );
}

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      suppressHydrationWarning
      className={cn(
        'rounded-3xl border border-white/12 bg-[rgba(15,20,42,0.72)] p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl transition-all duration-300 hover:border-aurora/40 hover:shadow-[0_25px_60px_rgba(124,58,237,0.2),0_0_30px_rgba(183,243,74,0.15)] hover:-translate-y-1',
        className,
      )}
      {...props}
    />
  );
}

export function GlassPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      suppressHydrationWarning
      className={cn(
        'rounded-3xl border border-violet-500/30 bg-gradient-to-br from-midnight via-deep-navy to-card-dark p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(124,58,237,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-3xl',
        className,
      )}
      {...props}
    />
  );
}


