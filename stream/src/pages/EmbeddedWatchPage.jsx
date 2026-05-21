import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Check, Maximize, Pause, PictureInPicture2, Play, RotateCcw, RotateCw, Server } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Hls from 'hls.js';
import dashjs from 'dashjs';
import { getTvSeasonDetails } from '../services/tmdb';
import { getBackdropUrl } from '../utils/media';
import { formatClock, getEpisodePosition, saveEpisodePosition, saveSeriesEpisode } from '../utils/episodeProgress';

function fillTemplate(template, values) {
  if (!template) {
    return '';
  }

  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

export default function EmbeddedWatchPage() {
  const { tmdbId, season, episode } = useParams();
  const navigate = useNavigate();
  const isTvRoute = Boolean(season && episode);
  const seasonNumber = Number(season || 1);
  const episodeNumber = Number(episode || 1);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const dashRef = useRef(null);
  const touchMeta = useRef({
    startX: 0,
    startY: 0,
    startVolume: 1,
    startBrightness: 1,
    side: 'right',
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [brightness, setBrightness] = useState(1);
  const [isPipActive, setIsPipActive] = useState(false);
  const [gestureLabel, setGestureLabel] = useState('');
  const [seasonData, setSeasonData] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState('');
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [nextCountdown, setNextCountdown] = useState(0);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const sourceButtonRef = useRef(null);
  const sourceMenuRef = useRef(null);

  const lastSavedSecondRef = useRef(-1);

  const movieTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE || '';
  const tvTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_TV || '';

  const providerSources = useMemo(() => {
    const list = [
      {
        id: 'videasy',
        label: 'Videasy',
        movieUrl: () => `https://player.videasy.net/movie/${tmdbId}`,
        tvUrl: () => `https://player.videasy.net/tv/${tmdbId}/${season || 1}/${episode || 1}`,
      },
    ];

    if (movieTemplate && tvTemplate) {
      list.unshift({
        id: 'custom',
        label: 'Custom',
        movieUrl: () => fillTemplate(movieTemplate, { tmdbId }),
        tvUrl: () => fillTemplate(tvTemplate, { tmdbId, season, episode }),
      });
    }

    return list;
  }, [episode, movieTemplate, season, tmdbId, tvTemplate]);

  const [playerSource, setPlayerSource] = useState(() => {
    try {
      const fromQuery = new URLSearchParams(window.location.search).get('source');
      return fromQuery || 'videasy';
    } catch {
      return 'videasy';
    }
  });

  const embedUrl = useMemo(() => {
    const selected = providerSources.find((source) => source.id === playerSource) || providerSources[0];
    if (!selected) {
      return '';
    }

    return isTvRoute ? selected.tvUrl() : selected.movieUrl();
  }, [isTvRoute, playerSource, providerSources]);

  useEffect(() => {
    if (!providerSources.some((source) => source.id === playerSource)) {
      setPlayerSource(providerSources[0]?.id || 'videasy');
    }
  }, [playerSource, providerSources]);

  useEffect(() => {
    const selected = providerSources.find((source) => source.id === playerSource);
    if (!selected) {
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get('source') !== selected.id) {
      url.searchParams.set('source', selected.id);
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    }
  }, [playerSource, providerSources]);

  useEffect(() => {
    if (!showSourceMenu) {
      return;
    }

    const onPointerDown = (event) => {
      const target = event.target;
      if (sourceButtonRef.current?.contains(target) || sourceMenuRef.current?.contains(target)) {
        return;
      }
      setShowSourceMenu(false);
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowSourceMenu(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showSourceMenu]);

  const hasEmbed = embedUrl.startsWith('https://') || embedUrl.startsWith('http://');
  const isSecureEmbed = embedUrl.startsWith('https://');
  const isDirectVideo = /\.(mp4|webm|ogg|m3u8|mpd)(\?.*)?$/i.test(embedUrl);
  const isHlsSource = /\.m3u8(\?.*)?$/i.test(embedUrl);
  const isDashSource = /\.mpd(\?.*)?$/i.test(embedUrl);

  useEffect(() => {
    if (!videoRef.current || !hasEmbed || !isDirectVideo) {
      return;
    }

    const videoElement = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (dashRef.current) {
      dashRef.current.reset();
      dashRef.current = null;
    }

    if (isHlsSource) {
      const canPlayNativeHls = videoElement.canPlayType('application/vnd.apple.mpegurl');
      if (canPlayNativeHls) {
        videoElement.src = embedUrl;
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(embedUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) {
            setGestureLabel('HLS playback error');
          }
        });
        hlsRef.current = hls;
      } else {
        videoElement.src = embedUrl;
      }
    } else if (isDashSource) {
      const player = dashjs.MediaPlayer().create();
      player.initialize(videoElement, embedUrl, false);
      player.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: {
              audio: true,
              video: true,
            },
          },
        },
      });
      dashRef.current = player;
    } else {
      videoElement.src = embedUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (dashRef.current) {
        dashRef.current.reset();
        dashRef.current = null;
      }
    };
  }, [embedUrl, hasEmbed, isDashSource, isDirectVideo, isHlsSource]);

  useEffect(() => {
    let ignore = false;

    async function loadSeason() {
      if (!isTvRoute || !Number.isFinite(seasonNumber) || seasonNumber < 1) {
        setSeasonData(null);
        setSeasonError('');
        return;
      }

      try {
        setSeasonLoading(true);
        setSeasonError('');
        const data = await getTvSeasonDetails(tmdbId, seasonNumber);
        if (!ignore) {
          setSeasonData(data);
        }
      } catch {
        if (!ignore) {
          setSeasonData(null);
          setSeasonError('Could not load season data. You can still enter episode numbers manually.');
        }
      } finally {
        if (!ignore) {
          setSeasonLoading(false);
        }
      }
    }

    loadSeason();
    return () => {
      ignore = true;
    };
  }, [isTvRoute, seasonNumber, tmdbId]);

  const maxEpisodes = seasonData?.episodes?.length || null;
  const episodeCards = seasonData?.episodes || [];

  const goToTvEpisode = (nextSeason, nextEpisode) => {
    const safeSeason = Math.max(1, Math.floor(nextSeason));
    const safeEpisode = Math.max(1, Math.floor(nextEpisode));
    setNextCountdown(0);
    navigate(`/tv/${tmdbId}/${safeSeason}/${safeEpisode}`);
  };

  const goToNextEpisode = () => {
    if (!isTvRoute) {
      return;
    }

    if (maxEpisodes && episodeNumber >= maxEpisodes) {
      goToTvEpisode(seasonNumber + 1, 1);
      return;
    }

    goToTvEpisode(seasonNumber, episodeNumber + 1);
  };

  const goToPreviousEpisode = () => {
    if (!isTvRoute) {
      return;
    }

    if (episodeNumber > 1) {
      goToTvEpisode(seasonNumber, episodeNumber - 1);
    }
  };

  useEffect(() => {
    if (!isTvRoute) {
      return;
    }

    saveSeriesEpisode(tmdbId, seasonNumber, episodeNumber);
  }, [episodeNumber, isTvRoute, seasonNumber, tmdbId]);

  useEffect(() => {
    if (!nextCountdown || !isTvRoute) {
      return;
    }

    const timer = window.setInterval(() => {
      setNextCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          goToNextEpisode();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isTvRoute, nextCountdown]);

  const togglePlay = async () => {
    if (!videoRef.current) {
      return;
    }

    if (videoRef.current.paused) {
      await videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds) => {
    if (!videoRef.current) {
      return;
    }
    const duration = videoRef.current.duration || 0;
    const nextTime = Math.max(0, Math.min((videoRef.current.currentTime || 0) + seconds, duration || Number.MAX_SAFE_INTEGER));
    videoRef.current.currentTime = nextTime;
  };

  const togglePip = async () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) {
      return;
    }

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch {
      setGestureLabel('PiP is not available for this source');
    }
  };

  const lockLandscape = async () => {
    try {
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape');
        setGestureLabel('Orientation locked: landscape');
      }
    } catch {
      setGestureLabel('Orientation lock not supported on this browser');
    }
  };

  const onTouchStart = (event) => {
    if (!videoRef.current || !isDirectVideo) {
      return;
    }
    const firstTouch = event.touches[0];
    const bounds = event.currentTarget.getBoundingClientRect();
    const isLeftSide = firstTouch.clientX - bounds.left < bounds.width / 2;

    touchMeta.current = {
      startX: firstTouch.clientX,
      startY: firstTouch.clientY,
      startVolume: videoRef.current.volume,
      startBrightness: brightness,
      side: isLeftSide ? 'left' : 'right',
    };
  };

  const onTouchMove = (event) => {
    if (!videoRef.current || !isDirectVideo) {
      return;
    }

    const firstTouch = event.touches[0];
    const deltaY = touchMeta.current.startY - firstTouch.clientY;
    const normalized = Math.max(-1, Math.min(deltaY / 260, 1));

    if (touchMeta.current.side === 'right') {
      const nextVolume = Math.max(0, Math.min(touchMeta.current.startVolume + normalized, 1));
      videoRef.current.volume = nextVolume;
      setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
    } else {
      const nextBrightness = Math.max(0.4, Math.min(touchMeta.current.startBrightness + normalized, 1.4));
      setBrightness(nextBrightness);
      setGestureLabel(`Brightness ${Math.round((nextBrightness / 1.4) * 100)}%`);
    }
  };

  const onTouchEnd = () => {
    if (!isDirectVideo) {
      return;
    }
    window.setTimeout(() => setGestureLabel(''), 900);
  };

  const onDoubleTap = (event) => {
    if (!videoRef.current || !isDirectVideo) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const isLeftSide = event.clientX - bounds.left < bounds.width / 2;
    if (isLeftSide) {
      seekBy(-10);
      setGestureLabel('-10s');
    } else {
      seekBy(10);
      setGestureLabel('+10s');
    }
    window.setTimeout(() => setGestureLabel(''), 700);
  };

  const onVideoLoadedMetadata = () => {
    if (!isTvRoute || !isDirectVideo || !videoRef.current) {
      return;
    }

    const savedPosition = getEpisodePosition(tmdbId, seasonNumber, episodeNumber);
    const duration = Number(videoRef.current.duration || 0);
    if (savedPosition > 20 && (!duration || savedPosition < duration - 20)) {
      setResumeSeconds(savedPosition);
    } else {
      setResumeSeconds(0);
    }
  };

  const onVideoTimeUpdate = () => {
    if (!isTvRoute || !isDirectVideo || !videoRef.current) {
      return;
    }

    const currentSecond = Math.floor(videoRef.current.currentTime || 0);
    if (currentSecond - lastSavedSecondRef.current >= 5) {
      lastSavedSecondRef.current = currentSecond;
      saveEpisodePosition(tmdbId, seasonNumber, episodeNumber, currentSecond);
    }
  };

  const onVideoEnded = () => {
    if (isTvRoute && autoplayEnabled) {
      setNextCountdown(8);
    }
  };

  const resumePlayback = () => {
    if (!videoRef.current || !resumeSeconds) {
      return;
    }

    videoRef.current.currentTime = resumeSeconds;
    setResumeSeconds(0);
  };

  useEffect(() => {
    const isTypingTarget = (target) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName;
      return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
    };

    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === 'n' && isTvRoute) {
        event.preventDefault();
        goToNextEpisode();
        return;
      }

      if (event.key === 'p' && isTvRoute) {
        event.preventDefault();
        goToPreviousEpisode();
        return;
      }

      if (!isDirectVideo || !videoRef.current) {
        return;
      }

      if (event.key === ' ' || event.key === 'k' || event.key === 'MediaPlayPause') {
        event.preventDefault();
        togglePlay();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-10);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        seekBy(10);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const nextVolume = Math.min((videoRef.current.volume || 0) + 0.1, 1);
        videoRef.current.volume = nextVolume;
        setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
        window.setTimeout(() => setGestureLabel(''), 600);
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextVolume = Math.max((videoRef.current.volume || 0) - 0.1, 0);
        videoRef.current.volume = nextVolume;
        setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
        window.setTimeout(() => setGestureLabel(''), 600);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isDirectVideo, isTvRoute, seekBy, togglePlay, goToNextEpisode, goToPreviousEpisode]);

  const compactControlClass = 'inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-600/80 bg-stone-900/80 px-3 text-xs font-medium text-stone-100 transition hover:border-amber-300/70 hover:bg-stone-800';
  const compactControlPrimaryClass = 'inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-300 px-3 text-xs font-semibold text-stone-900 transition hover:bg-amber-200';
  const compactIconClass = 'h-3.5 w-3.5';

  return (
    <motion.main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="mb-4 text-sm text-stone-300">
        <Link to="/" className="text-amber-300 underline decoration-amber-400 underline-offset-2">Discover</Link>
        {' / '}
        <span className="text-stone-200">In-site player</span>
      </div>

      <motion.section
        className="rounded-2xl border border-stone-700/70 bg-gradient-to-br from-stone-900/95 via-stone-900/85 to-stone-950/90 p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-100">Streamline Embedded Player</h1>
            <p className="mt-2 text-sm text-stone-300">
              Route: <span className="rounded-md border border-stone-600/70 bg-stone-950/70 px-2 py-1 text-amber-200">/{isTvRoute ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-stone-700/70 bg-stone-950/70 p-2">
            <div className="relative">
              <button
                ref={sourceButtonRef}
                type="button"
                onClick={() => setShowSourceMenu((prev) => !prev)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-stone-100 transition ${
                  showSourceMenu
                    ? 'border-amber-300 bg-amber-300/20'
                    : 'border-stone-600 bg-stone-900 hover:bg-stone-800'
                }`}
                title={`Streaming source: ${providerSources.find((source) => source.id === playerSource)?.label || 'Unknown'}`}
                aria-label="Open source options"
              >
                <Server className="h-4 w-4" />
              </button>
              <AnimatePresence>
                {showSourceMenu && (
                  <motion.div
                    ref={sourceMenuRef}
                    className="absolute right-0 top-10 z-30 min-w-[13rem] rounded-lg border border-stone-700 bg-stone-950/95 p-1.5 shadow-xl"
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  >
                    {providerSources.map((source) => {
                      const active = source.id === playerSource;
                      return (
                        <motion.button
                          key={source.id}
                          type="button"
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.16 }}
                          onClick={() => {
                            setPlayerSource(source.id);
                            setShowSourceMenu(false);
                          }}
                          className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                            active
                              ? 'bg-amber-300/20 text-amber-100'
                              : 'text-stone-200 hover:bg-stone-800'
                          }`}
                        >
                          <span>{source.label}</span>
                          {active && <Check className="h-4 w-4 text-amber-300" />}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-stone-300">
              Source: <span className="font-semibold text-stone-100">{providerSources.find((source) => source.id === playerSource)?.label || 'Unknown'}</span>
            </p>
          </div>
        </div>

        {!isSecureEmbed && hasEmbed && (
          <p className="mt-2 rounded border border-rose-700/60 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
            Non-HTTPS stream URL detected. TV boxes and mobile browsers can block mixed or insecure playback.
          </p>
        )}

        {isTvRoute && (
          <div className="mt-4 rounded-xl border border-stone-700/70 bg-stone-950/70 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-stone-300">
                Season
                <input
                  type="number"
                  min="1"
                  value={seasonNumber}
                  onChange={(event) => goToTvEpisode(Number(event.target.value || 1), episodeNumber)}
                  className="mt-1 h-9 w-24 rounded-md border border-stone-600 bg-stone-900 px-2 text-sm text-stone-100"
                />
              </label>

              <label className="text-xs text-stone-300">
                Episode
                <input
                  type="number"
                  min="1"
                  max={maxEpisodes || undefined}
                  value={episodeNumber}
                  onChange={(event) => goToTvEpisode(seasonNumber, Number(event.target.value || 1))}
                  className="mt-1 h-9 w-24 rounded-md border border-stone-600 bg-stone-900 px-2 text-sm text-stone-100"
                />
              </label>

              <button
                type="button"
                onClick={goToPreviousEpisode}
                disabled={episodeNumber <= 1}
                className={`${compactControlClass} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <RotateCcw className={compactIconClass} />
                Previous Episode
              </button>

              <button
                type="button"
                onClick={goToNextEpisode}
                className={compactControlPrimaryClass}
              >
                <RotateCw className={compactIconClass} />
                Next Episode
              </button>

              <button
                type="button"
                onClick={() => setAutoplayEnabled((prev) => !prev)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium ${
                  autoplayEnabled
                    ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
                    : 'border-stone-600 text-stone-200 hover:bg-stone-800'
                }`}
              >
                Autoplay Next: {autoplayEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <p className="mt-2 text-xs text-stone-300">
              {seasonLoading && 'Loading season episodes...'}
              {!seasonLoading && maxEpisodes && `Season ${seasonNumber} has ${maxEpisodes} episodes.`}
              {!seasonLoading && !maxEpisodes && !seasonError && 'Episode count unavailable for this season.'}
              {seasonError && ` ${seasonError}`}
            </p>

            {!!episodeCards.length && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-stone-700/60 bg-stone-900/70 p-2">
                <div className="flex gap-2 pb-1">
                  {episodeCards.map((item) => {
                    const active = item.episode_number === episodeNumber;
                    return (
                      <button
                        key={item.id || `${seasonNumber}-${item.episode_number}`}
                        type="button"
                        onClick={() => goToTvEpisode(seasonNumber, item.episode_number)}
                        className={`w-52 shrink-0 rounded-lg border p-2 text-left ${
                          active ? 'border-amber-300 bg-amber-300/20' : 'border-stone-600 bg-stone-900/80 hover:bg-stone-800'
                        }`}
                      >
                        <div className="mb-2 h-24 overflow-hidden rounded-md bg-stone-800">
                          {item.still_path ? (
                            <img src={getBackdropUrl(item.still_path)} alt={`Episode ${item.episode_number}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[11px] text-stone-400">No image</div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-100">E{item.episode_number}: {item.name || 'Untitled'}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {hasEmbed ? (
          <div className="mt-4 space-y-4">
            {isDirectVideo ? (
              <>
                <motion.div
                  className="relative aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black"
                  onDoubleClick={onDoubleTap}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  initial={{ opacity: 0.92, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  style={{ filter: `brightness(${brightness})` }}
                >
                  <video
                    ref={videoRef}
                    className="h-full w-full"
                    controls={false}
                    playsInline
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onLoadedMetadata={onVideoLoadedMetadata}
                    onTimeUpdate={onVideoTimeUpdate}
                    onEnded={onVideoEnded}
                  />
                  {gestureLabel && (
                    <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                      {gestureLabel}
                    </div>
                  )}

                  {resumeSeconds > 0 && (
                    <button
                      type="button"
                      onClick={resumePlayback}
                      className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-stone-900"
                    >
                      Resume from {formatClock(resumeSeconds)}
                    </button>
                  )}

                  {nextCountdown > 0 && (
                    <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/80 px-3 py-1 text-xs text-white">
                      Next episode in {nextCountdown}s
                    </div>
                  )}
                </motion.div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className={compactControlPrimaryClass}
                  >
                    {isPlaying ? <Pause className={compactIconClass} /> : <Play className={compactIconClass} />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(-10)}
                    className={compactControlClass}
                  >
                    <RotateCcw className={compactIconClass} />
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(10)}
                    className={compactControlClass}
                  >
                    <RotateCw className={compactIconClass} />
                    +10s
                  </button>
                  <button
                    type="button"
                    onClick={togglePip}
                    className={compactControlClass}
                  >
                    <PictureInPicture2 className={compactIconClass} />
                    {isPipActive ? 'Exit PiP' : 'PiP'}
                  </button>
                  <button
                    type="button"
                    onClick={lockLandscape}
                    className={compactControlClass}
                  >
                    <Maximize className={compactIconClass} />
                    Lock Landscape
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg border border-stone-700/70 bg-stone-950/60 px-3 py-2 text-[11px] text-stone-300">
                    Mobile gestures: double-tap left/right to seek, swipe right side for volume, left side for brightness.
                  </p>
                  <p className="rounded-lg border border-stone-700/70 bg-stone-950/60 px-3 py-2 text-[11px] text-stone-300">
                    Remote shortcuts: Space/K play pause, arrows seek and volume, N/P episode jump.
                  </p>
                </div>
              </>
            ) : (
              <>
                <motion.div
                  className="aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                  initial={{ opacity: 0.92, scale: 0.995 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <iframe
                    src={embedUrl}
                    title="Streamline embedded player"
                    referrerPolicy="no-referrer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </motion.div>
                <p className="rounded-lg border border-stone-700/70 bg-stone-950/60 px-3 py-2 text-[11px] text-stone-300">
                  Streaming source is active.
                </p>
              </>
            )}
            <div className="rounded-lg border border-amber-700/60 bg-amber-950/40 p-3 text-xs text-amber-200">
              Source note: This player is loaded from an external streaming source. Availability and playback can vary by provider.
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-700/60 bg-amber-950/40 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Player source not configured
            </div>
            <p className="mt-2">
              Set an embed URL template in your environment file.
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-200">
              <li>VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE=https://your-provider.com/movie/{'{tmdbId}'}</li>
              <li>VITE_LEGAL_PLAYER_URL_TEMPLATE_TV=https://your-provider.com/tv/{'{tmdbId}'}/{'{season}'}/{'{episode}'}</li>
            </ul>
            <p className="mt-2 text-xs">Tip: connect any provider format you want and keep the same route structure.</p>
          </div>
        )}
      </motion.section>
    </motion.main>
  );
}
