import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-amber-400 text-stone-950 hover:bg-amber-300',
        secondary:
          'border border-stone-600 bg-stone-900 text-stone-100 hover:border-stone-500 hover:bg-stone-800',
        ghost: 'text-stone-200 hover:bg-stone-800/90',
        success:
          'border border-emerald-500/40 bg-emerald-400 text-stone-950 hover:bg-emerald-300',
        danger:
          'border border-rose-500/40 bg-rose-950/60 text-rose-100 hover:bg-rose-900/70',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-11 px-5 text-[15px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export default function Button({
  className,
  variant,
  size,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

export { buttonVariants };
