import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clapperboard,
  Globe2,
  PlayCircle,
  Sparkles,
  Heart,
  Bookmark,
  Star,
  Users,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getTitleDetails,
  getTitleVideos,
  getTvSeasonDetails,
  getWatchProviders,
  getSimilar,
  getRecommendations,
} from '../services/tmdb';
import {
  formatRating,
  getBackdropUrl,
  getPosterUrl,
  formatRuntime,
  getContentRating,
  getDirectors,
  getMainCast,
  getProfileUrl,
  getMediaType,
} from '../utils/media';
import { getSeriesProgress, saveSeriesEpisode } from '../utils/episodeProgress';
import {
  saveWatchHistoryEntry,
  isFavorite,
  toggleFavorite,
  isInWatchlist,
  toggleWatchlist,
} from '../utils/recommendations';
import Button from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import MovieCard from '../components/ui/MovieCard';

function ProviderList({ title, providers = [] }) {
  if (!providers?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-200/90">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {providers.map((provider) => (
          <span
            key={provider.provider_id}
            className="rounded-full border border-stone-600 bg-stone-900/80 px-2.5 py-1 text-xs text-stone-200"
          >
            {provider.provider_name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function TitleDetailsPage() {
  const { mediaType, id } = useParams();

  const [details, setDetails] = useState(null);
  const [videos, setVideos] = useState([]);
  const [providersByRegion, setProvidersByRegion] = useState({});
  const [similar, setSimilar] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState('');
  const [resumeEpisode, setResumeEpisode] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(id, mediaType));
    setWatchlisted(isInWatchlist(id, mediaType));
  }, [id, mediaType]);

  useEffect(() => {
    let ignore = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError('');

        const [detailsData, videosData, providersData, similarData, recsData] =
          await Promise.all([
            getTitleDetails(mediaType, id),
            getTitleVideos(mediaType, id),
            getWatchProviders(mediaType, id),
            getSimilar(mediaType, id).catch(() => []),
            getRecommendations(mediaType, id).catch(() => []),
          ]);

        if (ignore) return;

        setDetails(detailsData);
        setVideos(videosData);
        setProvidersByRegion(providersData);
        setSimilar(similarData.slice(0, 12));
        setRecs(recsData.slice(0, 12));
      } catch {
        if (!ignore) {
          setError('Could not load this title. Please try a different one.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      ignore = true;
    };
  }, [mediaType, id]);

  const trailer = useMemo(() => {
    return (
      videos.find(
        (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official,
      ) ||
      videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
      null
    );
  }, [videos]);

  const regionPriority = ['IN', 'US', 'GB', 'CA', 'AU'];
  const activeRegion = useMemo(() => {
    return (
      regionPriority.find((code) => providersByRegion[code]) ||
      Object.keys(providersByRegion)[0]
    );
  }, [providersByRegion]);

  const providerInfo = activeRegion ? providersByRegion[activeRegion] : null;
  const title = details?.title || details?.name;
  const releaseYear = (details?.release_date || details?.first_air_date || '').slice(0, 4);
  const languageCode = details?.original_language?.toUpperCase();
  const runtimeLabel = details?.runtime
    ? formatRuntime(details.runtime)
    : details?.episode_run_time?.[0]
      ? formatRuntime(details.episode_run_time[0])
      : null;
  const contentRating = details ? getContentRating(details) : null;
  const directors = details?.credits ? getDirectors(details.credits) : [];
  const cast = details?.credits ? getMainCast(details.credits, 10) : [];

  const seasonOptions = useMemo(() => {
    if (mediaType !== 'tv') return [];
    return (details?.seasons || [])
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [details?.seasons, mediaType]);

  const episodes = seasonDetails?.episodes || [];

  useEffect(() => {
    if (!details) return;
    saveWatchHistoryEntry({
      id: Number(id),
      mediaType,
      title: details.title || details.name || 'Untitled',
      poster_path: details.poster_path,
      genre_ids: (details.genres || []).map((g) => g.id),
      vote_average: details.vote_average,
      watchedAt: Date.now(),
      watchHour: new Date().getHours(),
    });
  }, [details, id, mediaType]);

  useEffect(() => {
    if (mediaType !== 'tv' || !details) return;

    const defaultSeason =
      details.seasons?.find((s) => s.season_number > 0)?.season_number || 1;
    const progress = getSeriesProgress(id);
    const resumeSeason = progress?.lastSeason || defaultSeason;
    const resumeEp = progress?.lastEpisode || 1;

    setResumeEpisode(
      progress?.lastSeason && progress?.lastEpisode
        ? { season: progress.lastSeason, episode: progress.lastEpisode }
        : null,
    );
    setSelectedSeason(Math.max(1, Number(resumeSeason) || defaultSeason));
    setSelectedEpisode(Math.max(1, Number(resumeEp) || 1));
  }, [details, mediaType, id]);

  useEffect(() => {
    let ignore = false;

    async function loadSeasonDetails() {
      if (mediaType !== 'tv') {
        setSeasonDetails(null);
        setSeasonError('');
        return;
      }

      try {
        setSeasonLoading(true);
        setSeasonError('');
        const data = await getTvSeasonDetails(id, selectedSeason);
        if (!ignore) {
          setSeasonDetails(data);
          const maxEpisode = data?.episodes?.length || 1;
          setSelectedEpisode((current) => Math.min(current, maxEpisode));
        }
      } catch {
        if (!ignore) {
          setSeasonDetails(null);
          setSeasonError('Could not load episodes for this season.');
        }
      } finally {
        if (!ignore) setSeasonLoading(false);
      }
    }

    loadSeasonDetails();
    return () => {
      ignore = true;
    };
  }, [id, mediaType, selectedSeason]);

  const handleFavorite = () => {
    const result = toggleFavorite({
      id: Number(id),
      mediaType,
      title,
      poster_path: details?.poster_path,
      vote_average: details?.vote_average,
    });
    setFavorited(result.added);
  };

  const handleWatchlist = () => {
    const result = toggleWatchlist({
      id: Number(id),
      mediaType,
      title,
      poster_path: details?.poster_path,
      vote_average: details?.vote_average,
    });
    setWatchlisted(result.added);
  };

  return (
    <motion.main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <p className="mb-4 text-sm text-stone-400">
        <Link
          to="/"
          className="text-amber-300 underline decoration-amber-400/60 underline-offset-2 hover:text-amber-200"
        >
          Discover
        </Link>
        {' / '}
        <span className="text-stone-300 capitalize">{mediaType}</span>
      </p>

      {loading && (
        <div className="space-y-4">
          <div className="h-64 animate-pulse rounded-2xl bg-stone-800" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-stone-800" />
        </div>
      )}
      {error && (
        <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}

      {!loading && !error && details && (
        <>
          {/* Hero */}
          <motion.section
            className="relative overflow-hidden rounded-2xl border border-stone-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {details.backdrop_path && (
              <img
                src={getBackdropUrl(details.backdrop_path)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-35"
              />
            )}
            <div className="relative z-10 grid gap-5 bg-gradient-to-br from-black/90 via-black/70 to-black/75 p-5 sm:grid-cols-[220px_1fr] sm:p-7">
              <div className="overflow-hidden rounded-xl border border-stone-700/70 bg-stone-800 shadow-lg">
                {details.poster_path ? (
                  <img
                    src={getPosterUrl(details.poster_path)}
                    alt={`Poster for ${title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[300px] items-center justify-center p-6 text-sm text-stone-400">
                    No poster
                  </div>
                )}
              </div>

              <div className="space-y-4 min-w-0">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {contentRating && (
                      <span className="rounded border border-stone-500 px-1.5 py-0.5 text-[11px] font-semibold text-stone-200">
                        {contentRating}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                      <Sparkles className="h-3 w-3" />
                      {mediaType === 'tv' ? 'Series' : 'Film'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {title}
                  </h1>
                  {details.tagline && (
                    <p className="text-sm italic text-stone-400">{details.tagline}</p>
                  )}
                  <p className="max-w-3xl text-sm leading-relaxed text-stone-200/95">
                    {details.overview || 'No overview available.'}
                  </p>
                </div>

                {/* Meta chips */}
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                  <div className="rounded-lg border border-stone-600/70 bg-black/30 px-3 py-2 text-xs">
                    <p className="text-[10px] uppercase tracking-wide text-stone-500">Rating</p>
                    <p className="mt-0.5 font-semibold text-amber-200 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {formatRating(details.vote_average)}
                      {details.vote_count > 0 && (
                        <span className="text-stone-500 font-normal">
                          ({details.vote_count > 999
                            ? `${(details.vote_count / 1000).toFixed(1)}k`
                            : details.vote_count})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-600/70 bg-black/30 px-3 py-2 text-xs">
                    <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-stone-500">
                      <CalendarDays className="h-3 w-3" /> Year
                    </p>
                    <p className="mt-0.5 font-semibold text-stone-100">{releaseYear || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-600/70 bg-black/30 px-3 py-2 text-xs">
                    <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-stone-500">
                      <Clapperboard className="h-3 w-3" /> Runtime
                    </p>
                    <p className="mt-0.5 font-semibold text-stone-100">{runtimeLabel || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-600/70 bg-black/30 px-3 py-2 text-xs">
                    <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-stone-500">
                      <Globe2 className="h-3 w-3" /> Language
                    </p>
                    <p className="mt-0.5 font-semibold text-stone-100">{languageCode || 'N/A'}</p>
                  </div>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5">
                  {(details.genres || []).map((genre) => (
                    <Link
                      key={genre.id}
                      to={`/browse?type=${mediaType}&genre=${genre.id}`}
                      className="rounded-full border border-stone-600/80 bg-black/30 px-2.5 py-1 text-xs text-stone-300 hover:border-amber-300/50 hover:text-amber-100 transition"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>

                {/* Directors */}
                {!!directors.length && (
                  <p className="text-xs text-stone-400">
                    Directed by{' '}
                    <span className="text-stone-200">
                      {directors.map((d) => d.name).join(', ')}
                    </span>
                  </p>
                )}

                {/* TV episode picker */}
                {mediaType === 'tv' && (
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 via-stone-950/40 to-stone-950/50 p-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                      Episode picker
                    </p>

                    {resumeEpisode && (
                      <div className="mt-2 rounded-md border border-emerald-500/35 bg-emerald-900/20 px-2.5 py-1.5 text-xs text-emerald-200">
                        Continue from S{resumeEpisode.season} E{resumeEpisode.episode}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {seasonOptions.map((seasonItem) => {
                        const isActive = selectedSeason === seasonItem.season_number;
                        return (
                          <button
                            key={seasonItem.id || seasonItem.season_number}
                            type="button"
                            onClick={() => {
                              setSelectedSeason(seasonItem.season_number);
                              setSelectedEpisode(1);
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              isActive
                                ? 'bg-amber-300 text-stone-900'
                                : 'border border-stone-600 text-stone-300 hover:bg-stone-800'
                            }`}
                          >
                            Season {seasonItem.season_number}
                            {seasonItem.episode_count != null && (
                              <span className="ml-1 opacity-60">({seasonItem.episode_count})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {seasonLoading && (
                      <p className="mt-3 text-xs text-stone-400">Loading episodes…</p>
                    )}
                    {seasonError && (
                      <p className="mt-3 text-xs text-rose-300">{seasonError}</p>
                    )}

                    {!seasonLoading && !seasonError && !!episodes.length && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-700/50 bg-stone-950/40 p-2">
                        <div className="flex gap-2 pb-1">
                          {episodes.map((ep) => {
                            const isActive = selectedEpisode === ep.episode_number;
                            return (
                              <button
                                key={ep.id || `${selectedSeason}-${ep.episode_number}`}
                                type="button"
                                onClick={() => setSelectedEpisode(ep.episode_number)}
                                className={`w-48 shrink-0 rounded-lg border p-2 text-left transition ${
                                  isActive
                                    ? 'border-amber-300 bg-amber-300/15'
                                    : 'border-stone-600 bg-stone-900/70 hover:bg-stone-800'
                                }`}
                              >
                                <div className="mb-1.5 h-20 overflow-hidden rounded-md bg-stone-800">
                                  {ep.still_path ? (
                                    <img
                                      src={getBackdropUrl(ep.still_path, 'w300')}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                                      No still
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-stone-100 line-clamp-1">
                                  E{ep.episode_number}: {ep.name || 'Untitled'}
                                </p>
                                {ep.runtime ? (
                                  <p className="mt-0.5 text-[10px] text-amber-200/80">
                                    {formatRuntime(ep.runtime)}
                                  </p>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {resumeEpisode && mediaType === 'tv' && (
                    <Link
                      to={`/tv/${id}/${resumeEpisode.season}/${resumeEpisode.episode}`}
                      className="inline-flex"
                    >
                      <Button
                        asChild
                        variant="success"
                        size="default"
                        className="gap-2 font-semibold"
                      >
                        Resume S{resumeEpisode.season}:E{resumeEpisode.episode}
                      </Button>
                    </Link>
                  )}
                  <Link
                    to={
                      mediaType === 'tv'
                        ? `/tv/${id}/${selectedSeason}/${selectedEpisode}`
                        : `/movie/${id}`
                    }
                    onClick={() => {
                      if (mediaType === 'tv') {
                        saveSeriesEpisode(id, selectedSeason, selectedEpisode);
                      }
                    }}
                    className="inline-flex"
                  >
                    <Button asChild size="lg" className="gap-2 shadow-[0_0_0_2px_rgba(252,211,77,0.18)]">
                      Open player
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition ${
                      favorited
                        ? 'border-rose-400/60 bg-rose-950/40 text-rose-200'
                        : 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    }`}
                    title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
                    {favorited ? 'Favorited' : 'Favorite'}
                  </button>

                  <button
                    type="button"
                    onClick={handleWatchlist}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm transition ${
                      watchlisted
                        ? 'border-sky-400/60 bg-sky-950/40 text-sky-200'
                        : 'border-stone-600 text-stone-300 hover:bg-stone-800'
                    }`}
                    title={watchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                  >
                    <Bookmark className={`h-4 w-4 ${watchlisted ? 'fill-current' : ''}`} />
                    {watchlisted ? 'Listed' : 'Watchlist'}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Cast */}
          {!!cast.length && (
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-100">
                <Users className="h-5 w-5 text-amber-300" />
                Cast
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {cast.map((person) => (
                  <div
                    key={person.id}
                    className="w-28 shrink-0 text-center"
                  >
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border border-stone-700 bg-stone-800">
                      {person.profile_path ? (
                        <img
                          src={getProfileUrl(person.profile_path)}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-stone-500">
                          —
                        </div>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-stone-200 line-clamp-1">
                      {person.name}
                    </p>
                    <p className="text-[10px] text-stone-500 line-clamp-1">
                      {person.character}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trailer + providers */}
          <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <Card className="border-stone-700/70 bg-stone-900/60">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-stone-100">
                  <PlayCircle className="h-5 w-5 text-amber-300" />
                  Trailer
                </h2>
                {trailer ? (
                  <div className="aspect-video overflow-hidden rounded-xl border border-stone-700/60">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}`}
                      title={`${title} trailer`}
                      referrerPolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <p className="rounded-lg border border-stone-700/70 bg-stone-950/50 p-3 text-sm text-stone-400">
                    No trailer found.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-stone-700/70 bg-stone-900/60">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-stone-100">
                  Where to watch
                  {activeRegion ? (
                    <span className="ml-1.5 text-sm font-normal text-stone-500">
                      ({activeRegion})
                    </span>
                  ) : null}
                </h2>
                {providerInfo ? (
                  <div className="space-y-3">
                    <ProviderList title="Stream" providers={providerInfo.flatrate} />
                    <ProviderList title="Rent" providers={providerInfo.rent} />
                    <ProviderList title="Buy" providers={providerInfo.buy} />
                    {!providerInfo.flatrate?.length &&
                      !providerInfo.rent?.length &&
                      !providerInfo.buy?.length && (
                        <p className="text-sm text-stone-400">
                          No providers listed for this region.
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400">
                    Provider data unavailable for this title.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Similar / recommendations */}
          {(!!recs.length || !!similar.length) && (
            <section className="mt-10 space-y-8">
              {!!recs.length && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-stone-100">
                    You might also like
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {recs.map((item) => (
                      <MovieCard
                        item={{ ...item, media_type: mediaType }}
                        key={`rec-${item.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {!!similar.length && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-stone-100">Similar</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {similar.map((item) => (
                      <MovieCard
                        item={{ ...item, media_type: mediaType }}
                        key={`sim-${item.id}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </motion.main>
  );
}