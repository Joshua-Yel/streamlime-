import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import MovieCard from '../components/ui/MovieCard';
import { loadMyList, removeFromMyList } from '../utils/watchlist';

export default function MyListPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(
      loadMyList().map((item) => ({
        ...item,
        media_type: item.mediaType,
        title: item.title,
        name: item.title,
      })),
    );
  }, []);

  const clearItem = (id, mediaType) => {
    const next = removeFromMyList(id, mediaType);
    setItems(
      next.map((item) => ({
        ...item,
        media_type: item.mediaType,
        title: item.title,
        name: item.title,
      })),
    );
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-amber-300" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            My List
          </h1>
          <p className="text-sm text-stone-400">
            Titles you saved for later. Stored on this device only.
          </p>
        </div>
      </header>

      {!items.length ? (
        <div className="rounded-xl border border-dashed border-stone-700 bg-stone-950/40 px-6 py-16 text-center">
          <p className="text-sm text-stone-300">Your list is empty.</p>
          <p className="mt-1 text-xs text-stone-500">
            Open any title and tap Add to My List.
          </p>
          <Link
            to="/browse"
            className="mt-4 inline-flex rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-300"
          >
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div key={`${item.media_type}-${item.id}`} className="space-y-2">
              <MovieCard item={item} variant="grid" />
              <button
                type="button"
                onClick={() => clearItem(item.id, item.mediaType || item.media_type)}
                className="w-full rounded-md border border-stone-700 px-2 py-1.5 text-xs text-stone-400 transition hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
