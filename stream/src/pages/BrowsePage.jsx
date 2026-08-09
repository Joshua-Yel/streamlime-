import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getMovieGenres,
  getTvGenres,
  getMoviesByGenre,
  getTvByGenre,
  discoverMovies,
  discoverTv,
} from '../services/tmdb';
import MovieCard from '../components/ui/MovieCard';
import { Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'vote_average.desc', label: 'Top rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
  { value: 'revenue.desc', label: 'Box office' },
];

const TV_SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'vote_average.desc', label: 'Top rated' },
  { value: 'first_air_date.desc', label: 'Newest' },
];

// --- HELPER: Map Friendly URLs to Actual TMDB API Filters ---
function getFilterParamsFromURL(searchParams, mediaType) {
  const collection = searchParams.get('collection');
  const runtime = searchParams.get('runtime');
  
  // Collection Presets
  if (collection === 'things-you-missed') {
    return {
      params: {
        'release_date.lte': '1990-12-31', // Older films
        'vote_count.gte': 150,
        sort_by: 'vote_average.desc', // High quality gems
      },
      label: 'Things You Missed',
      subtitle: 'Classics and underrated gems from decades past.'
    };
  }

  if (collection === '90-minutes-well-spent') {
    return {
      params: {
        'with_runtime.gte': 80,
        'with_runtime.lte': 100,
        'vote_average.gte': 7,
        sort_by: 'popularity.desc',
      },
      label: '90 Minutes Well Spent',
      subtitle: 'Tight, focused, and perfectly paced.'
    };
  }

  if (collection === 'beautifully-strange') {
    return {
      params: {
        'vote_average.gte': 7.5,
        'vote_count.gte': 50,
        sort_by: 'vote_average.desc', // We sort by rating to find the "best" unusual films
      },
      label: 'Beautifully Strange',
      subtitle: 'Unconventional films that linger.'
    };
  }

  if (collection === 'watch-with-someone') {
    return {
      params: {
        'with_genres': '35,10751', // Comedy (35) + Family (10751)
        'vote_count.gte': 100,
        sort_by: 'popularity.desc',
      },
      label: 'Watch With Someone',
      subtitle: 'Great for shared viewing.'
    };
  }

  // Runtime Presets (from Home filters)
  if (runtime) {
    let runtimeParams = {};
    if (runtime === '0-30') runtimeParams['with_runtime.lte'] = 30;
    else if (runtime === '30-60') runtimeParams['with_runtime.lte'] = 60;
    else if (runtime === '60-120') runtimeParams['with_runtime.gte'] = 60;
    else if (runtime === '120-plus') runtimeParams['with_runtime.gte'] = 120;
    
    return {
      params: {
        ...runtimeParams,
        'vote_count.gte': 50,
        sort_by: 'popularity.desc',
      },
      label: runtime === '0-30' ? 'Under 20m' : 
             runtime === '30-60' ? 'Under 45m' :
             runtime === '60-120' ? 'Around 90 min' : '2+ hours',
      subtitle: 'Filtered by duration.'
    };
  }

  return null; // No advanced filter
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [mediaType, setMediaType] = useState('movie');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for Advanced Filters (Collections/Runtime)
  const [activeFilterPreset, setActiveFilterPreset] = useState(null);

  // Load genres when media type changes
  useEffect(() => {
    async function loadGenres() {
      try {
        const genreList = mediaType === 'movie' ? await getMovieGenres() : await getTvGenres();
        setGenres(genreList);
        
        // If we have an active genre in URL, check if it exists in the new list
        const urlGenre = searchParams.get('genre');
        if (urlGenre) {
          const found = genreList.find(g => g.name.toLowerCase() === urlGenre.toLowerCase());
          if (found) {
            setSelectedGenre(found.id);
          } else {
            searchParams.delete('genre');
            setSearchParams(searchParams);
          }
        }
      } catch {
        setError('Could not load genres');
      }
    }
    loadGenres();
  }, [mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse URL Params on initial load
  useEffect(() => {
    const urlGenre = searchParams.get('genre');
    const urlRuntime = searchParams.get('runtime');
    const urlCollection = searchParams.get('collection');
    
    // Check for advanced filters first
    const preset = getFilterParamsFromURL(searchParams, mediaType);
    if (preset) {
      setActiveFilterPreset(preset);
      setSelectedGenre(null); // Clear genre selection
    } else if (urlGenre) {
      setActiveFilterPreset(null);
      // Genre selection is handled in the genre loading effect above
    } else {
      setActiveFilterPreset(null);
    }
  }, [searchParams, mediaType]);

  // Load content when genre / page / sort / URL Params change
  useEffect(() => {
    let ignore = false;

    async function loadContent() {
      try {
        setLoading(true);
        setError('');
        
        let data;
        const extra = { 
          sort_by: sortBy, 
          'vote_count.gte': 50 
        };

        // --- CASE 1: Advanced Filter Preset (Collections/Runtime) ---
        if (activeFilterPreset) {
          const discoverFn = mediaType === 'movie' ? discoverMovies : discoverTv;
          // Merge the preset params with the sort override and page
          const result = await discoverFn({ 
            page, 
            ...activeFilterPreset.params,
            sort_by: sortBy // Allow user sorting overrides
          });
          data = result;
        } 
        // --- CASE 2: Genre Filter ---
        else if (selectedGenre) {
          const fetchFn = mediaType === 'movie' ? getMoviesByGenre : getTvByGenre;
          const result = await fetchFn(selectedGenre, page, extra);
          data = result;
        } 
        // --- CASE 3: Nothing selected ---
        else {
          setResults([]);
          setLoading(false);
          return;
        }

        if (ignore) return;

        setResults(
          data.results.map((item) => ({
            ...item,
            media_type: mediaType,
          }))
        );
        setTotalPages(Math.min(data.totalPages || 1, 20));
      } catch {
        if (!ignore) setError('Could not load content');
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    // Only run if we have a genre or advanced filter set
    if (selectedGenre || activeFilterPreset) {
      loadContent();
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      ignore = true;
    };
  }, [selectedGenre, mediaType, page, sortBy, activeFilterPreset]);

  // Helper to select a genre and clean URL
  const selectGenre = useCallback((id) => {
    setSelectedGenre(id);
    setPage(1);
    setActiveFilterPreset(null);
    // Clean URL
    searchParams.delete('genre');
    searchParams.delete('runtime');
    searchParams.delete('collection');
    setSearchParams(searchParams);
  }, [searchParams, setSearchParams]);

  // Helper to change media type and clean URL
  const changeMediaType = (type) => {
    setMediaType(type);
    setSelectedGenre(null);
    setActiveFilterPreset(null);
    setPage(1);
    searchParams.delete('genre');
    searchParams.delete('runtime');
    searchParams.delete('collection');
    setSearchParams(searchParams);
  };

  const selectedGenreName = genres.find((g) => g.id === selectedGenre)?.name;
  const sortOptions = mediaType === 'movie' ? SORT_OPTIONS : TV_SORT_OPTIONS;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-5">
          <Filter className="h-6 w-6 text-amber-300" />
          <h1 className="text-3xl font-semibold text-white">Browse</h1>
        </div>

        <div className="flex gap-2">
          {['movie', 'tv'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => changeMediaType(type)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mediaType === type
                  ? 'bg-amber-300 text-stone-900'
                  : 'border border-stone-600 text-stone-200 hover:bg-stone-800'
              }`}
            >
              {type === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
          {activeFilterPreset && (
             <button
               onClick={() => {
                 setActiveFilterPreset(null);
                 searchParams.delete('collection');
                 searchParams.delete('runtime');
                 setSearchParams(searchParams);
                 setPage(1);
               }}
               className="ml-auto text-xs text-stone-400 underline hover:text-white transition"
             >
               Clear Filter
             </button>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Genre sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-stone-700/70 bg-stone-900/50 p-3 sticky top-4">
            <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Genres
            </h2>
            <div className="space-y-0.5 max-h-[70vh] overflow-y-auto pr-1">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => selectGenre(genre.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                    selectedGenre === genre.id
                      ? 'bg-amber-300 text-stone-900 font-semibold'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-stone-100'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
              {!genres.length && (
                <p className="px-3 py-2 text-sm text-stone-500">Loading…</p>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="lg:col-span-3 min-w-0">
          {!selectedGenre && !activeFilterPreset ? (
            <div className="rounded-xl border border-stone-700/70 bg-stone-900/50 p-10 text-center">
              <p className="text-stone-400">
                Pick a genre to browse {mediaType === 'movie' ? 'movies' : 'TV shows'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-stone-100 sm:text-2xl">
                    {activeFilterPreset ? activeFilterPreset.label : selectedGenreName}{' '}
                    <span className="text-stone-400 font-normal text-base">
                      {mediaType === 'movie' ? 'movies' : 'shows'}
                    </span>
                  </h2>
                  {activeFilterPreset && (
                    <p className="text-xs text-stone-400 mt-1">{activeFilterPreset.subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-stone-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-md border border-stone-600 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-300 focus:outline-none"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-stone-800" />
                  ))}
                </div>
              )}

              {error && (
                <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">
                  {error}
                </p>
              )}

              {!loading && !error && results.length > 0 && (
                <>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                    {results.map((item) => (
                      <MovieCard
                        item={item}
                        key={`${item.media_type || mediaType}-${item.id}`}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-600 px-3 py-1.5 text-sm text-stone-200 disabled:opacity-40 hover:bg-stone-800 transition"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Prev
                      </button>
                      <span className="text-sm text-stone-400">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-stone-600 px-3 py-1.5 text-sm text-stone-200 disabled:opacity-40 hover:bg-stone-800 transition"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {!loading && !error && results.length === 0 && (
                <div className="rounded-xl border border-stone-700/70 bg-stone-900/50 p-10 text-center">
                  <p className="text-stone-400">
                    No {mediaType === 'movie' ? 'movies' : 'shows'} found for this
                    filter.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}