'use client';

import { use } from 'react';
import { OrderTrackingView } from '@/components/order-tracking-view';

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  return <OrderTrackingView orderId={resolvedParams.orderId} />;
}
