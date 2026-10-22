import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'amber' | 'emerald' | 'cyan' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-200 border-zinc-700/80',
    secondary: 'bg-zinc-900 text-zinc-400 border-zinc-800',
    outline: 'text-zinc-300 border-zinc-700 bg-transparent',
    destructive: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono font-medium transition-colors select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
