import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from '../components/ui/MovieCard';
import { searchTitles } from '../services/tmdb';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const [draftQuery, setDraftQuery] = useState(q);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function runSearch() {
      if (!q.trim()) {
        setResults([]);
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

  const onSubmit = (event) => {
    event.preventDefault();
    setSearchParams(draftQuery.trim() ? { q: draftQuery.trim() } : {});
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-2xl border border-stone-700/70 bg-stone-900/70 p-5 sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-100">Search Streamline Catalog</h1>
        <p className="mt-2 text-sm text-stone-300">Find movies and TV shows, then open playback options and official trailers.</p>

        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
          <input
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Try: Dune, Breaking Bad, Interstellar"
            className="w-full rounded-lg border border-stone-600 bg-stone-950 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-400 focus:border-amber-300 focus:outline-none"
          />
          <button className="rounded-lg bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-900 hover:bg-amber-200" type="submit">Search</button>
        </form>
      </section>

      <section className="mt-6">
        {loading && <p className="text-sm text-stone-300">Searching...</p>}
        {error && <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}

        {!loading && !error && q && (
          <p className="mb-4 text-sm text-stone-300">
            {results.length} result{results.length === 1 ? '' : 's'} for <span className="font-semibold text-amber-200">{q}</span>
          </p>
        )}

        {!loading && !error && !q && <p className="text-sm text-stone-300">Search by title to start exploring.</p>}

        {!loading && !error && !!q && !results.length && (
          <p className="rounded-lg border border-stone-700/80 bg-stone-900/60 p-3 text-sm text-stone-200">No results matched this query.</p>
        )}

        {!!results.length && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {results.map((item) => (
              <MovieCard item={item} key={`${item.media_type}-${item.id}`} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
