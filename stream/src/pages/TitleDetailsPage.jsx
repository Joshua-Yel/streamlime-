import { useEffect, useMemo, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getTitleDetails, getTitleVideos, getTvSeasonDetails, getWatchProviders } from '../services/tmdb';
import { formatRating, getBackdropUrl, getPosterUrl } from '../utils/media';
import { getSeriesProgress, saveSeriesEpisode } from '../utils/episodeProgress';
import { saveWatchHistoryEntry } from '../utils/recommendations';

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
    <div className="space-y-2 rounded-lg border border-stone-700/70 bg-stone-950/70 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-200">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <span key={provider.provider_id} className="rounded-full border border-stone-500 bg-stone-900 px-3 py-1 text-xs text-stone-100">
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
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p className="mb-4 text-sm text-stone-300">
        <Link to="/" className="text-amber-300 underline decoration-amber-400 underline-offset-2">Discover</Link>
        {' / '}
        <span className="text-stone-200">{mediaType}</span>
      </p>

      {loading && <p className="text-sm text-stone-300">Loading title details...</p>}
      {error && <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">{error}</p>}

      {!loading && !error && details && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-stone-700/70">
            {details.backdrop_path && (
              <img
                src={getBackdropUrl(details.backdrop_path)}
                alt={`Backdrop for ${title}`}
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}
            <div className="relative z-10 grid gap-4 bg-gradient-to-br from-black/90 via-black/70 to-black/75 p-5 sm:grid-cols-[220px_1fr] sm:p-7">
              <div className="overflow-hidden rounded-xl border border-stone-700/70 bg-stone-800">
                {details.poster_path ? (
                  <img src={getPosterUrl(details.poster_path)} alt={`Poster for ${title}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-[320px] items-center justify-center p-6 text-sm text-stone-300">No poster available</div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
                  <p className="mt-2 text-sm text-stone-200">{details.overview || 'No overview available.'}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-stone-200">
                  <span className="rounded-full border border-stone-500 bg-black/30 px-3 py-1">TMDB Rating: {formatRating(details.vote_average)}</span>
                  {(details.genres || []).slice(0, 4).map((genre) => (
                    <span key={genre.id} className="rounded-full border border-stone-500 bg-black/30 px-3 py-1">{genre.name}</span>
                  ))}
                </div>

                {mediaType === 'tv' && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-amber-200">Episode Picker</p>
                    <p className="mt-1 text-xs text-stone-300">Choose a season, then tap an episode card.</p>

                    {resumeEpisode && (
                      <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-900/20 p-2 text-xs text-emerald-200">
                        Continue from S{resumeEpisode.season} E{resumeEpisode.episode}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
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
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              isActive
                                ? 'border-amber-200 bg-amber-300 text-stone-900'
                                : 'border-stone-500 bg-stone-900 text-stone-200 hover:bg-stone-800'
                            }`}
                          >
                            Season {seasonItem.season_number}
                          </button>
                        );
                      })}
                    </div>

                    {seasonLoading && <p className="mt-3 text-xs text-stone-300">Loading episodes...</p>}
                    {seasonError && <p className="mt-3 text-xs text-rose-300">{seasonError}</p>}

                    {!seasonLoading && !seasonError && !!episodes.length && (
                      <div className="mt-3 overflow-x-auto rounded-lg border border-stone-700/60 bg-stone-950/40 p-2">
                        <div className="flex gap-2 pb-1">
                          {episodes.map((episodeItem) => {
                            const isActiveEpisode = selectedEpisode === episodeItem.episode_number;
                            return (
                              <button
                                key={episodeItem.id || `${selectedSeason}-${episodeItem.episode_number}`}
                                type="button"
                                onClick={() => setSelectedEpisode(episodeItem.episode_number)}
                                className={`w-56 shrink-0 rounded-lg border p-2 text-left transition ${
                                  isActiveEpisode
                                    ? 'border-amber-300 bg-amber-300/20'
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
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {resumeEpisode && mediaType === 'tv' && (
                    <Link
                      to={`/tv/${id}/${resumeEpisode.season}/${resumeEpisode.episode}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-300 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-emerald-200"
                    >
                      Resume S{resumeEpisode.season}:E{resumeEpisode.episode}
                    </Link>
                  )}
                  <Link
                    to={mediaType === 'tv' ? `/tv/${id}/${selectedSeason}/${selectedEpisode}` : `/movie/${id}`}
                    onClick={() => {
                      if (mediaType === 'tv') {
                        saveSeriesEpisode(id, selectedSeason, selectedEpisode);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-300 px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-[0_0_0_3px_rgba(252,211,77,0.2)] transition hover:bg-amber-200"
                  >
                    Open In-Site Player
                    <PlayCircle className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-3 rounded-2xl border border-stone-700/70 bg-stone-900/80 p-4 sm:p-5">
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
            </div>

            <aside className="space-y-3 rounded-2xl border border-stone-700/70 bg-stone-900/80 p-4 sm:p-5">
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
            </aside>
          </section>
        </>
      )}
    </main>
  );
}
