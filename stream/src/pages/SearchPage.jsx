import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import MovieCard from '../components/ui/MovieCard';
import { TitleGridSkeleton } from '../components/ui/Skeleton';
import { searchTitles } from '../services/tmdb';
import { cn } from '../lib/utils';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || 'all';

  const [draftQuery, setDraftQuery] = useState(q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    setDraftQuery(q);
  }, [q]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function runSearch() {
      if (!q.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const items = await searchTitles(q, { signal: controller.signal });
        if (!ignore) {
          setResults(items);
        }
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
          return;
        }
        if (!ignore) {
          setError('Search request failed. Please try again.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    runSearch();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [q]);

  const filteredResults =
    typeFilter === 'all'
      ? results
      : results.filter((item) => item.media_type === typeFilter);

  const onSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams();
    if (draftQuery.trim()) {
      next.set('q', draftQuery.trim());
    }
    if (typeFilter !== 'all') {
      next.set('type', typeFilter);
    }
    setSearchParams(next);
  };

  const setType = (type) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') {
      next.delete('type');
    } else {
      next.set('type', type);
    }
    setSearchParams(next);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <section className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 sm:p-5">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-100">Search</h1>
        <p className="mt-1 text-sm text-stone-400">
          Find movies and TV shows across the catalog.
        </p>

        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit} role="search">
          <label htmlFor="search-catalog" className="sr-only">
            Search catalog
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
              aria-hidden="true"
            />
            <input
              id="search-catalog"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Try Dune, Breaking Bad, Interstellar…"
              autoFocus
              className="w-full rounded-md border border-stone-700 bg-stone-950 py-3 pl-10 pr-4 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
            />
          </div>
          <button
            className="rounded-md bg-amber-400 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Result type">
          {[
            { id: 'all', label: 'All' },
            { id: 'movie', label: 'Movies' },
            { id: 'tv', label: 'TV' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={typeFilter === option.id}
              onClick={() => setType(option.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition',
                typeFilter === option.id
                  ? 'bg-amber-400 text-stone-950'
                  : 'border border-stone-700 text-stone-300 hover:bg-stone-900',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        {loading && <TitleGridSkeleton count={12} />}

        {error && (
          <p
            className="rounded-lg border border-rose-700/50 bg-rose-950/40 p-3 text-sm text-rose-100"
            role="alert"
          >
            {error}
          </p>
        )}

        {!loading && !error && q && (
          <p className="mb-4 text-sm text-stone-400">
            {filteredResults.length} result{filteredResults.length === 1 ? '' : 's'} for{' '}
            <span className="font-medium text-stone-200">{q}</span>
            {typeFilter !== 'all' ? ` · ${typeFilter}` : ''}
          </p>
        )}

        {!loading && !error && !q && (
          <div className="rounded-xl border border-dashed border-stone-700 bg-stone-950/40 px-6 py-14 text-center text-sm text-stone-400">
            Search by title to start exploring.
          </div>
        )}

        {!loading && !error && !!q && !filteredResults.length && (
          <div className="rounded-xl border border-stone-800 bg-stone-950/40 px-6 py-12 text-center text-sm text-stone-300">
            No results matched this query
            {typeFilter !== 'all' ? ` in ${typeFilter}` : ''}.
          </div>
        )}

        {!!filteredResults.length && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredResults.map((item) => (
              <MovieCard item={item} key={`${item.media_type}-${item.id}`} variant="grid" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
