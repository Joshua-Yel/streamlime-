import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, Maximize, Pause, PictureInPicture2, Play, RotateCcw, RotateCw } from 'lucide-react';

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
  const isTvRoute = Boolean(season && episode);
  const videoRef = useRef(null);
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

  const movieTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE || '';
  const tvTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_TV || '';

  const embedUrl = useMemo(() => {
    return isTvRoute
      ? fillTemplate(tvTemplate, { tmdbId, season, episode })
      : fillTemplate(movieTemplate, { tmdbId });
  }, [episode, isTvRoute, movieTemplate, season, tmdbId, tvTemplate]);

  const hasEmbed = embedUrl.startsWith('https://') || embedUrl.startsWith('http://');
  const isDirectVideo = /\.(mp4|webm|ogg|m3u8)(\?.*)?$/i.test(embedUrl);

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

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4 text-sm text-stone-300">
        <Link to="/" className="text-amber-300 underline decoration-amber-400 underline-offset-2">Discover</Link>
        {' / '}
        <span className="text-stone-200">In-site player</span>
      </div>

      <section className="rounded-2xl border border-stone-700/70 bg-stone-900/80 p-4 sm:p-6">
        <h1 className="text-2xl font-semibold text-stone-100">Streamline Embedded Player</h1>
        <p className="mt-2 text-sm text-stone-300">
          Route: <span className="text-amber-200">/{isTvRoute ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`}</span>
        </p>

        {hasEmbed ? (
          <div className="mt-4 space-y-3">
            {isDirectVideo ? (
              <>
                <div
                  className="relative aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black"
                  onDoubleClick={onDoubleTap}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ filter: `brightness(${brightness})` }}
                >
                  <video
                    ref={videoRef}
                    src={embedUrl}
                    className="h-full w-full"
                    controls={false}
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {gestureLabel && (
                    <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                      {gestureLabel}
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="inline-flex items-center gap-2 rounded-md bg-amber-300 px-3 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(-10)}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-600 px-3 py-2 text-sm text-stone-100 hover:bg-stone-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    -10s
                  </button>
                  <button
                    type="button"
                    onClick={() => seekBy(10)}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-600 px-3 py-2 text-sm text-stone-100 hover:bg-stone-800"
                  >
                    <RotateCw className="h-4 w-4" />
                    +10s
                  </button>
                  <button
                    type="button"
                    onClick={togglePip}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-600 px-3 py-2 text-sm text-stone-100 hover:bg-stone-800"
                  >
                    <PictureInPicture2 className="h-4 w-4" />
                    {isPipActive ? 'Exit PiP' : 'PiP'}
                  </button>
                  <button
                    type="button"
                    onClick={lockLandscape}
                    className="inline-flex items-center gap-2 rounded-md border border-stone-600 px-3 py-2 text-sm text-stone-100 hover:bg-stone-800"
                  >
                    <Maximize className="h-4 w-4" />
                    Lock Landscape
                  </button>
                </div>
                <p className="text-xs text-stone-300">
                  Mobile gestures: double-tap left/right to seek, swipe up/down right side for volume, left side for brightness.
                </p>
              </>
            ) : (
              <>
                <div className="aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black">
                  <iframe
                    src={embedUrl}
                    title="Streamline embedded player"
                    referrerPolicy="no-referrer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-stone-300">
                  Streaming source is active.
                </p>
              </>
            )}
            <div className="rounded border border-amber-700/60 bg-amber-950/40 p-3 text-xs text-amber-200">
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
      </section>
    </main>
  );
}
