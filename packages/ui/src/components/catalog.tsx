import { cn } from '../lib/cn';
import { Badge } from './badges';

export interface CategoryCardProps {
  name: string;
  itemCount?: number;
  icon?: string;
  isMedicine?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryCard({ name, itemCount, icon, isMedicine, onClick, className }: CategoryCardProps) {
  return (
    <div
      suppressHydrationWarning
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_6px_20px_rgba(32,32,32,0.04)] backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary-light)] hover:shadow-[0_12px_32px_rgba(35,140,124,0.12)] hover:-translate-y-1',
        className,
      )}
    >
      <div className="flex items-center gap-3" suppressHydrationWarning>
        <div className="h-12 w-12 rounded-xl bg-[rgba(35,140,124,0.1)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {icon ?? (isMedicine ? '💊' : '🛒')}
        </div>
        <div suppressHydrationWarning>
          <h4 className="text-sm font-semibold text-[var(--color-charcoal)] group-hover:text-[var(--color-primary-dark)] transition-colors">
            {name}
          </h4>
          {itemCount !== undefined && (
            <p className="text-xs text-[var(--color-silver)] mt-0.5">{itemCount} Items</p>
          )}
        </div>
      </div>
    </div>
  );
}

export interface StoreCardProps {
  name: string;
  type: 'GROCERY' | 'PHARMACY';
  rating?: number;
  deliveryTime?: string;
  distanceKm?: number;
  address?: string;
  isOpen?: boolean;
  onClick?: () => void;
}

export function StoreCard({ name, type, rating = 4.8, deliveryTime = '20-30 min', distanceKm, address, isOpen = true, onClick }: StoreCardProps) {
  return (
    <div
      suppressHydrationWarning
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_8px_24px_rgba(32,32,32,0.05)] backdrop-blur-lg transition-all duration-300 hover:shadow-[0_16px_40px_rgba(35,140,124,0.15)] hover:-translate-y-1"
    >
      <div className="flex justify-between items-start" suppressHydrationWarning>
        <div className="flex items-center gap-3" suppressHydrationWarning>
          <div className="h-12 w-12 rounded-xl bg-[linear-gradient(135deg,rgba(35,140,124,0.2)_0%,rgba(99,193,179,0.1)_100%)] flex items-center justify-center text-xl font-bold text-[var(--color-primary-dark)]">
            {type === 'PHARMACY' ? '🏥' : '🏬'}
          </div>
          <div suppressHydrationWarning>
            <h3 className="text-base font-bold text-[var(--color-charcoal)] group-hover:text-[var(--color-primary-dark)] transition-colors">
              {name}
            </h3>
            {address && <p className="text-xs text-[var(--color-silver)] line-clamp-1">{address}</p>}
          </div>
        </div>
        <Badge variant={isOpen ? 'success' : 'default'}>{isOpen ? 'Open' : 'Closed'}</Badge>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--color-background)] flex items-center justify-between text-xs font-semibold text-[var(--color-charcoal)]" suppressHydrationWarning>
        <span className="flex items-center gap-1 text-amber-600">★ {rating.toFixed(1)}</span>
        {distanceKm !== undefined && (
          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
            📍 {distanceKm.toFixed(1)} km away
          </span>
        )}
        <span className="text-[var(--color-primary-dark)]">⚡ {deliveryTime}</span>
      </div>
    </div>
  );
}

export function PharmacyCard(props: Omit<StoreCardProps, 'type'>) {
  return <StoreCard type="PHARMACY" {...props} />;
}
