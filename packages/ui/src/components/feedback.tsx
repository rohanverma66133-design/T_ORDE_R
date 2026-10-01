import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[var(--color-light-silver)]/40', className)} />;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-white/60 bg-white/70 backdrop-blur-md max-w-md mx-auto my-8">
      <div className="text-4xl mb-3 text-[var(--color-primary-light)]">{icon ?? '🛒'}</div>
      <h3 className="text-lg font-bold text-[var(--color-charcoal)]">{title}</h3>
      {description && <p className="text-xs text-[var(--color-silver)] mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-red-200 bg-red-50/80 max-w-md mx-auto my-6">
      <div className="text-3xl mb-2">⚠️</div>
      <h4 className="text-sm font-bold text-red-800">{message}</h4>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
