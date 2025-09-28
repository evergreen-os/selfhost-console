import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline focus-visible:outline-emerald-500 focus-visible:outline-2',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
