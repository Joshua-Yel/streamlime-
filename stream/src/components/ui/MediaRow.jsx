import MovieCard from './MovieCard';
import { cn } from '../../lib/utils';

export default function MediaRow({ title, items, className, action }) {
  return (
    <section className={cn('space-y-3', className)}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-stone-100 sm:text-xl">
          {title}
        </h2>
        {action}
      </div>

      {items?.length ? (
        <div className="scroll-row -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {items.map((item) => (
            <MovieCard
              item={item}
              variant="row"
              key={`${item.media_type || item.mediaType || 'title'}-${item.id}`}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-stone-700/80 bg-stone-900/40 px-4 py-8 text-center text-sm text-stone-400">
          Nothing here yet.
        </div>
      )}
    </section>
  );
}
