import { cn } from '../../lib/utils';

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-stone-800 bg-stone-950/70',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>;
}
