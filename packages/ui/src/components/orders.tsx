import { PriceDisplay, QuantitySelector } from './products';
import { StatusBadge } from './badges';

export interface CartItemProps {
  id: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isPrescriptionRequired?: boolean;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}

export function CartItem({
  name,
  unit,
  price,
  quantity,
  imageUrl,
  isPrescriptionRequired,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/60 bg-white/90 p-3 shadow-xs">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--color-background)] flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl">🛍️</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--color-charcoal)] truncate">{name}</h4>
        <p className="text-xs text-[var(--color-silver)]">{unit}</p>
        {isPrescriptionRequired && (
          <span className="inline-block mt-0.5 text-[10px] font-semibold text-teal-700">Rx Required</span>
        )}
        <PriceDisplay price={price * quantity} className="mt-1" />
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 hover:underline font-medium"
        >
          Remove
        </button>
        <QuantitySelector
          quantity={quantity}
          onIncrease={() => onQuantityChange(quantity + 1)}
          onDecrease={() => onQuantityChange(quantity - 1)}
        />
      </div>
    </div>
  );
}

export interface OrderStatusProps {
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

export function OrderStatusCard({ orderNumber, status, totalAmount, createdAt, itemCount }: OrderStatusProps) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[var(--color-charcoal)]">{orderNumber}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-xs text-[var(--color-silver)] mt-1">
          {itemCount} Items • Placed on {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4">
        <PriceDisplay price={totalAmount} />
      </div>
    </div>
  );
}
