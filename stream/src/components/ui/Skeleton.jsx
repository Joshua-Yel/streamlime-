import { cn } from '../../lib/utils';

export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-stone-800/90', className)}
      aria-hidden="true"
    />
  );
}

export function PosterSkeleton({ className }) {
  return <Skeleton className={cn('aspect-[2/3] w-full rounded-lg', className)} />;
}

export function MediaRowSkeleton({ count = 6, title = true }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading titles">
      {title && <Skeleton className="h-6 w-40" />}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="w-[148px] shrink-0 space-y-2 sm:w-[160px]">
            <PosterSkeleton />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TitleGridSkeleton({ count = 12 }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      aria-busy="true"
      aria-label="Loading results"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <PosterSkeleton />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
