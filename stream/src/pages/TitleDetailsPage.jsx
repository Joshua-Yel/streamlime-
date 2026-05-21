import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clapperboard, Globe2, PlayCircle, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTitleDetails, getTitleVideos, getTvSeasonDetails, getWatchProviders } from '../services/tmdb';
import { formatRating, getBackdropUrl, getPosterUrl } from '../utils/media';
import { getSeriesProgress, saveSeriesEpisode } from '../utils/episodeProgress';
import { saveWatchHistoryEntry } from '../utils/recommendations';
import Button from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

function formatRuntime(minutes) {
  if (!minutes) {
    return '';
  }

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) {
    return `${mins}m`;
  }
  return `${hrs}h ${mins}m`;
}

function ProviderList({ title, providers = [] }) {
  if (!providers.length) {
    return null;
  }

  return (
    <Card className="space-y-2 bg-stone-950/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-200">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span key={provider.provider_id} className="rounded-full border border-stone-500 bg-stone-900 px-3 py-1 text-xs text-stone-100">
            {provider.provider_name}
          </span>
        ))}
      </div>
    </Card>
  );
}

export default function TitleDetailsPage() {
  const { mediaType, id } = useParams();

  const [details, setDetails] = useState(null);
  const [videos, setVideos] = useState([]);
  const [providersByRegion, setProvidersByRegion] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState('');
  const [resumeEpisode, setResumeEpisode] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError('');

        const [detailsData, videosData, providersData] = await Promise.all([
          getTitleDetails(mediaType, id),
          getTitleVideos(mediaType, id),
          getWatchProviders(mediaType, id),
        ]);

        if (ignore) {
          return;
        }

        setDetails(detailsData);
        setVideos(videosData);
        setProvidersByRegion(providersData);
      } catch (err) {
        if (!ignore) {
          setError('Could not load this title. Please try a different one.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDetails();
    return () => {
      ignore = true;
    };
  }, [mediaType, id]);

  const trailer = useMemo(() => {
    return (
      videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official) ||
      videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ||
      null
    );
  }, [videos]);

  const regionPriority = ['IN', 'US', 'GB'];
  const activeRegion = useMemo(() => {
    return regionPriority.find((regionCode) => providersByRegion[regionCode]) || Object.keys(providersByRegion)[0];
  }, [providersByRegion]);

  const providerInfo = activeRegion ? providersByRegion[activeRegion] : null;
  const title = details?.title || details?.name;
  const releaseYear = (details?.release_date || details?.first_air_date || '').slice(0, 4);
  const languageCode = details?.original_language?.toUpperCase();
  const runtimeLabel = details?.runtime ? formatRuntime(details.runtime) : null;
  const seasonOptions = useMemo(() => {
    if (mediaType !== 'tv') {
      return [];
    }

    return (details?.seasons || [])
      .filter((seasonItem) => seasonItem.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);
  }, [details?.seasons, mediaType]);

  const episodes = seasonDetails?.episodes || [];

  useEffect(() => {
    if (!details) {
      return;
    }

    saveWatchHistoryEntry({
      id: Number(id),
      mediaType,
      title: details.title || details.name || 'Untitled',
      genre_ids: (details.genres || []).map((genre) => genre.id),
      watchedAt: Date.now(),
      watchHour: new Date().getHours(),
    });
  }, [details, id, mediaType]);

  useEffect(() => {
    if (mediaType !== 'tv' || !details) {
      return;
    }

    const defaultSeason = details.seasons?.find((seasonItem) => seasonItem.season_number > 0)?.season_number || 1;
    const progress = getSeriesProgress(id);
    const resumeSeason = progress?.lastSeason || defaultSeason;
    const resumeEp = progress?.lastEpisode || 1;

    setResumeEpisode(progress?.lastSeason && progress?.lastEpisode ? {
      season: progress.lastSeason,
      episode: progress.lastEpisode,
    } : null);
    setSelectedSeason(Math.max(1, Number(resumeSeason) || defaultSeason));
    setSelectedEpisode(Math.max(1, Number(resumeEp) || 1));
  }, [details, mediaType]);

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
        if (!ignore) {
          setSeasonLoading(false);
        }
      }
    }

    loadSeasonDetails();
    return () => {
      ignore = true;
    };
  }, [id, mediaType, selectedSeason]);

  return (
    <motion.main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <p className="mb-4 text-sm text-stone-300">
        <Link to="/" className="text-amber-300 underline decoration-amber-400 underline-offset-2">Discover</Link>
        {' / '}
        <span className="text-stone-200">{mediaType}</span>
      </p>

      {loading && <p className="text-sm text-stone-300">Loading title details...</p>}
      {error && <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}

      {!loading && !error && details && (
        <>
          <motion.section
            className="relative overflow-hidden rounded-2xl border border-stone-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {details.backdrop_path && (
              <img
                src={getBackdropUrl(details.backdrop_path)}
                alt={`Backdrop for ${title}`}
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}
            <div className="relative z-10 grid gap-5 bg-gradient-to-br from-black/88 via-black/68 to-black/74 p-5 sm:grid-cols-[240px_1fr] sm:p-7">
              <div className="overflow-hidden rounded-xl border border-stone-700/70 bg-stone-800 shadow-[0_18px_36px_rgba(0,0,0,0.35)]">
                {details.poster_path ? (
                  <img src={getPosterUrl(details.poster_path)} alt={`Poster for ${title}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center p-6 text-sm text-stone-300">No poster available</div>
                )}
              </div>

              <div className="space-y-5 min-w-0">
                <div className="space-y-3">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/45 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Premium Details
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.6rem]">{title}</h1>
                  <p className="max-w-3xl text-sm leading-relaxed text-stone-200/95 sm:text-[15px]">{details.overview || 'No overview available.'}</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-stone-600/75 bg-black/35 px-3 py-2 text-xs text-stone-200">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-stone-400">Rating</p>
                    <p className="mt-1 font-semibold text-amber-200">{formatRating(details.vote_average)}</p>
                  </div>
                  <div className="rounded-lg border border-stone-600/75 bg-black/35 px-3 py-2 text-xs text-stone-200">
                    <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-stone-400"><CalendarDays className="h-3 w-3" /> Year</p>
                    <p className="mt-1 font-semibold text-stone-100">{releaseYear || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-600/75 bg-black/35 px-3 py-2 text-xs text-stone-200">
                    <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-stone-400"><Clapperboard className="h-3 w-3" /> Runtime</p>
                    <p className="mt-1 font-semibold text-stone-100">{runtimeLabel || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-stone-600/75 bg-black/35 px-3 py-2 text-xs text-stone-200">
                    <p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-stone-400"><Globe2 className="h-3 w-3" /> Language</p>
                    <p className="mt-1 font-semibold text-stone-100">{languageCode || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-stone-200/95">
                  {(details.genres || []).slice(0, 4).map((genre) => (
                    <span key={genre.id} className="rounded-full border border-stone-500/85 bg-black/35 px-3 py-1">{genre.name}</span>
                  ))}
                </div>

                {mediaType === 'tv' && (
                  <div className="rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-950/28 via-stone-950/44 to-stone-950/50 p-3.5 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">Episode Picker</p>
                    <p className="mt-1 text-xs text-stone-300">Choose season and episode below, then open player.</p>

                    {resumeEpisode && (
                      <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-900/20 p-2 text-xs text-emerald-200">
                        Continue from S{resumeEpisode.season} E{resumeEpisode.episode}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {seasonOptions.map((seasonItem) => {
                        const isActive = selectedSeason === seasonItem.season_number;
                        return (
                          <Button
                            key={seasonItem.id || seasonItem.season_number}
                            type="button"
                            onClick={() => {
                              setSelectedSeason(seasonItem.season_number);
                              setSelectedEpisode(1);
                            }}
                            size="sm"
                            variant={isActive ? 'default' : 'secondary'}
                            className={`rounded-full ${
                              isActive
                                ? 'border-amber-200'
                                : 'border-stone-500 bg-stone-900 text-stone-200'
                            }`}
                          >
                            Season {seasonItem.season_number}
                          </Button>
                        );
                      })}
                    </div>

                    {seasonLoading && <p className="mt-3 text-xs text-stone-300">Loading episodes...</p>}
                    {seasonError && <p className="mt-3 text-xs text-rose-300">{seasonError}</p>}

                    {!seasonLoading && !seasonError && !!episodes.length && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-stone-700/60 bg-stone-950/40">
                        <div className="overflow-x-auto overscroll-x-contain px-2 pb-2 pt-2">
                        <div className="grid grid-flow-col auto-cols-[minmax(13.5rem,14.5rem)] gap-2 pb-1 sm:auto-cols-[minmax(14rem,15rem)]">
                          {episodes.map((episodeItem) => {
                            const isActiveEpisode = selectedEpisode === episodeItem.episode_number;
                            return (
                              <motion.button
                                key={episodeItem.id || `${selectedSeason}-${episodeItem.episode_number}`}
                                type="button"
                                onClick={() => setSelectedEpisode(episodeItem.episode_number)}
                                whileHover={{ y: -2, scale: 1.01 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className={`min-w-0 rounded-lg border p-2 text-left transition ${
                                  isActiveEpisode
                                    ? 'border-amber-300 bg-amber-300/20 shadow-[0_0_0_1px_rgba(252,211,77,0.25)]'
                                    : 'border-stone-600 bg-stone-900/80 hover:bg-stone-800'
                                }`}
                              >
                                <div className="mb-2 h-24 overflow-hidden rounded-md bg-stone-800">
                                  {episodeItem.still_path ? (
                                    <img
                                      src={getBackdropUrl(episodeItem.still_path)}
                                      alt={`Still for episode ${episodeItem.episode_number}`}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-[11px] text-stone-400">No preview image</div>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-stone-100">E{episodeItem.episode_number}: {episodeItem.name || 'Untitled Episode'}</p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-stone-300">{episodeItem.overview || 'No episode description available.'}</p>
                                {episodeItem.runtime ? (
                                  <p className="mt-1 text-[11px] text-amber-200">{formatRuntime(episodeItem.runtime)}</p>
                                ) : null}
                              </motion.button>
                            );
                          })}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {resumeEpisode && mediaType === 'tv' && (
                    <Link
                      to={`/tv/${id}/${resumeEpisode.season}/${resumeEpisode.episode}`}
                      className="inline-flex"
                    >
                      <Button asChild variant="success" size="default" className="gap-2 font-semibold shadow-[0_0_0_2px_rgba(16,185,129,0.22)]">
                        Resume S{resumeEpisode.season}:E{resumeEpisode.episode}
                      </Button>
                    </Link>
                  )}
                  <Link
                    to={mediaType === 'tv' ? `/tv/${id}/${selectedSeason}/${selectedEpisode}` : `/movie/${id}`}
                    onClick={() => {
                      if (mediaType === 'tv') {
                        saveSeriesEpisode(id, selectedSeason, selectedEpisode);
                      }
                    }}
                    className="inline-flex"
                  >
                    <Button asChild size="lg" className="gap-2 shadow-[0_0_0_3px_rgba(252,211,77,0.2)]">
                      Open In-Site Player
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <Card className="space-y-3 bg-gradient-to-br from-stone-900/90 to-stone-950/85">
              <CardContent className="space-y-3 p-4 sm:p-5">
              <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-stone-100">
                <PlayCircle className="h-5 w-5 text-amber-300" />
                Official Trailer
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
                <p className="rounded-lg border border-stone-700/70 bg-stone-950/50 p-3 text-sm text-stone-200">
                  No official trailer was found for this title.
                </p>
              )}
              </CardContent>
            </Card>

            <Card className="space-y-3 bg-gradient-to-br from-stone-900/90 to-stone-950/85">
              <CardContent className="space-y-3 p-4 sm:p-5">
              <h2 className="text-lg font-semibold text-stone-100">Watch Providers {activeRegion ? `(${activeRegion})` : ''}</h2>

              {providerInfo ? (
                <>
                  <ProviderList title="Subscription" providers={providerInfo.flatrate} />
                  <ProviderList title="Rent" providers={providerInfo.rent} />
                  <ProviderList title="Buy" providers={providerInfo.buy} />
                </>
              ) : (
                <p className="rounded-lg border border-stone-700/70 bg-stone-950/50 p-3 text-sm text-stone-200">
                  Provider details are unavailable for this title in TMDB.
                </p>
              )}
              </CardContent>
            </Card>
          </motion.section>
        </>
      )}
    </motion.main>
  );
}
