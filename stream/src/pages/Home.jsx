import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
} from '../services/tmdb';
import {
  formatRating,
  getBackdropUrl,
  getMediaType,
  getPosterUrl,
  getReleaseYear,
  getTitleName,
} from '../utils/media';
import {
  buildBecauseYouWatched,
  loadWatchHistory,
  loadFavorites,
} from '../utils/recommendations';
import {
  buildContinueWatching,
  buildContinueWatchingAsync,
} from '../utils/continueWatching';
import { loadMyList } from '../utils/watchlist';

const EDITORIAL_LINES = [
  'Worth the evening.',
  "Don't read anything about it first.",
  'A strange little gem.',
  'Beautiful, and a little unsettling.',
  'Ridiculous. Somehow it works.',
  'You probably scrolled past this one.',
  'Better than it has any right to be.',
  'Slow to start. Stays with you.',
  'Not for background noise.',
  'One for a quiet night.',
];

function editorialLine(id, offset = 0) {
  const n = Math.abs(Number(id) || 0) + offset;
  return EDITORIAL_LINES[n % EDITORIAL_LINES.length];
}

const MOODS = [
  { key: 'funny', label: 'Funny' },
  { key: 'feel-good', label: 'Feel Good' },
  { key: 'dark', label: 'Dark' },
  { key: 'strange', label: 'Strange' },
  { key: 'romantic', label: 'Romantic' },
  { key: 'intense', label: 'Intense' },
  { key: 'thoughtful', label: 'Thoughtful' },
  { key: 'comforting', label: 'Comforting' },
];

const DURATIONS = [
  { label: 'Under 20m', value: '0-30' },
  { label: 'Under 45m', value: '30-60' },
  { label: '~90 min', value: '60-120' },
  { label: '2+ hours', value: '120-plus' },
];

const GENRES = [
  'Drama', 'Comedy', 'Horror', 'Action', 'Thriller', 'Animation', 
  'Documentary', 'Sci-Fi', 'Romance', 'Mystery'
];

const ERAS = ['2020s', '2010s', '2000s', '1990s', '1980s', 'Classics'];
const LANGUAGES = ['English', 'Japanese', 'Korean', 'Spanish', 'French', 'Italian'];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'This morning';
  if (h < 17) return 'This afternoon';
  return 'Tonight';
}

/* ——— Atoms (Memoized) ——— */

const Kicker = memo(({ children, className = '' }) => (
  <p className={`text-[11px] font-medium uppercase tracking-[0.2em] text-[#726b59] ${className}`}>
    {children}
  </p>
));

const SectionLabel = memo(({ children, aside, id }) => (
  <div id={id} className="mb-6 flex scroll-mt-24 items-end justify-between gap-4 border-b border-[#1e1b14] pb-3">
    <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#726b59]">
      {children}
    </h2>
    {aside}
  </div>
));

const CompactTitleCard = memo(({ item, className = '' }) => {
  const type = getMediaType(item);
  const title = getTitleName(item);
  const poster = item.poster_path;

  return (
    <Link to={`/title/${type}/${item.id}`} className={`group block ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-[#151310] ring-1 ring-white/[0.04] transition-all duration-300 group-hover:ring-[#d3ae46]/40 group-hover:shadow-[0_0_15px_rgba(211,174,70,0.15)]">
        {poster ? (
          <img src={getPosterUrl(poster)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05] group-hover:opacity-95" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-[#48432f]">—</div>
        )}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-gradient-to-t from-[#d3ae46]/10 via-transparent to-transparent" />
      </div>
      <p className="mt-1.5 truncate text-[12px] text-[#e9e4d6] transition group-hover:text-white">
        {title}
      </p>
      <p className="text-[10px] text-[#726b59]">
        {getReleaseYear(item)}
        {item.vote_average > 0 ? ` · ${formatRating(item.vote_average)}` : ''}
      </p>
    </Link>
  );
});

const LargePosterGrid = memo(({ items, maxItems = 12 }) => {
  if (!items || items.length === 0) return null;
  const displayItems = items.slice(0, maxItems);
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 gap-y-6">
      {displayItems.map((item) => (
        <CompactTitleCard key={`${getMediaType(item)}-${item.id}`} item={item} />
      ))}
    </div>
  );
});

const Carousel = memo(({ items, renderItem, gap = 4 }) => {
  if (!items || items.length === 0) return null;
  return (
    <ul className={`flex gap-${gap} overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 36px), transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 36px), transparent)',
      }}
    >
      {items.map((item, index) => (
        <li key={item.id || index} className="shrink-0 snap-start">
          {renderItem(item)}
        </li>
      ))}
      <li className="w-6 shrink-0 sm:w-10" aria-hidden />
    </ul>
  );
});

const FilterPill = memo(({ label, isActive, onClick, className = '' }) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-4 py-1.5 text-xs transition-all ${isActive 
      ? 'bg-[#d3ae46] border-[#d3ae46] text-[#0c0b09] font-medium' 
      : 'border-[#2a251d] text-[#a79f8a] hover:border-[#726b59] hover:text-white'
    } ${className}`}
  >
    {label}
  </button>
));

const SkeletonBlock = memo(({ className = '' }) => (
  <div className={`animate-pulse rounded-sm bg-[#18160f] ${className}`} />
));

/* ——— Page ——— */

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trending, setTrending] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [watchHistory, setWatchHistory] = useState([]);
  const [continueItems, setContinueItems] = useState([]);
  const [myList, setMyList] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeMood, setActiveMood] = useState(() => searchParams.get('mood') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const moodRevealRef = useRef(null);

  // Load local data on mount (and when returning to the tab)
  useEffect(() => {
    function hydrateLocal() {
      setWatchHistory(loadWatchHistory());
      setContinueItems(buildContinueWatching());
      setMyList(
        loadMyList().map((item) => ({
          ...item,
          media_type: item.mediaType,
          title: item.title,
          name: item.title,
        })),
      );
      setFavorites(
        loadFavorites().map((item) => ({
          ...item,
          media_type: item.mediaType,
          title: item.title,
          name: item.title,
        })),
      );
    }

    hydrateLocal();
    let ignore = false;
    buildContinueWatchingAsync()
      .then((items) => {
        if (!ignore) setContinueItems(items);
      })
      .catch(() => {});

    const onFocus = () => hydrateLocal();
    window.addEventListener('focus', onFocus);
    return () => {
      ignore = true;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Load TMDB data
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        setError('');
        const [t, m, s, tr] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getPopularTv(),
          getTopRatedMovies(),
        ]);
        if (ignore) return;
        setTrending(t);
        setMovies(m);
        setSeries(s);
        setTopRated(tr);
      } catch {
        if (!ignore) setError('Could not load titles. Check your connection and try again.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, []);

  // Sync URL param with mood state
  useEffect(() => {
    const current = searchParams.get('mood');
    if (activeMood && current !== activeMood) {
      setSearchParams({ mood: activeMood }, { replace: true });
    } else if (!activeMood && current) {
      searchParams.delete('mood');
      setSearchParams(searchParams, { replace: true });
    }
  }, [activeMood]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unified catalog
  const catalog = useMemo(() => {
    const seen = new Set();
    return [...trending, ...movies, ...series, ...topRated].filter((item) => {
      const key = `${getMediaType(item)}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [movies, series, topRated, trending]);

  // Picks
  const tonightPick = useMemo(() => {
    const candidates = catalog.filter((i) => i.backdrop_path && (i.vote_average || 0) >= 7);
    return candidates[1] || candidates[0] || trending[0] || null;
  }, [catalog, trending]);

  const hiddenGems = useMemo(() => {
    const popularIds = new Set(
      [...movies.slice(0, 8), ...trending.slice(0, 8)].map((i) => `${getMediaType(i)}-${i.id}`),
    );
    return catalog
      .filter((i) => {
        const key = `${getMediaType(i)}-${i.id}`;
        return !popularIds.has(key) && (i.vote_average || 0) >= 7.2 && i.poster_path;
      })
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  }, [catalog, movies, trending]);

  const becauseYouWatched = useMemo(
    () => buildBecauseYouWatched(catalog, watchHistory).slice(0, 14),
    [catalog, watchHistory],
  );

  // --- FIX: Manual Mood Genre Mappings ---
  // This replaces the external buildMoodSuggestions call to ensure proper filtering.
  const moodSuggestions = useMemo(() => {
    if (!activeMood) return [];

    // TMDB Genre IDs mapping
    const GENRE_MAP = {
      funny: [35, 16],        // Comedy, Animation
      'feel-good': [35, 10749, 14], // Comedy, Romance, Fantasy
      dark: [53, 27, 9648],   // Thriller, Horror, Mystery
      strange: [878, 14, 9648], // Sci-Fi, Fantasy, Mystery
      romantic: [10749],      // Romance
      intense: [28, 53, 10752], // Action, Thriller, War
      thoughtful: [18, 99],   // Drama, Documentary
      comforting: [35, 10751, 14], // Comedy, Family, Fantasy
    };

    const targetGenres = GENRE_MAP[activeMood] || [];
    if (targetGenres.length === 0) return [];

    // Step 1: Filter catalog for items that match the target genre IDs
    let filtered = catalog.filter(item => {
      // Some items may not have genre_ids properly mapped in the catalog object
      const itemGenres = item.genre_ids || [];
      return itemGenres.some(id => targetGenres.includes(id));
    });

    // Step 2: Sort by vote average to get the best of the mood
    filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

    // Step 3: If we don't have enough genre-specific items, fallback to high-rated items
    if (filtered.length < 6) {
      const extra = catalog
        .filter(item => !filtered.includes(item))
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      filtered = [...filtered, ...extra];
    }

    return filtered.slice(0, 12);
  }, [activeMood, catalog]);

  const handleMoodSelect = (key) => {
    setActiveMood(key);
    requestAnimationFrame(() => {
      setTimeout(() => {
        moodRevealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  };

  const handleClearMood = () => setActiveMood(null);
  const handleDuration = (value) => navigate(`/browse?runtime=${encodeURIComponent(value)}`);

  return (
    <main className="min-h-screen bg-[#0c0b09] text-[#e9e4d6] antialiased">
      <div className="mx-auto max-w-[1360px] px-5 pb-24 sm:px-8 lg:px-10">
        
        {loading && (
          <div className="py-16 sm:py-20">
            <SkeletonBlock className="mb-4 h-14 w-full max-w-xl sm:h-16" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
              {[...Array(12)].map((_, i) => <SkeletonBlock key={i} className="aspect-[2/3]" />)}
            </div>
          </div>
        )}

        {error && (
          <div className="my-12 flex flex-col gap-3 rounded-sm border border-red-900/35 bg-red-950/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-200/90">{error}</p>
            <button type="button" onClick={() => window.location.reload()} className="shrink-0 text-sm font-medium text-red-100 underline underline-offset-4 transition hover:text-white">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ——— 1. Opening + Filters Toolbar ——— */}
            <section className="pb-10 pt-12 sm:pb-12 sm:pt-16 flex flex-col gap-6">
              <div className="max-w-3xl">
                <Kicker className="mb-1">For {greeting().toLowerCase()}</Kicker>
                <h1 className="mt-3 font-serif text-[12.5vw] leading-[0.95] tracking-tight text-[#f4efe2] sm:text-5xl md:text-[4.25rem]">
                  {greeting() === 'Tonight' ? (
                    <>Something worth <br /> your evening.</>
                  ) : greeting() === 'This afternoon' ? (
                    <>Something worth <br /> your afternoon.</>
                  ) : (
                    <>Start your day <br /> with something good.</>
                  )}
                </h1>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#1e1b14] pb-4">
                {/* Mood Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] uppercase tracking-wider text-[#726b59]">Mood:</span>
                  {MOODS.map((mood) => (
                    <FilterPill 
                      key={mood.key} 
                      label={mood.label} 
                      isActive={activeMood === mood.key} 
                      onClick={() => handleMoodSelect(mood.key)}
                    />
                  ))}
                  {activeMood && (
                    <button onClick={handleClearMood} className="ml-1 text-[10px] uppercase tracking-wider text-[#5c5747] hover:text-white transition">
                      ✕ Clear
                    </button>
                  )}
                </div>
                
                {/* Time Filters */}
                <div className="flex flex-wrap items-center gap-2 sm:border-l sm:border-[#1e1b14] sm:pl-6">
                  <span className="mr-1 text-[11px] uppercase tracking-wider text-[#726b59]">Time:</span>
                  {DURATIONS.map((d) => (
                    <FilterPill 
                      key={d.value} 
                      label={d.label} 
                      onClick={() => handleDuration(d.value)} 
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* ——— 2. Mood Reveal OR Trending Hook ——— */}
            {activeMood ? (
              <div ref={moodRevealRef} className="mb-14 animate-in fade-in slide-in-from-bottom-2 duration-500 border-b border-[#1e1b14] pb-14">
                {moodSuggestions.length > 0 ? (
                  <>
                    <div className="flex justify-between items-end mb-6">
                      <p className="text-sm text-[#a79f8a]">Twelve strong fits for this mood.</p>
                      <Link to={`/browse?mood=${encodeURIComponent(activeMood)}`} className="text-[13px] text-[#c9c2ac] underline decoration-[#3a3527] underline-offset-4 transition hover:text-white hover:decoration-[#d3ae46]">
                        Browse all →
                      </Link>
                    </div>
                    <LargePosterGrid items={moodSuggestions} maxItems={12} />
                  </>
                ) : (
                  <div className="rounded-sm border border-[#1e1b14] bg-[#151310]/50 px-5 py-6">
                    <p className="text-sm text-[#a79f8a]">Not enough titles in this mood yet. Try another.</p>
                  </div>
                )}
              </div>
            ) : (
              <section className="mb-14 border-b border-[#1e1b14] pb-10">
                <SectionLabel>Trending Now</SectionLabel>
                <Carousel
                  items={trending.slice(0, 10)}
                  renderItem={(item) => <CompactTitleCard item={item} className="w-[120px] sm:w-[140px]" />}
                />
              </section>
            )}

            {/* ——— 3. Continue Watching (show as soon as there is progress) ——— */}
            {continueItems.length >= 1 && (
              <section className="py-4 pb-12">
                <SectionLabel aside={<span className="text-[11px] text-[#5c5747]">{continueItems.length} in progress</span>}>
                  Continue Watching
                </SectionLabel>
                <Carousel
                  items={continueItems.slice(0, 12)}
                  renderItem={(item) => {
                    const type = item.media_type || item.mediaType || 'tv';
                    const href = type === 'tv' && item.continueSeason && item.continueEpisode
                      ? `/tv/${item.id}/${item.continueSeason}/${item.continueEpisode}`
                      : `/title/${type}/${item.id}`;
                    return (
                      <Link to={href} className="group block w-[140px]">
                        <div className="aspect-[2/3] overflow-hidden rounded-sm bg-[#151310] ring-1 ring-white/[0.04] group-hover:ring-[#d3ae46]/40 transition-all">
                          {item.poster_path ? (
                            <img src={getPosterUrl(item.poster_path)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                          ) : <div className="flex h-full items-center justify-center text-[10px] text-[#48432f]">—</div>}
                        </div>
                        <p className="mt-2 truncate text-[13px] text-[#e9e4d6] transition group-hover:text-white">{item.title || item.name}</p>
                        <p className="text-[11px] text-[#726b59]">{item.continueLabel || 'Resume'}</p>
                      </Link>
                    );
                  }}
                />
              </section>
            )}

            {/* ——— 4. Tonight's Pick (Full Bleed) ——— */}
            {tonightPick && (
              <section className="relative my-10 -mx-5 sm:-mx-8 lg:-mx-10 overflow-hidden bg-[#151310] py-16 sm:py-24 ring-1 ring-white/[0.04]">
                {tonightPick.backdrop_path && (
                  <img src={getBackdropUrl(tonightPick.backdrop_path)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0c0b09] via-[#0c0b09]/80 to-transparent sm:via-[#0c0b09]/40" />
                <div className="relative mx-auto max-w-[1360px] px-5 sm:px-8 lg:px-10">
                  <div className="max-w-xl">
                    <Kicker className="mb-2">Tonight&rsquo;s Pick</Kicker>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#a79f8a]">
                      {getMediaType(tonightPick)} · {getReleaseYear(tonightPick)}
                      {tonightPick.vote_average > 0 && ` · ${formatRating(tonightPick.vote_average)}`}
                    </p>
                    <h3 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-[#f4efe2] sm:text-5xl">
                      <Link to={`/title/${getMediaType(tonightPick)}/${tonightPick.id}`} className="transition hover:text-white">
                        {getTitleName(tonightPick)}
                      </Link>
                    </h3>
                    <p className="mt-4 font-serif text-lg italic leading-snug text-[#c9c2ac]">
                      &ldquo;{editorialLine(tonightPick.id)}&rdquo;
                    </p>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[#5c5747]">— Streamline editors</p>
                    {tonightPick.overview && (
                      <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-[#e9e4d6]/80">{tonightPick.overview}</p>
                    )}
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link to={getMediaType(tonightPick) === 'tv' ? `/tv/${tonightPick.id}/1/1` : `/movie/${tonightPick.id}`} className="inline-flex items-center rounded-sm bg-[#f4efe2] px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-[#0c0b09] transition hover:bg-white active:scale-[0.98]">
                        Watch
                      </Link>
                      <Link to={`/title/${getMediaType(tonightPick)}/${tonightPick.id}`} className="inline-flex items-center rounded-sm border border-[#3a3527] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#c9c2ac] transition hover:border-[#726b59] hover:text-white">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ——— 5. Your List + Favorites ——— */}
            {/* {myList.length > 0 && (
              <section className="py-6">
                <SectionLabel
                  aside={
                    <Link to="/my-list" className="text-[11px] text-[#5c5747] underline-offset-2 hover:text-[#a79f8a] hover:underline">
                      {myList.length} saved · View all
                    </Link>
                  }
                >
                  Your List
                </SectionLabel>
                <Carousel items={myList.slice(0, 12)} renderItem={(item) => <CompactTitleCard item={item} className="w-[120px] sm:w-[140px]" />} />
              </section>
            )} */}

            {favorites.length > 0 && (
              <section className="py-6">
                <SectionLabel aside={<span className="text-[11px] text-[#5c5747]">{favorites.length} liked</span>}>
                  Favorites
                </SectionLabel>
                <Carousel items={favorites.slice(0, 12)} renderItem={(item) => <CompactTitleCard item={item} className="w-[120px] sm:w-[140px]" />} />
              </section>
            )}

            {/* ——— 6. Because You Watched ——— */}
            <section className="border-t border-[#1e1b14] py-12">
              <SectionLabel aside={watchHistory.length > 0 ? <span className="text-[11px] text-[#5c5747]">Based on recent watching</span> : null}>
                {watchHistory.length > 0 ? `After “${watchHistory[0]?.title || 'this'}”` : 'You May Also Like'}
              </SectionLabel>
              {becauseYouWatched.length > 0 ? (
                <Carousel items={becauseYouWatched} renderItem={(item) => <CompactTitleCard item={item} className="w-[120px] sm:w-[140px]" />} />
              ) : (
                <div className="rounded-sm border border-[#1e1b14] bg-[#151310]/50 px-5 py-6">
                  <p className="text-sm text-[#a79f8a]">Watch a few titles and we&rsquo;ll start suggesting more like them here.</p>
                </div>
              )}
            </section>

            {/* ——— 7. Hidden Gems + Popular (Unified Dense Block) ——— */}
            <section className="border-t border-[#1e1b14] py-12">
              <div className="flex flex-col gap-12 lg:gap-16">
                <div>
                  <SectionLabel aside="Worth discovering">Hidden Gems</SectionLabel>
                  <p className="mb-6 max-w-lg text-sm leading-relaxed text-[#a79f8a]">
                    Strongly rated, not dominating the charts. Worth a look if you want something outside the usual cycle.
                  </p>
                  <LargePosterGrid items={hiddenGems} maxItems={12} />
                </div>

                <div>
                  <SectionLabel>Popular Now</SectionLabel>
                  <LargePosterGrid items={movies} maxItems={12} />
                </div>
              </div>
            </section>

            {/* ——— 8. Critically Acclaimed ——— */}
            <section className="border-t border-[#1e1b14] py-12">
              <SectionLabel>Critically Acclaimed</SectionLabel>
              <Carousel items={topRated.slice(0, 10)} renderItem={(item) => <CompactTitleCard item={item} className="w-[120px] sm:w-[140px]" />} />
            </section>

            {/* ——— 9. Genre & Era Discovery ——— */}
            <section className="border-t border-[#1e1b14] py-12">
              <div className="grid gap-10 sm:grid-cols-3">
                <div>
                  <SectionLabel>Browse by Genre</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => (
                      <Link key={genre} to={`/browse?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-[#2a251d] px-4 py-1.5 text-[12px] text-[#a79f8a] transition hover:border-[#726b59] hover:text-white">
                        {genre}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Era</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {ERAS.map((era) => (
                      <Link key={era} to={`/browse?era=${encodeURIComponent(era)}`} className="rounded-full border border-[#2a251d] px-4 py-1.5 text-[12px] text-[#a79f8a] transition hover:border-[#726b59] hover:text-white">
                        {era}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <SectionLabel>Language</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <Link key={lang} to={`/browse?language=${encodeURIComponent(lang)}`} className="rounded-full border border-[#2a251d] px-4 py-1.5 text-[12px] text-[#a79f8a] transition hover:border-[#726b59] hover:text-white">
                        {lang}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ——— 10. Editorial Collections (IMAGE-BACKED) ——— */}
            <section className="border-t border-[#1e1b14] py-12">
              <SectionLabel>Curated Collections</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <CollectionCard to="/browse?collection=beautifully-strange" title="Beautifully Strange" desc="Unconventional films that linger." backdrop={catalog.find(i => i.backdrop_path)?.backdrop_path} />
                <CollectionCard to="/browse?collection=90-minutes-well-spent" title="90 Minutes Well Spent" desc="Perfect for a focused evening." backdrop={catalog.slice(5,10).find(i => i.backdrop_path)?.backdrop_path} />
                <CollectionCard to="/browse?collection=things-you-missed" title="Things You Missed" desc="Underrated and overlooked." backdrop={hiddenGems[0]?.backdrop_path} />
                <CollectionCard to="/browse?collection=watch-with-someone" title="Watch With Someone" desc="Great for shared viewing." backdrop={catalog.slice(10,15).find(i => i.backdrop_path)?.backdrop_path} />
              </div>
            </section>

            {/* ——— 11. Footer ——— */}
            <section className="border-t border-[#1e1b14] py-10">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#5c5747]">Streamline. A place to find something worth your evening.</p>
                <Link to="/search" className="text-[13px] text-[#a79f8a] underline decoration-transparent underline-offset-4 transition hover:text-white hover:decoration-[#d3ae46]">
                  Search the full catalog
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function CollectionCard({ to, title, desc, backdrop }) {
  return (
    <Link to={to} className="group relative flex h-40 items-end overflow-hidden rounded-sm p-6 transition hover:scale-[1.02] ring-1 ring-white/[0.04] hover:ring-[#d3ae46]/40">
      {backdrop && (
        <img src={getBackdropUrl(backdrop)} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 blur-[2px]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b09] via-[#0c0b09]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
      <div className="relative z-10">
        <p className="font-serif text-xl text-[#f4efe2] group-hover:text-white">{title}</p>
        <p className="mt-1 text-[12px] text-[#a79f8a]">{desc}</p>
      </div>
    </Link>
  );
}