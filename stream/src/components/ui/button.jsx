import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-amber-300 text-stone-900 hover:bg-amber-200',
        secondary: 'border border-stone-600 bg-stone-900/85 text-stone-100 hover:bg-stone-800',
        ghost: 'text-stone-200 hover:bg-stone-800/85',
        success: 'border border-emerald-300/70 bg-emerald-300 text-stone-900 hover:bg-emerald-200',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4',
        lg: 'h-10 px-5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export default function Button({ className, variant, size, asChild = false, children, ...props }) {
  const Comp = asChild ? motion.span : motion.button;
  return (
    <Comp
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Comp>
  );
}
