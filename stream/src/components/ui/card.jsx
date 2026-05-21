import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function Card({ className, children, hover = false }) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn('rounded-xl border border-stone-700/70 bg-stone-900/80', className)}
    >
      {children}
    </motion.div>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>;
}
