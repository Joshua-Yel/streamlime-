import { Link } from 'react-router-dom';
import { formatRating, getMediaType, getPosterUrl, getReleaseYear, getTitleName } from '../../utils/media';
import { cn } from '../../lib/utils';

export default function MovieCard({ item, variant = 'grid', className }) {
  const mediaType = getMediaType(item);
  const posterUrl = getPosterUrl(item.poster_path);
  const title = getTitleName(item);
  const continueLabel = item.continueLabel;
  const detailPath = `/title/${mediaType}/${item.id}`;
  const playPath =
    mediaType === 'tv' && item.continueSeason && item.continueEpisode
      ? `/tv/${item.id}/${item.continueSeason}/${item.continueEpisode}`
      : null;

  return (
    <article
      className={cn(
        'movie-card group overflow-hidden rounded-lg border border-stone-800 bg-stone-950/80',
        variant === 'row' ? 'w-[148px] shrink-0 sm:w-[160px]' : 'w-full',
        className,
      )}
    >
      <Link
        to={playPath || detailPath}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
        aria-label={`${title} (${getReleaseYear(item)})`}
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-stone-900">
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 ease-out group-hover:scale-[1.03] group-focus-within:scale-[1.03]"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = getPosterUrl(null);
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-10">
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="rounded bg-amber-400/95 px-1.5 py-0.5 font-semibold text-stone-950">
                {formatRating(item.vote_average)}
              </span>
              <span className="rounded bg-stone-100/90 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-stone-900">
                {mediaType}
              </span>
            </div>
          </div>
          {continueLabel && (
            <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
              {continueLabel}
            </span>
          )}
        </div>

        <div className="space-y-1 p-2.5">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-stone-100">
            {title}
          </h3>
          <p className="text-xs text-stone-400">{getReleaseYear(item)}</p>
        </div>
      </Link>
    </article>
  );
}
