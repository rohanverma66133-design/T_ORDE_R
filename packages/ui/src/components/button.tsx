import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora focus-visible:ring-offset-2 focus-visible:ring-offset-midnight disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] motion-reduce:transition-none cursor-pointer select-none',
  {
    variants: {
      variant: {
        aurora:
          'bg-aurora hover:bg-aurora-hover text-dark-text shadow-[0_0_30px_rgba(183,243,74,0.35)] hover:shadow-[0_0_40px_rgba(183,243,74,0.55)]',
        primary:
          'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-[0_10px_30px_rgba(124,58,237,0.3)] hover:shadow-[0_15px_40px_rgba(124,58,237,0.5)] hover:from-violet-500 hover:to-indigo-500',
        emerald:
          'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] hover:from-emerald-400 hover:to-teal-400',
        amber:
          'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)]',
        secondary:
          'bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-xs hover:bg-white/20 hover:border-white/30',
        outline:
          'bg-transparent text-aurora border border-aurora/40 hover:bg-aurora/15 hover:border-aurora shadow-xs',
        ghost:
          'bg-transparent text-soft-text hover:bg-white/10 hover:text-white',
        glass:
          'bg-white/[0.08] text-white border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.3)] backdrop-blur-2xl hover:bg-white/[0.15] hover:border-white/35 hover:shadow-[0_12px_35px_rgba(124,58,237,0.2)]',
        darkGlass:
          'bg-deep-navy/80 text-white border border-white/12 backdrop-blur-2xl hover:bg-deep-navy hover:border-aurora/40 hover:shadow-[0_0_25px_rgba(183,243,74,0.15)]',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs rounded-xl',
        md: 'h-11 px-5 text-sm rounded-2xl',
        lg: 'h-12 px-7 text-base rounded-2xl',
        icon: 'h-10 w-10 p-0 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function PrimaryButton(props: ButtonProps) {
  return <Button variant="aurora" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <Button variant="secondary" {...props} />;
}

export function GlassButton(props: ButtonProps) {
  return <Button variant="glass" {...props} />;
}

export function IconButton({ icon, children, ...props }: ButtonProps & { icon?: ReactNode }) {
  return (
    <Button size="icon" {...props}>
      {icon ?? children}
    </Button>
  );
}


