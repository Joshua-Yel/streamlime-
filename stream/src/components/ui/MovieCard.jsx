import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRating, getMediaType, getPosterUrl, getReleaseYear, getTitleName } from '../../utils/media';
import { Card } from './card';

export default function MovieCard({ item }) {
  const mediaType = getMediaType(item);
  const posterUrl = getPosterUrl(item.poster_path);

  return (
    <Card hover className="movie-card group w-[180px] shrink-0 overflow-hidden bg-stone-900/90">
      <Link to={`/title/${mediaType}/${item.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-stone-800">
          {posterUrl ? (
            <motion.img
              src={posterUrl}
              alt={`Poster for ${getTitleName(item)}`}
              loading="lazy"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-300">No poster</div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 to-transparent p-2 text-xs">
            <span className="rounded bg-amber-300 px-2 py-0.5 font-semibold text-stone-900">{formatRating(item.vote_average)}</span>
            <span className="rounded bg-stone-100/90 px-2 py-0.5 font-semibold uppercase text-stone-900">{mediaType}</span>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold text-stone-100">{getTitleName(item)}</h3>
          <div className="flex items-center justify-between text-xs text-stone-300">
            <span>{getReleaseYear(item)}</span>
            <span className="inline-flex items-center gap-1 text-amber-300">
              <PlayCircle className="h-3.5 w-3.5" />
              Watch
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
