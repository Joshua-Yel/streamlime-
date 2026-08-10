import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Heart } from 'lucide-react';
import MovieCard from '../components/ui/MovieCard';
import { loadMyList, removeFromMyList } from '../utils/watchlist';
import { loadFavorites, removeFavorite } from '../utils/recommendations';

function toCardItem(item) {
  return {
    ...item,
    media_type: item.mediaType || item.media_type,
    title: item.title,
    name: item.title,
  };
}

export default function MyListPage() {
  const [items, setItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [tab, setTab] = useState('list'); // 'list' | 'favorites'

  const refresh = () => {
    setItems(loadMyList().map(toCardItem));
    setFavorites(loadFavorites().map(toCardItem));
  };

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const clearItem = (id, mediaType) => {
    const next = removeFromMyList(id, mediaType);
    setItems(next.map(toCardItem));
  };

  const clearFavorite = (id, mediaType) => {
    const next = removeFavorite(id, mediaType);
    setFavorites(next.map(toCardItem));
  };

  const active = tab === 'favorites' ? favorites : items;
  const isEmpty = active.length === 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-amber-300" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              My List
            </h1>
            <p className="text-sm text-stone-400">
              Saved on this device only — watchlist and favorites.
            </p>
          </div>
        </div>

        <div className="flex gap-1 rounded-lg border border-stone-700 bg-stone-950/60 p-1">
          <button
            type="button"
            onClick={() => setTab('list')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === 'list'
                ? 'bg-amber-400 text-stone-950'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Watchlist
            {items.length > 0 && (
              <span className="opacity-70">({items.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('favorites')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === 'favorites'
                ? 'bg-rose-400 text-stone-950'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
            Favorites
            {favorites.length > 0 && (
              <span className="opacity-70">({favorites.length})</span>
            )}
          </button>
        </div>
      </header>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-stone-700 bg-stone-950/40 px-6 py-16 text-center">
          <p className="text-sm text-stone-300">
            {tab === 'favorites'
              ? 'No favorites yet.'
              : 'Your watchlist is empty.'}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Open any title and tap{' '}
            {tab === 'favorites' ? 'Favorite' : 'Watchlist'}.
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
          {active.map((item) => (
            <div
              key={`${item.media_type || item.mediaType}-${item.id}`}
              className="space-y-2"
            >
              <MovieCard item={item} variant="grid" />
              <button
                type="button"
                onClick={() =>
                  tab === 'favorites'
                    ? clearFavorite(
                        item.id,
                        item.mediaType || item.media_type,
                      )
                    : clearItem(item.id, item.mediaType || item.media_type)
                }
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