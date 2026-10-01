import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'prescription';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-[rgba(174,184,178,0.2)] text-[var(--color-charcoal)] border border-[var(--color-silver-light)]',
    primary: 'bg-[rgba(35,140,124,0.15)] text-[var(--color-primary-dark)] border border-[rgba(99,193,179,0.4)]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    prescription: 'bg-teal-50/90 text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]/50 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    DELIVERED: { label: 'Delivered', variant: 'success' },
    CONFIRMED: { label: 'Confirmed', variant: 'info' },
    PAYMENT_CONFIRMED: { label: 'Payment Confirmed', variant: 'primary' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'info' },
    PENDING: { label: 'Pending', variant: 'warning' },
    CANCELLED: { label: 'Cancelled', variant: 'default' },
    APPROVED: { label: 'Approved', variant: 'success' },
    UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
    REJECTED: { label: 'Rejected', variant: 'default' },
  };

  const current = statusMap[status] ?? { label: status, variant: 'default' };

  return <Badge variant={current.variant}>{current.label}</Badge>;
}
