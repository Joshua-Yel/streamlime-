import { useEffect, useMemo, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getTitleDetails, getTitleVideos, getWatchProviders } from '../services/tmdb';
import { formatRating, getBackdropUrl, getPosterUrl } from '../utils/media';
import { saveWatchHistoryEntry } from '../utils/recommendations';

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

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={mediaType === 'tv' ? `/tv/${id}/1/1` : `/movie/${id}`}
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
