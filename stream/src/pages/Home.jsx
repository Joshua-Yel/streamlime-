import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Star, Tv } from 'lucide-react';
import MediaRow from '../components/ui/MediaRow';
import { getPopularMovies, getPopularTv, getTrending } from '../services/tmdb';
import { formatRating, getBackdropUrl, getMediaType, getReleaseYear, getTitleName } from '../utils/media';
import { buildBecauseYouWatched, buildMoodSuggestions, loadWatchHistory, MOOD_PRESETS } from '../utils/recommendations';

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [trending, setTrending] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [activeMood, setActiveMood] = useState('chill');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setWatchHistory(loadWatchHistory());
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const [trendingItems, movieItems, tvItems] = await Promise.all([getTrending(), getPopularMovies(), getPopularTv()]);
        if (ignore) {
          return;
        }
        setTrending(trendingItems);
        setMovies(movieItems);
        setSeries(tvItems);
      } catch (err) {
        if (!ignore) {
          setError('Could not load titles from TMDB. Check your API token and try again.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const featured = useMemo(() => trending.find((item) => item.backdrop_path) || trending[0], [trending]);
  const catalog = useMemo(() => {
    const seen = new Set();
    return [...trending, ...movies, ...series].filter((item) => {
      const mediaType = getMediaType(item);
      const key = `${mediaType}-${item.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [movies, series, trending]);

  const becauseYouWatched = useMemo(() => buildBecauseYouWatched(catalog, watchHistory), [catalog, watchHistory]);
  const moodSuggestions = useMemo(() => buildMoodSuggestions(catalog, activeMood), [activeMood, catalog]);
  const lastWatchedTitle = watchHistory[0]?.title;

  const onSearchSubmit = (event) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
      <section className="hero-panel relative overflow-hidden rounded-2xl border border-stone-700/70 p-5 sm:p-8">
        {featured?.backdrop_path && (
          <img
            src={getBackdropUrl(featured.backdrop_path)}
            alt={`Backdrop for ${getTitleName(featured)}`}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}

        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-stone-300/20 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-200">
            <Tv className="h-3.5 w-3.5" />
            Smart Streaming Guide
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-5xl">Find movies and shows. Jump straight into playback.</h1>
          <p className="text-sm text-stone-200 sm:text-base">
            Explore curated picks, watch trailers, and open available viewing options in seconds.
          </p>

          <form onSubmit={onSearchSubmit} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="search-home" className="sr-only">Search titles</label>
            <input
              id="search-home"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies or shows..."
              className="w-full rounded-lg border border-stone-500/60 bg-black/45 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-300 focus:border-amber-300 focus:outline-none"
            />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-200">
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          {featured && (
            <Link
              to={`/title/${getMediaType(featured)}/${featured.id}`}
              className="inline-flex items-center gap-2 text-sm text-amber-200 underline decoration-amber-300 underline-offset-4"
            >
              Featured now: {getTitleName(featured)} ({getReleaseYear(featured)}) • {formatRating(featured.vote_average)}
              <Star className="h-4 w-4 fill-current" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 space-y-8">
        {loading && <p className="text-sm text-stone-300">Loading curated picks...</p>}
        {error && <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}

        {!loading && !error && (
          <>
            {!!becauseYouWatched.length && (
              <MediaRow
                title={lastWatchedTitle ? `Because you watched ${lastWatchedTitle}` : 'Because you watched'}
                items={becauseYouWatched}
              />
            )}

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-stone-100">Mood-Based Suggestions</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(MOOD_PRESETS).map(([key, mood]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveMood(key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        activeMood === key
                          ? 'bg-amber-300 text-stone-900'
                          : 'border border-stone-600 text-stone-200 hover:bg-stone-800'
                      }`}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>
              <MediaRow title={`Now: ${MOOD_PRESETS[activeMood].label}`} items={moodSuggestions} />
            </section>

            <MediaRow title="Trending This Week" items={trending.slice(0, 18)} />
            <MediaRow title="Popular Movies" items={movies.slice(0, 18)} />
            <MediaRow title="Popular Series" items={series.slice(0, 18)} />
          </>
        )}
      </section>
    </main>
  );
}
