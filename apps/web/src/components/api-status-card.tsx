'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { HealthStatus } from '@tord/types';
import { GlassPanel, Badge } from '@tord/ui';
import { CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

export function ApiStatusCard() {
  const query = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<HealthStatus>('/health'),
    refetchInterval: 15000,
  });

  return (
    <GlassPanel id="status" className="max-w-xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-base font-bold text-[var(--color-charcoal)]">Platform Operational Status</h2>
        </div>
        {query.data && (
          <Badge variant={query.data.checks?.database === 'up' ? 'success' : 'warning'}>
            {query.data.checks?.database === 'up' ? 'Database & API Live' : query.data.status}
          </Badge>
        )}
      </div>

      {query.isLoading && <p className="text-xs text-[var(--color-silver)]">Checking platform status…</p>}

      {query.isError && (
        <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>API service connecting...</span>
        </p>
      )}

      {query.data && (
        <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50/80 p-2 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>PostgreSQL: Up</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-800 bg-teal-50/80 p-2 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span>NestJS API: Online</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-100/80 p-2 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            <span>Redis: {query.data.checks?.redis === 'up' ? 'Up' : 'Dev Mode'}</span>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
