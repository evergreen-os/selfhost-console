import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald-700',
        outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400',
        subtle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-200'
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button';
    return <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);

Button.displayName = 'Button';
