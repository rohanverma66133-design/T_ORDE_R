import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-2xl animate-stagger-1">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-[32px] border border-white/15 bg-gradient-to-br from-deep-navy/95 via-midnight/95 to-card-dark/95 p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-3xl text-white',
          className,
        )}
      >
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-white/10">
          {title && <h3 className="text-lg font-black text-white">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-soft-text hover:text-white font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-midnight/80 backdrop-blur-2xl animate-stagger-1">
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md h-full bg-midnight/95 border-l border-white/15 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between text-white backdrop-blur-3xl">
        <div>
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
            {title && <h3 className="text-xl font-black text-white">{title}</h3>}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-soft-text hover:text-white font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Toast({ title, description, variant = 'info', onClose }: { title: string; description?: string; variant?: 'info' | 'success' | 'error'; onClose?: () => void }) {
  const variantStyles = {
    info: 'bg-deep-navy/90 border-white/15 text-white shadow-aurora',
    success: 'bg-emerald/90 border-emerald-400/30 text-white shadow-glow-green',
    error: 'bg-rose-600/90 border-rose-400/30 text-white shadow-lg',
  };

  return (
    <div className={cn('fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-2xl shadow-2xl', variantStyles[variant])}>
      <div>
        <h5 className="text-xs font-black">{title}</h5>
        {description && <p className="text-[11px] opacity-80">{description}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="ml-2 font-bold opacity-80 hover:opacity-100 cursor-pointer">
          ✕
        </button>
      )}
    </div>
  );
}

