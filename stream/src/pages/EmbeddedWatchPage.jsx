// import { useEffect, useMemo, useRef, useState } from 'react';
// import { Link, useNavigate, useParams } from 'react-router-dom';
// import {
//   AlertTriangle,
//   ArrowLeft,
//   Check,
//   Maximize,
//   Pause,
//   PictureInPicture2,
//   Play,
//   RotateCcw,
//   RotateCw,
//   Server,
// } from 'lucide-react';
// import { getTitleDetails, getTvSeasonDetails } from '../services/tmdb';
// import { getBackdropUrl, getTitleName } from '../utils/media';
// import {
//   formatClock,
//   getEpisodePosition,
//   saveEpisodePosition,
//   saveSeriesEpisode,
// } from '../utils/episodeProgress';
// import { saveWatchHistoryEntry } from '../utils/recommendations';
// import { cn } from '../lib/utils';

// function fillTemplate(template, values) {
//   if (!template) {
//     return '';
//   }

//   return Object.entries(values).reduce((result, [key, value]) => {
//     return result.replaceAll(`{${key}}`, String(value));
//   }, template);
// }

// export default function EmbeddedWatchPage() {
//   const { tmdbId, season, episode } = useParams();
//   const navigate = useNavigate();
//   const isTvRoute = Boolean(season && episode);
//   const seasonNumber = Number(season || 1);
//   const episodeNumber = Number(episode || 1);
//   const videoRef = useRef(null);
//   const hlsRef = useRef(null);
//   const dashRef = useRef(null);
//   const touchMeta = useRef({
//     startX: 0,
//     startY: 0,
//     startVolume: 1,
//     startBrightness: 1,
//     side: 'right',
//   });

//   const [titleInfo, setTitleInfo] = useState(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [brightness, setBrightness] = useState(1);
//   const [isPipActive, setIsPipActive] = useState(false);
//   const [gestureLabel, setGestureLabel] = useState('');
//   const [seasonData, setSeasonData] = useState(null);
//   const [seasonLoading, setSeasonLoading] = useState(false);
//   const [seasonError, setSeasonError] = useState('');
//   const [autoplayEnabled, setAutoplayEnabled] = useState(true);
//   const [nextCountdown, setNextCountdown] = useState(0);
//   const [resumeSeconds, setResumeSeconds] = useState(0);
//   const [showSourceMenu, setShowSourceMenu] = useState(false);
//   const [showEpisodes, setShowEpisodes] = useState(true);
//   const sourceButtonRef = useRef(null);
//   const sourceMenuRef = useRef(null);
//   const lastSavedSecondRef = useRef(-1);
//   const historySavedRef = useRef(false);

//   const movieTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE || '';
//   const tvTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_TV || '';

//   const providerSources = useMemo(() => {
//     const list = [
//       {
//         id: 'videasy',
//         label: 'Videasy',
//         movieUrl: () => `https://player.videasy.net/movie/${tmdbId}`,
//         tvUrl: () =>
//           `https://player.videasy.net/tv/${tmdbId}/${season || 1}/${episode || 1}`,
//       },
//     ];

//     if (movieTemplate && tvTemplate) {
//       list.unshift({
//         id: 'custom',
//         label: 'Custom',
//         movieUrl: () => fillTemplate(movieTemplate, { tmdbId }),
//         tvUrl: () => fillTemplate(tvTemplate, { tmdbId, season, episode }),
//       });
//     }

//     return list;
//   }, [episode, movieTemplate, season, tmdbId, tvTemplate]);

//   const [playerSource, setPlayerSource] = useState(() => {
//     try {
//       const fromQuery = new URLSearchParams(window.location.search).get('source');
//       return fromQuery || 'videasy';
//     } catch {
//       return 'videasy';
//     }
//   });

//   const embedUrl = useMemo(() => {
//     const selected =
//       providerSources.find((source) => source.id === playerSource) ||
//       providerSources[0];
//     if (!selected) {
//       return '';
//     }
//     return isTvRoute ? selected.tvUrl() : selected.movieUrl();
//   }, [isTvRoute, playerSource, providerSources]);

//   useEffect(() => {
//     let ignore = false;

//     async function loadTitle() {
//       try {
//         const data = await getTitleDetails(isTvRoute ? 'tv' : 'movie', tmdbId);
//         if (!ignore) {
//           setTitleInfo(data);
//         }
//       } catch {
//         if (!ignore) {
//           setTitleInfo(null);
//         }
//       }
//     }

//     loadTitle();
//     return () => {
//       ignore = true;
//     };
//   }, [isTvRoute, tmdbId]);

//   useEffect(() => {
//     if (!titleInfo || historySavedRef.current) {
//       return;
//     }

//     historySavedRef.current = true;
//     const mediaType = isTvRoute ? 'tv' : 'movie';
//     saveWatchHistoryEntry({
//       id: Number(tmdbId),
//       mediaType,
//       title: getTitleName(titleInfo),
//       poster_path: titleInfo.poster_path,
//       backdrop_path: titleInfo.backdrop_path,
//       vote_average: titleInfo.vote_average,
//       release_date: titleInfo.release_date,
//       first_air_date: titleInfo.first_air_date,
//       genre_ids: (titleInfo.genres || []).map((genre) => genre.id),
//       played: true,
//     });

//     if (isTvRoute) {
//       saveSeriesEpisode(tmdbId, seasonNumber, episodeNumber, {
//         title: getTitleName(titleInfo),
//         poster_path: titleInfo.poster_path,
//         backdrop_path: titleInfo.backdrop_path,
//       });
//     }
//   }, [titleInfo, isTvRoute, tmdbId, seasonNumber, episodeNumber]);

//   useEffect(() => {
//     historySavedRef.current = false;
//   }, [tmdbId, seasonNumber, episodeNumber]);

//   useEffect(() => {
//     if (!providerSources.some((source) => source.id === playerSource)) {
//       setPlayerSource(providerSources[0]?.id || 'videasy');
//     }
//   }, [playerSource, providerSources]);

//   useEffect(() => {
//     const selected = providerSources.find((source) => source.id === playerSource);
//     if (!selected) {
//       return;
//     }

//     const url = new URL(window.location.href);
//     if (url.searchParams.get('source') !== selected.id) {
//       url.searchParams.set('source', selected.id);
//       window.history.replaceState({}, '', `${url.pathname}${url.search}`);
//     }
//   }, [playerSource, providerSources]);

//   useEffect(() => {
//     if (!showSourceMenu) {
//       return undefined;
//     }

//     const onPointerDown = (event) => {
//       const target = event.target;
//       if (
//         sourceButtonRef.current?.contains(target) ||
//         sourceMenuRef.current?.contains(target)
//       ) {
//         return;
//       }
//       setShowSourceMenu(false);
//     };

//     const onKeyDown = (event) => {
//       if (event.key === 'Escape') {
//         setShowSourceMenu(false);
//       }
//     };

//     document.addEventListener('pointerdown', onPointerDown);
//     document.addEventListener('keydown', onKeyDown);
//     return () => {
//       document.removeEventListener('pointerdown', onPointerDown);
//       document.removeEventListener('keydown', onKeyDown);
//     };
//   }, [showSourceMenu]);

//   const hasEmbed = embedUrl.startsWith('https://') || embedUrl.startsWith('http://');
//   const isSecureEmbed = embedUrl.startsWith('https://');
//   const isDirectVideo = /\.(mp4|webm|ogg|m3u8|mpd)(\?.*)?$/i.test(embedUrl);
//   const isHlsSource = /\.m3u8(\?.*)?$/i.test(embedUrl);
//   const isDashSource = /\.mpd(\?.*)?$/i.test(embedUrl);

//   useEffect(() => {
//     if (!videoRef.current || !hasEmbed || !isDirectVideo) {
//       return undefined;
//     }

//     let cancelled = false;
//     const videoElement = videoRef.current;

//     async function setupPlayer() {
//       if (hlsRef.current) {
//         hlsRef.current.destroy();
//         hlsRef.current = null;
//       }
//       if (dashRef.current) {
//         dashRef.current.reset();
//         dashRef.current = null;
//       }

//       if (isHlsSource) {
//         const canPlayNativeHls = videoElement.canPlayType(
//           'application/vnd.apple.mpegurl',
//         );
//         if (canPlayNativeHls) {
//           videoElement.src = embedUrl;
//         } else {
//           const { default: Hls } = await import('hls.js');
//           if (cancelled) {
//             return;
//           }
//           if (Hls.isSupported()) {
//             const hls = new Hls({
//               enableWorker: true,
//               lowLatencyMode: true,
//             });
//             hls.loadSource(embedUrl);
//             hls.attachMedia(videoElement);
//             hls.on(Hls.Events.ERROR, (_, data) => {
//               if (data?.fatal) {
//                 setGestureLabel('HLS playback error');
//               }
//             });
//             hlsRef.current = hls;
//           } else {
//             videoElement.src = embedUrl;
//           }
//         }
//       } else if (isDashSource) {
//         const dashjs = await import('dashjs');
//         if (cancelled) {
//           return;
//         }
//         const player = dashjs.default.MediaPlayer().create();
//         player.initialize(videoElement, embedUrl, false);
//         player.updateSettings({
//           streaming: {
//             abr: {
//               autoSwitchBitrate: {
//                 audio: true,
//                 video: true,
//               },
//             },
//           },
//         });
//         dashRef.current = player;
//       } else {
//         videoElement.src = embedUrl;
//       }
//     }

//     setupPlayer();

//     return () => {
//       cancelled = true;
//       if (hlsRef.current) {
//         hlsRef.current.destroy();
//         hlsRef.current = null;
//       }
//       if (dashRef.current) {
//         dashRef.current.reset();
//         dashRef.current = null;
//       }
//     };
//   }, [embedUrl, hasEmbed, isDashSource, isDirectVideo, isHlsSource]);

//   useEffect(() => {
//     let ignore = false;

//     async function loadSeason() {
//       if (!isTvRoute || !Number.isFinite(seasonNumber) || seasonNumber < 1) {
//         setSeasonData(null);
//         setSeasonError('');
//         return;
//       }

//       try {
//         setSeasonLoading(true);
//         setSeasonError('');
//         const data = await getTvSeasonDetails(tmdbId, seasonNumber);
//         if (!ignore) {
//           setSeasonData(data);
//         }
//       } catch {
//         if (!ignore) {
//           setSeasonData(null);
//           setSeasonError(
//             'Could not load season data. You can still enter episode numbers manually.',
//           );
//         }
//       } finally {
//         if (!ignore) {
//           setSeasonLoading(false);
//         }
//       }
//     }

//     loadSeason();
//     return () => {
//       ignore = true;
//     };
//   }, [isTvRoute, seasonNumber, tmdbId]);

//   const maxEpisodes = seasonData?.episodes?.length || null;
//   const episodeCards = seasonData?.episodes || [];
//   const displayTitle = titleInfo ? getTitleName(titleInfo) : `Title ${tmdbId}`;
//   const episodeName = episodeCards.find(
//     (item) => item.episode_number === episodeNumber,
//   )?.name;
//   const backPath = `/title/${isTvRoute ? 'tv' : 'movie'}/${tmdbId}`;

//   const goToTvEpisode = (nextSeason, nextEpisode) => {
//     const safeSeason = Math.max(1, Math.floor(nextSeason));
//     const safeEpisode = Math.max(1, Math.floor(nextEpisode));
//     setNextCountdown(0);
//     navigate(`/tv/${tmdbId}/${safeSeason}/${safeEpisode}`);
//   };

//   const goToNextEpisode = () => {
//     if (!isTvRoute) {
//       return;
//     }

//     if (maxEpisodes && episodeNumber >= maxEpisodes) {
//       goToTvEpisode(seasonNumber + 1, 1);
//       return;
//     }

//     goToTvEpisode(seasonNumber, episodeNumber + 1);
//   };

//   const goToPreviousEpisode = () => {
//     if (!isTvRoute) {
//       return;
//     }

//     if (episodeNumber > 1) {
//       goToTvEpisode(seasonNumber, episodeNumber - 1);
//     }
//   };

//   useEffect(() => {
//     if (!nextCountdown || !isTvRoute) {
//       return undefined;
//     }

//     const timer = window.setInterval(() => {
//       setNextCountdown((current) => {
//         if (current <= 1) {
//           window.clearInterval(timer);
//           goToNextEpisode();
//           return 0;
//         }
//         return current - 1;
//       });
//     }, 1000);

//     return () => {
//       window.clearInterval(timer);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isTvRoute, nextCountdown]);

//   const togglePlay = async () => {
//     if (!videoRef.current) {
//       return;
//     }

//     if (videoRef.current.paused) {
//       await videoRef.current.play();
//       setIsPlaying(true);
//     } else {
//       videoRef.current.pause();
//       setIsPlaying(false);
//     }
//   };

//   const seekBy = (seconds) => {
//     if (!videoRef.current) {
//       return;
//     }
//     const duration = videoRef.current.duration || 0;
//     const nextTime = Math.max(
//       0,
//       Math.min(
//         (videoRef.current.currentTime || 0) + seconds,
//         duration || Number.MAX_SAFE_INTEGER,
//       ),
//     );
//     videoRef.current.currentTime = nextTime;
//   };

//   const togglePip = async () => {
//     if (!videoRef.current || !document.pictureInPictureEnabled) {
//       return;
//     }

//     try {
//       if (document.pictureInPictureElement) {
//         await document.exitPictureInPicture();
//         setIsPipActive(false);
//       } else {
//         await videoRef.current.requestPictureInPicture();
//         setIsPipActive(true);
//       }
//     } catch {
//       setGestureLabel('PiP is not available for this source');
//     }
//   };

//   const lockLandscape = async () => {
//     try {
//       if (screen.orientation?.lock) {
//         await screen.orientation.lock('landscape');
//         setGestureLabel('Orientation locked: landscape');
//       }
//     } catch {
//       setGestureLabel('Orientation lock not supported on this browser');
//     }
//   };

//   const onTouchStart = (event) => {
//     if (!videoRef.current || !isDirectVideo) {
//       return;
//     }
//     const firstTouch = event.touches[0];
//     const bounds = event.currentTarget.getBoundingClientRect();
//     const isLeftSide = firstTouch.clientX - bounds.left < bounds.width / 2;

//     touchMeta.current = {
//       startX: firstTouch.clientX,
//       startY: firstTouch.clientY,
//       startVolume: videoRef.current.volume,
//       startBrightness: brightness,
//       side: isLeftSide ? 'left' : 'right',
//     };
//   };

//   const onTouchMove = (event) => {
//     if (!videoRef.current || !isDirectVideo) {
//       return;
//     }

//     const firstTouch = event.touches[0];
//     const deltaY = touchMeta.current.startY - firstTouch.clientY;
//     const normalized = Math.max(-1, Math.min(deltaY / 260, 1));

//     if (touchMeta.current.side === 'right') {
//       const nextVolume = Math.max(
//         0,
//         Math.min(touchMeta.current.startVolume + normalized, 1),
//       );
//       videoRef.current.volume = nextVolume;
//       setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
//     } else {
//       const nextBrightness = Math.max(
//         0.4,
//         Math.min(touchMeta.current.startBrightness + normalized, 1.4),
//       );
//       setBrightness(nextBrightness);
//       setGestureLabel(`Brightness ${Math.round((nextBrightness / 1.4) * 100)}%`);
//     }
//   };

//   const onTouchEnd = () => {
//     if (!isDirectVideo) {
//       return;
//     }
//     window.setTimeout(() => setGestureLabel(''), 900);
//   };

//   const onDoubleTap = (event) => {
//     if (!videoRef.current || !isDirectVideo) {
//       return;
//     }

//     const bounds = event.currentTarget.getBoundingClientRect();
//     const isLeftSide = event.clientX - bounds.left < bounds.width / 2;
//     if (isLeftSide) {
//       seekBy(-10);
//       setGestureLabel('-10s');
//     } else {
//       seekBy(10);
//       setGestureLabel('+10s');
//     }
//     window.setTimeout(() => setGestureLabel(''), 700);
//   };

//   const onVideoLoadedMetadata = () => {
//     if (!isTvRoute || !isDirectVideo || !videoRef.current) {
//       return;
//     }

//     const savedPosition = getEpisodePosition(tmdbId, seasonNumber, episodeNumber);
//     const duration = Number(videoRef.current.duration || 0);
//     if (savedPosition > 20 && (!duration || savedPosition < duration - 20)) {
//       setResumeSeconds(savedPosition);
//     } else {
//       setResumeSeconds(0);
//     }
//   };

//   const onVideoTimeUpdate = () => {
//     if (!isTvRoute || !isDirectVideo || !videoRef.current) {
//       return;
//     }

//     const currentSecond = Math.floor(videoRef.current.currentTime || 0);
//     if (currentSecond - lastSavedSecondRef.current >= 5) {
//       lastSavedSecondRef.current = currentSecond;
//       saveEpisodePosition(tmdbId, seasonNumber, episodeNumber, currentSecond);
//     }
//   };

//   const onVideoEnded = () => {
//     if (isTvRoute && autoplayEnabled) {
//       setNextCountdown(8);
//     }
//   };

//   const resumePlayback = () => {
//     if (!videoRef.current || !resumeSeconds) {
//       return;
//     }

//     videoRef.current.currentTime = resumeSeconds;
//     setResumeSeconds(0);
//   };

//   useEffect(() => {
//     const isTypingTarget = (target) => {
//       if (!(target instanceof HTMLElement)) {
//         return false;
//       }
//       const tagName = target.tagName;
//       return tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable;
//     };

//     const onKeyDown = (event) => {
//       if (isTypingTarget(event.target)) {
//         return;
//       }

//       if (event.key === 'n' && isTvRoute) {
//         event.preventDefault();
//         goToNextEpisode();
//         return;
//       }

//       if (event.key === 'p' && isTvRoute) {
//         event.preventDefault();
//         goToPreviousEpisode();
//         return;
//       }

//       if (!isDirectVideo || !videoRef.current) {
//         return;
//       }

//       if (event.key === ' ' || event.key === 'k' || event.key === 'MediaPlayPause') {
//         event.preventDefault();
//         togglePlay();
//         return;
//       }

//       if (event.key === 'ArrowLeft') {
//         event.preventDefault();
//         seekBy(-10);
//         return;
//       }

//       if (event.key === 'ArrowRight') {
//         event.preventDefault();
//         seekBy(10);
//         return;
//       }

//       if (event.key === 'ArrowUp') {
//         event.preventDefault();
//         const nextVolume = Math.min((videoRef.current.volume || 0) + 0.1, 1);
//         videoRef.current.volume = nextVolume;
//         setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
//         window.setTimeout(() => setGestureLabel(''), 600);
//       }

//       if (event.key === 'ArrowDown') {
//         event.preventDefault();
//         const nextVolume = Math.max((videoRef.current.volume || 0) - 0.1, 0);
//         videoRef.current.volume = nextVolume;
//         setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
//         window.setTimeout(() => setGestureLabel(''), 600);
//       }
//     };

//     window.addEventListener('keydown', onKeyDown);
//     return () => {
//       window.removeEventListener('keydown', onKeyDown);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isDirectVideo, isTvRoute]);

//   useEffect(() => {
//     document.title = titleInfo
//       ? `${getTitleName(titleInfo)}${
//           isTvRoute ? ` · S${seasonNumber}E${episodeNumber}` : ''
//         } · Streamline`
//       : 'Watch · Streamline';
//     return () => {
//       document.title = 'Streamline';
//     };
//   }, [titleInfo, isTvRoute, seasonNumber, episodeNumber]);

//   const compactControlClass =
//     'inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-700 bg-stone-950 px-3 text-xs font-medium text-stone-100 transition hover:border-stone-500 hover:bg-stone-900';
//   const compactControlPrimaryClass =
//     'inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-400 px-3 text-xs font-semibold text-stone-950 transition hover:bg-amber-300';
//   const compactIconClass = 'h-3.5 w-3.5';

//   return (
//     <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-5">
//       <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
//         <div className="min-w-0 space-y-1">
//           <Link
//             to={backPath}
//             className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition hover:text-amber-300"
//           >
//             <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
//             Back to details
//           </Link>
//           <h1 className="truncate text-xl font-semibold tracking-tight text-stone-100 sm:text-2xl">
//             {displayTitle}
//           </h1>
//           <p className="text-sm text-stone-400">
//             {isTvRoute ? (
//               <>
//                 Season {seasonNumber} · Episode {episodeNumber}
//                 {episodeName ? ` · ${episodeName}` : ''}
//               </>
//             ) : (
//               'Movie'
//             )}
//           </p>
//         </div>

//         <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/80 p-1.5">
//           <div className="relative">
//             <button
//               ref={sourceButtonRef}
//               type="button"
//               onClick={() => setShowSourceMenu((prev) => !prev)}
//               className={cn(
//                 'inline-flex h-8 w-8 items-center justify-center rounded-md border text-stone-100 transition',
//                 showSourceMenu
//                   ? 'border-amber-400 bg-amber-400/15'
//                   : 'border-stone-700 bg-stone-900 hover:bg-stone-800',
//               )}
//               title={`Streaming source: ${
//                 providerSources.find((source) => source.id === playerSource)
//                   ?.label || 'Unknown'
//               }`}
//               aria-label="Open source options"
//               aria-expanded={showSourceMenu}
//             >
//               <Server className="h-4 w-4" />
//             </button>
//             {showSourceMenu && (
//               <div
//                 ref={sourceMenuRef}
//                 className="absolute right-0 top-10 z-30 min-w-[12rem] rounded-lg border border-stone-700 bg-stone-950 p-1.5 shadow-xl"
//                 role="menu"
//               >
//                 {providerSources.map((source) => {
//                   const active = source.id === playerSource;
//                   return (
//                     <button
//                       key={source.id}
//                       type="button"
//                       role="menuitemradio"
//                       aria-checked={active}
//                       onClick={() => {
//                         setPlayerSource(source.id);
//                         setShowSourceMenu(false);
//                       }}
//                       className={cn(
//                         'mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition',
//                         active
//                           ? 'bg-amber-400/15 text-amber-100'
//                           : 'text-stone-200 hover:bg-stone-900',
//                       )}
//                     >
//                       <span>{source.label}</span>
//                       {active && <Check className="h-4 w-4 text-amber-300" />}
//                     </button>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//           <p className="pr-2 text-xs text-stone-400">
//             <span className="font-medium text-stone-200">
//               {providerSources.find((source) => source.id === playerSource)?.label ||
//                 'Unknown'}
//             </span>
//           </p>
//         </div>
//       </div>

//       {!isSecureEmbed && hasEmbed && (
//         <p
//           className="mb-3 rounded-md border border-rose-700/50 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
//           role="alert"
//         >
//           Non-HTTPS stream URL detected. Some browsers may block mixed content.
//         </p>
//       )}

//       {isTvRoute && (
//         <div className="mb-3 rounded-xl border border-stone-800 bg-stone-950/70 p-3">
//           <div className="flex flex-wrap items-end gap-2">
//             <label className="text-xs text-stone-400">
//               Season
//               <input
//                 type="number"
//                 min="1"
//                 value={seasonNumber}
//                 onChange={(event) =>
//                   goToTvEpisode(Number(event.target.value || 1), episodeNumber)
//                 }
//                 className="mt-1 h-9 w-20 rounded-md border border-stone-700 bg-stone-900 px-2 text-sm text-stone-100"
//               />
//             </label>

//             <label className="text-xs text-stone-400">
//               Episode
//               <input
//                 type="number"
//                 min="1"
//                 max={maxEpisodes || undefined}
//                 value={episodeNumber}
//                 onChange={(event) =>
//                   goToTvEpisode(seasonNumber, Number(event.target.value || 1))
//                 }
//                 className="mt-1 h-9 w-20 rounded-md border border-stone-700 bg-stone-900 px-2 text-sm text-stone-100"
//               />
//             </label>

//             <button
//               type="button"
//               onClick={goToPreviousEpisode}
//               disabled={episodeNumber <= 1}
//               className={cn(compactControlClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
//             >
//               <RotateCcw className={compactIconClass} />
//               Prev
//             </button>

//             <button type="button" onClick={goToNextEpisode} className={compactControlPrimaryClass}>
//               <RotateCw className={compactIconClass} />
//               Next
//             </button>

//             <button
//               type="button"
//               onClick={() => setAutoplayEnabled((prev) => !prev)}
//               className={cn(
//                 'inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium',
//                 autoplayEnabled
//                   ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
//                   : 'border-stone-700 text-stone-300 hover:bg-stone-900',
//               )}
//             >
//               Autoplay {autoplayEnabled ? 'On' : 'Off'}
//             </button>

//             <button
//               type="button"
//               onClick={() => setShowEpisodes((prev) => !prev)}
//               className={compactControlClass}
//             >
//               {showEpisodes ? 'Hide episodes' : 'Show episodes'}
//             </button>
//           </div>

//           <p className="mt-2 text-xs text-stone-500">
//             {seasonLoading && 'Loading season episodes…'}
//             {!seasonLoading &&
//               maxEpisodes &&
//               `Season ${seasonNumber} · ${maxEpisodes} episodes`}
//             {!seasonLoading && !maxEpisodes && !seasonError && 'Episode count unavailable.'}
//             {seasonError && ` ${seasonError}`}
//           </p>

//           {showEpisodes && !!episodeCards.length && (
//             <div className="mt-3 overflow-x-auto rounded-lg border border-stone-800 bg-stone-900/50 p-2">
//               <div className="flex gap-2 pb-1">
//                 {episodeCards.map((item) => {
//                   const active = item.episode_number === episodeNumber;
//                   return (
//                     <button
//                       key={item.id || `${seasonNumber}-${item.episode_number}`}
//                       type="button"
//                       onClick={() => goToTvEpisode(seasonNumber, item.episode_number)}
//                       className={cn(
//                         'w-44 shrink-0 rounded-lg border p-2 text-left transition',
//                         active
//                           ? 'border-amber-400 bg-amber-400/15'
//                           : 'border-stone-700 bg-stone-950/80 hover:bg-stone-900',
//                       )}
//                     >
//                       <div className="mb-2 h-20 overflow-hidden rounded-md bg-stone-900">
//                         {item.still_path ? (
//                           <img
//                             src={getBackdropUrl(item.still_path, 'w300')}
//                             alt=""
//                             className="h-full w-full object-cover"
//                             loading="lazy"
//                           />
//                         ) : (
//                           <div className="flex h-full items-center justify-center text-[11px] text-stone-500">
//                             No image
//                           </div>
//                         )}
//                       </div>
//                       <p className="text-xs font-semibold text-stone-100">
//                         E{item.episode_number}: {item.name || 'Untitled'}
//                       </p>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {hasEmbed ? (
//         <div className="space-y-3">
//           {isDirectVideo ? (
//             <>
//               <div
//                 className="relative aspect-video overflow-hidden rounded-xl border border-stone-800 bg-black"
//                 onDoubleClick={onDoubleTap}
//                 onTouchStart={onTouchStart}
//                 onTouchMove={onTouchMove}
//                 onTouchEnd={onTouchEnd}
//                 style={{ filter: `brightness(${brightness})` }}
//               >
//                 <video
//                   ref={videoRef}
//                   className="h-full w-full"
//                   controls={false}
//                   playsInline
//                   preload="metadata"
//                   onPlay={() => setIsPlaying(true)}
//                   onPause={() => setIsPlaying(false)}
//                   onLoadedMetadata={onVideoLoadedMetadata}
//                   onTimeUpdate={onVideoTimeUpdate}
//                   onEnded={onVideoEnded}
//                 />
//                 {gestureLabel && (
//                   <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs text-white">
//                     {gestureLabel}
//                   </div>
//                 )}

//                 {resumeSeconds > 0 && (
//                   <button
//                     type="button"
//                     onClick={resumePlayback}
//                     className="absolute left-3 top-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-stone-950"
//                   >
//                     Resume from {formatClock(resumeSeconds)}
//                   </button>
//                 )}

//                 {nextCountdown > 0 && (
//                   <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-black/80 px-3 py-1 text-xs text-white">
//                     Next episode in {nextCountdown}s
//                   </div>
//                 )}
//               </div>
//               <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
//                 <button type="button" onClick={togglePlay} className={compactControlPrimaryClass}>
//                   {isPlaying ? (
//                     <Pause className={compactIconClass} />
//                   ) : (
//                     <Play className={compactIconClass} />
//                   )}
//                   {isPlaying ? 'Pause' : 'Play'}
//                 </button>
//                 <button type="button" onClick={() => seekBy(-10)} className={compactControlClass}>
//                   <RotateCcw className={compactIconClass} />
//                   -10s
//                 </button>
//                 <button type="button" onClick={() => seekBy(10)} className={compactControlClass}>
//                   <RotateCw className={compactIconClass} />
//                   +10s
//                 </button>
//                 <button type="button" onClick={togglePip} className={compactControlClass}>
//                   <PictureInPicture2 className={compactIconClass} />
//                   {isPipActive ? 'Exit PiP' : 'PiP'}
//                 </button>
//                 <button type="button" onClick={lockLandscape} className={compactControlClass}>
//                   <Maximize className={compactIconClass} />
//                   Landscape
//                 </button>
//               </div>
//               <p className="text-[11px] text-stone-500">
//                 Shortcuts: Space/K play · arrows seek/volume · N/P episodes. Mobile: double-tap
//                 seek, vertical swipe volume/brightness.
//               </p>
//             </>
//           ) : (
//             <div className="aspect-video overflow-hidden rounded-xl border border-stone-800 bg-black">
//               <iframe
//                 src={embedUrl}
//                 title={`${displayTitle} player`}
//                 referrerPolicy="no-referrer"
//                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//                 allowFullScreen
//                 className="h-full w-full"
//               />
//             </div>
//           )}
//           <p className="text-[11px] text-stone-500">
//             Playback is provided by an external source. Availability can vary.
//           </p>
//         </div>
//       ) : (
//         <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-100">
//           <div className="flex items-center gap-2 font-semibold">
//             <AlertTriangle className="h-4 w-4" />
//             Player source not configured
//           </div>
//           <p className="mt-2 text-amber-100/90">
//             Set embed URL templates in your environment file, or use the default Videasy source.
//           </p>
//           <ul className="mt-2 list-disc pl-5 text-xs text-amber-200/90">
//             <li>
//               VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE=https://provider/movie/{'{tmdbId}'}
//             </li>
//             <li>
//               VITE_LEGAL_PLAYER_URL_TEMPLATE_TV=https://provider/tv/{'{tmdbId}'}/{'{season}'}/
//               {'{episode}'}
//             </li>
//           </ul>
//         </div>
//       )}
//     </main>
//   );
// }

// 
// 
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Maximize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Server,
  ChevronLeft,
  SkipForward,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Hls from 'hls.js';
import dashjs from 'dashjs';
import { getTvSeasonDetails, getTitleDetails } from '../services/tmdb';
import { getBackdropUrl, getTitleName } from '../utils/media';
import {
  formatClock,
  getEpisodePosition,
  saveEpisodePosition,
  saveSeriesEpisode,
} from '../utils/episodeProgress';
import { saveWatchHistoryEntry } from '../utils/recommendations';
import AdShieldPlayer from '../components/AdShieldPlayer';

function fillTemplate(template, values) {
  if (!template) return '';
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
  const [titleMeta, setTitleMeta] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [seasonError, setSeasonError] = useState('');
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [nextCountdown, setNextCountdown] = useState(0);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [showNextUp, setShowNextUp] = useState(false);
  const [nextUpDismissed, setNextUpDismissed] = useState(false);
  /** Play → expand; pause → restore (direct video + optional embed theater) */
  const [immersive, setImmersive] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const sourceButtonRef = useRef(null);
  const sourceMenuRef = useRef(null);
  const lastSavedSecondRef = useRef(-1);
  const nextUpTriggeredRef = useRef(false);
  const wasCountingRef = useRef(false);
  const playerShellRef = useRef(null);
  const immersiveRef = useRef(false);

  const movieTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE || '';
  const tvTemplate = import.meta.env.VITE_LEGAL_PLAYER_URL_TEMPLATE_TV || '';

  const providerSources = useMemo(() => {
    const list = [
      {
        id: 'videasy',
        label: 'Videasy',
        movieUrl: () =>
          `https://player.videasy.net/movie/${tmdbId}?autoplay=1`,
        tvUrl: () =>
          `https://player.videasy.net/tv/${tmdbId}/${season || 1}/${episode || 1}?autoplay=1`,
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
    const selected =
      providerSources.find((s) => s.id === playerSource) || providerSources[0];
    if (!selected) return '';
    return isTvRoute ? selected.tvUrl() : selected.movieUrl();
  }, [isTvRoute, playerSource, providerSources]);

  useEffect(() => {
    if (!providerSources.some((s) => s.id === playerSource)) {
      setPlayerSource(providerSources[0]?.id || 'videasy');
    }
  }, [playerSource, providerSources]);

  useEffect(() => {
    const selected = providerSources.find((s) => s.id === playerSource);
    if (!selected) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('source') !== selected.id) {
      url.searchParams.set('source', selected.id);
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    }
  }, [playerSource, providerSources]);

  useEffect(() => {
    if (!showSourceMenu) return;
    const onPointerDown = (event) => {
      const target = event.target;
      if (
        sourceButtonRef.current?.contains(target) ||
        sourceMenuRef.current?.contains(target)
      ) {
        return;
      }
      setShowSourceMenu(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setShowSourceMenu(false);
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

  // Direct video / HLS / DASH setup
  useEffect(() => {
    if (!videoRef.current || !hasEmbed || !isDirectVideo) return;

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
      const canPlayNativeHls = videoElement.canPlayType(
        'application/vnd.apple.mpegurl',
      );
      if (canPlayNativeHls) {
        videoElement.src = embedUrl;
      } else if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(embedUrl);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data?.fatal) setGestureLabel('HLS playback error');
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
          abr: { autoSwitchBitrate: { audio: true, video: true } },
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

  // Title meta (for breadcrumb / header)
  useEffect(() => {
    let ignore = false;
    async function loadMeta() {
      try {
        const data = await getTitleDetails(isTvRoute ? 'tv' : 'movie', tmdbId);
        if (!ignore) setTitleMeta(data);
      } catch {
        if (!ignore) setTitleMeta(null);
      }
    }
    loadMeta();
    return () => {
      ignore = true;
    };
  }, [isTvRoute, tmdbId]);

  // Season data for TV
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
        if (!ignore) setSeasonData(data);
      } catch {
        if (!ignore) {
          setSeasonData(null);
          setSeasonError(
            'Could not load season data. You can still enter episode numbers manually.',
          );
        }
      } finally {
        if (!ignore) setSeasonLoading(false);
      }
    }

    loadSeason();
    return () => {
      ignore = true;
    };
  }, [isTvRoute, seasonNumber, tmdbId]);

  const maxEpisodes = seasonData?.episodes?.length || null;
  const episodeCards = seasonData?.episodes || [];
  const currentEpisodeMeta = episodeCards.find(
    (e) => e.episode_number === episodeNumber,
  );

  const goToTvEpisode = (nextSeason, nextEpisode) => {
    const safeSeason = Math.max(1, Math.floor(nextSeason));
    const safeEpisode = Math.max(1, Math.floor(nextEpisode));
    setNextCountdown(0);
    navigate(`/tv/${tmdbId}/${safeSeason}/${safeEpisode}`);
  };

  const goToNextEpisode = () => {
    if (!isTvRoute) return;
    if (maxEpisodes && episodeNumber >= maxEpisodes) {
      goToTvEpisode(seasonNumber + 1, 1);
      return;
    }
    goToTvEpisode(seasonNumber, episodeNumber + 1);
  };

  const goToPreviousEpisode = () => {
    if (!isTvRoute) return;
    if (episodeNumber > 1) {
      goToTvEpisode(seasonNumber, episodeNumber - 1);
    }
  };

  // Netflix-style "Up Next" target (same season next ep, or S+1 E1)
  const nextEpisodeTarget = useMemo(() => {
    if (!isTvRoute) return null;
    const atSeasonEnd = maxEpisodes && episodeNumber >= maxEpisodes;
    const nextSeason = atSeasonEnd ? seasonNumber + 1 : seasonNumber;
    const nextEp = atSeasonEnd ? 1 : episodeNumber + 1;
    // Prefer current season list for same-season next; we don't have next season cards loaded
    const meta =
      !atSeasonEnd
        ? episodeCards.find((e) => e.episode_number === nextEp)
        : null;
    return {
      season: nextSeason,
      episode: nextEp,
      name: meta?.name || (atSeasonEnd ? `Season ${nextSeason} · Episode 1` : `Episode ${nextEp}`),
      still_path: meta?.still_path || null,
      overview: meta?.overview || '',
      isSeasonFinale: Boolean(atSeasonEnd),
    };
  }, [isTvRoute, maxEpisodes, episodeNumber, seasonNumber, episodeCards]);

  // Reset end-card when navigating episodes
  useEffect(() => {
    setShowNextUp(false);
    setNextUpDismissed(false);
    setNextCountdown(0);
    nextUpTriggeredRef.current = false;
    lastSavedSecondRef.current = -1;
    wasCountingRef.current = false;
  }, [tmdbId, seasonNumber, episodeNumber]);

  /**
   * Embed players (Videasy etc.) are cross-origin iframes — the parent page
   * cannot read video.currentTime or "ended". Without that, a true Netflix
   * end-card is impossible from the iframe alone.
   *
   * Approximation: use TMDB episode runtime. When the user has been on this
   * episode page for ~runtime − 45s, surface Up Next + optional countdown.
   * Pauses/ads make this imperfect, but it is the only signal we have.
   */
  const autoplayEnabledRef = useRef(autoplayEnabled);
  autoplayEnabledRef.current = autoplayEnabled;
  const nextUpDismissedRef = useRef(nextUpDismissed);
  nextUpDismissedRef.current = nextUpDismissed;

  useEffect(() => {
    if (!isTvRoute || isDirectVideo) return undefined;

    const runtimeMin =
      currentEpisodeMeta?.runtime ||
      titleMeta?.episode_run_time?.[0] ||
      null;
    if (!runtimeMin || runtimeMin < 5) return undefined;

    const triggerAfterMs = Math.max(30, runtimeMin * 60 - 45) * 1000;
    const startedAt = Date.now();

    const timer = window.setInterval(() => {
      if (nextUpTriggeredRef.current || nextUpDismissedRef.current) return;
      if (Date.now() - startedAt < triggerAfterMs) return;

      nextUpTriggeredRef.current = true;
      setShowNextUp(true);
      if (autoplayEnabledRef.current) {
        setNextCountdown(15);
      }
      window.clearInterval(timer);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [
    isTvRoute,
    isDirectVideo,
    currentEpisodeMeta?.runtime,
    // stringify array to avoid identity churn
    titleMeta?.episode_run_time?.join?.(',') || titleMeta?.episode_run_time,
    tmdbId,
    seasonNumber,
    episodeNumber,
  ]);

  // Mark progress for Continue Watching + soft history once title meta is known
  useEffect(() => {
    if (!titleMeta) return;

    const mediaType = isTvRoute ? 'tv' : 'movie';
    const title = getTitleName(titleMeta);
    saveWatchHistoryEntry({
      id: Number(tmdbId),
      mediaType,
      title,
      poster_path: titleMeta.poster_path,
      backdrop_path: titleMeta.backdrop_path,
      vote_average: titleMeta.vote_average,
      release_date: titleMeta.release_date,
      first_air_date: titleMeta.first_air_date,
      genre_ids: (titleMeta.genres || []).map((g) => g.id),
      played: true,
      watchedAt: Date.now(),
    });

    if (isTvRoute) {
      saveSeriesEpisode(tmdbId, seasonNumber, episodeNumber, {
        title,
        poster_path: titleMeta.poster_path,
        backdrop_path: titleMeta.backdrop_path,
        vote_average: titleMeta.vote_average,
        first_air_date: titleMeta.first_air_date,
      });
    }
  }, [titleMeta, isTvRoute, tmdbId, seasonNumber, episodeNumber]);

    // Stable countdown — interval only runs while armed (>0), does not reset every second
  useEffect(() => {
    if (!isTvRoute || nextCountdown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setNextCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
    // Only (re)start when we transition into a counting state, not every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTvRoute, nextCountdown > 0]);

  // Fire navigation once when countdown reaches 0
  useEffect(() => {
    if (nextCountdown > 0) {
      wasCountingRef.current = true;
      return;
    }
    if (!wasCountingRef.current) return;
    wasCountingRef.current = false;
    if (!isTvRoute || !autoplayEnabled) return;
    // Prefer next target; fall back to sequential next
    if (nextEpisodeTarget) {
      goToTvEpisode(nextEpisodeTarget.season, nextEpisodeTarget.episode);
    } else {
      goToNextEpisode();
    }
  }, [nextCountdown, isTvRoute, autoplayEnabled, nextEpisodeTarget]);


  const exitImmersive = async () => {
    immersiveRef.current = false;
    setImmersive(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* ignore */
    }
  };

  /**
   * Expand player on play: prefer browser fullscreen, fall back to CSS theater
   * (fixed viewport). Must run in a user-gesture turn when possible.
   */
  const enterImmersive = async () => {
    const node = playerShellRef.current;
    if (!node) {
      immersiveRef.current = true;
      setImmersive(true);
      return;
    }

    let usedNativeFs = false;
    try {
      if (!document.fullscreenElement) {
        if (node.requestFullscreen) {
          await node.requestFullscreen();
          usedNativeFs = true;
        } else if (node.webkitRequestFullscreen) {
          await node.webkitRequestFullscreen();
          usedNativeFs = true;
        }
      } else {
        usedNativeFs = true;
      }
    } catch {
      usedNativeFs = false;
    }

    immersiveRef.current = true;
    setImmersive(true);

    if (!usedNativeFs) {
      // CSS theater fallback — fills the viewport and locks scroll
      document.documentElement.style.overflow = 'hidden';
    }

    try {
      await screen.orientation?.lock?.('landscape');
    } catch {
      /* desktop / unsupported */
    }
  };

  // Keep React state in sync if user hits Esc / browser UI exits FS
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && immersiveRef.current) {
        // Native FS closed — if still "playing" keep CSS theater; if paused, restore
        if (videoRef.current?.paused !== false) {
          immersiveRef.current = false;
          setImmersive(false);
          document.documentElement.style.overflow = '';
        }
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    if (!immersive) {
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [immersive]);

  // Leave immersive when changing episode/title
  useEffect(() => {
    exitImmersive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmdbId, seasonNumber, episodeNumber]);

  const onVideoPlay = () => {
    setIsPlaying(true);
    enterImmersive();
  };

  const onVideoPause = () => {
    setIsPlaying(false);
    // ended → pause often fires before showNextUp state commits; use ref
    window.setTimeout(() => {
      if (nextUpTriggeredRef.current || wasCountingRef.current) return;
      if (videoRef.current && !videoRef.current.paused) return;
      exitImmersive();
    }, 80);
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      await videoRef.current.play();
      setIsPlaying(true);
      // play() event also fires onVideoPlay; enterImmersive is idempotent enough
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seekBy = (seconds) => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 0;
    const nextTime = Math.max(
      0,
      Math.min(
        (videoRef.current.currentTime || 0) + seconds,
        duration || Number.MAX_SAFE_INTEGER,
      ),
    );
    videoRef.current.currentTime = nextTime;
  };

  const togglePip = async () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return;
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
    if (!videoRef.current || !isDirectVideo) return;
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
    if (!videoRef.current || !isDirectVideo) return;
    const firstTouch = event.touches[0];
    const deltaY = touchMeta.current.startY - firstTouch.clientY;
    const normalized = Math.max(-1, Math.min(deltaY / 260, 1));

    if (touchMeta.current.side === 'right') {
      const nextVolume = Math.max(
        0,
        Math.min(touchMeta.current.startVolume + normalized, 1),
      );
      videoRef.current.volume = nextVolume;
      setGestureLabel(`Volume ${Math.round(nextVolume * 100)}%`);
    } else {
      const nextBrightness = Math.max(
        0.4,
        Math.min(touchMeta.current.startBrightness + normalized, 1.4),
      );
      setBrightness(nextBrightness);
      setGestureLabel(`Brightness ${Math.round((nextBrightness / 1.4) * 100)}%`);
    }
  };

  const onTouchEnd = () => {
    if (!isDirectVideo) return;
    window.setTimeout(() => setGestureLabel(''), 900);
  };

  const onDoubleTap = (event) => {
    if (!videoRef.current || !isDirectVideo) return;
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
    if (!isDirectVideo || !videoRef.current) return;
    const duration = Number(videoRef.current.duration || 0);

    if (isTvRoute) {
      const savedPosition = getEpisodePosition(tmdbId, seasonNumber, episodeNumber);
      // Don't offer resume near the very end (credits)
      if (savedPosition > 20 && (!duration || savedPosition < duration - 45)) {
        setResumeSeconds(savedPosition);
      } else {
        setResumeSeconds(0);
        // Binge continuation: try autoplay when landing on a fresh/next episode
        if (autoplayEnabled && savedPosition < 20) {
          videoRef.current.play().catch(() => {
            /* browser may require a gesture — user can press Play */
          });
        }
      }
    } else if (autoplayEnabled) {
      videoRef.current.play().catch(() => {});
    }
  };

  const onVideoTimeUpdate = () => {
    if (!isTvRoute || !isDirectVideo || !videoRef.current) return;
    const video = videoRef.current;
    const currentSecond = Math.floor(video.currentTime || 0);
    const duration = Number(video.duration || 0);

    if (currentSecond - lastSavedSecondRef.current >= 5) {
      lastSavedSecondRef.current = currentSecond;
      saveEpisodePosition(tmdbId, seasonNumber, episodeNumber, currentSecond);
    }

    // Netflix-style: surface "Next Episode" in the last ~45s (only once per episode)
    if (
      !nextUpDismissed &&
      !nextUpTriggeredRef.current &&
      duration > 90 &&
      currentSecond >= duration - 45
    ) {
      nextUpTriggeredRef.current = true;
      setShowNextUp(true);
      if (autoplayEnabled && nextCountdown === 0) {
        setNextCountdown(15);
      }
    }
  };

  const onVideoEnded = () => {
    if (!isTvRoute) {
      exitImmersive();
      return;
    }
    nextUpTriggeredRef.current = true;
    setShowNextUp(true);
    // Keep immersive so the Next Episode card stays full-screen readable
    immersiveRef.current = true;
    setImmersive(true);
    if (autoplayEnabled) {
      setNextCountdown((c) => (c > 0 ? c : 10));
    }
  };

  const dismissNextUp = () => {
    wasCountingRef.current = false;
    setShowNextUp(false);
    setNextCountdown(0);
    setNextUpDismissed(true);
  };

  const playNextEpisode = () => {
    if (!nextEpisodeTarget) return;
    wasCountingRef.current = false;
    setNextCountdown(0);
    setShowNextUp(false);
    goToTvEpisode(nextEpisodeTarget.season, nextEpisodeTarget.episode);
  };

  const resumePlayback = () => {
    if (!videoRef.current || !resumeSeconds) return;
    videoRef.current.currentTime = resumeSeconds;
    setResumeSeconds(0);
  };

  useEffect(() => {
    const isTypingTarget = (target) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
    };

    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;

      if (event.key === 'Escape' && immersiveRef.current) {
        event.preventDefault();
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
        exitImmersive();
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
      if (!isDirectVideo || !videoRef.current) return;

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
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDirectVideo, isTvRoute]);

  const compactControlClass =
    'inline-flex h-9 items-center gap-1.5 rounded-md border border-stone-600/80 bg-stone-900/80 px-3 text-xs font-medium text-stone-100 transition hover:border-amber-300/70 hover:bg-stone-800';
  const compactControlPrimaryClass =
    'inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-300 px-3 text-xs font-semibold text-stone-900 transition hover:bg-amber-200';
  const compactIconClass = 'h-3.5 w-3.5';

  const displayTitle = titleMeta ? getTitleName(titleMeta) : `Title #${tmdbId}`;

  return (
    <motion.main
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-stone-400">
        <Link
          to="/"
          className="text-amber-300 underline decoration-amber-400/60 underline-offset-2 hover:text-amber-200"
        >
          Discover
        </Link>
        <span>/</span>
        <Link
          to={`/title/${isTvRoute ? 'tv' : 'movie'}/${tmdbId}`}
          className="text-stone-300 hover:text-stone-100 transition"
        >
          {displayTitle}
        </Link>
        {isTvRoute && (
          <>
            <span>/</span>
            <span className="text-stone-200">
              S{seasonNumber} E{episodeNumber}
              {currentEpisodeMeta?.name ? ` · ${currentEpisodeMeta.name}` : ''}
            </span>
          </>
        )}
      </div>

      <motion.section
        className="rounded-2xl border border-stone-700/70 bg-gradient-to-br from-stone-900/95 via-stone-900/85 to-stone-950/90 p-4 sm:p-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-100 sm:text-2xl">
              {displayTitle}
              {isTvRoute && (
                <span className="ml-2 text-base font-normal text-stone-400">
                  S{seasonNumber}E{episodeNumber}
                </span>
              )}
            </h1>
            {currentEpisodeMeta?.name && (
              <p className="mt-1 text-sm text-stone-400">{currentEpisodeMeta.name}</p>
            )}
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
                title={`Source: ${providerSources.find((s) => s.id === playerSource)?.label || 'Unknown'}`}
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
                        <button
                          key={source.id}
                          type="button"
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
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-xs text-stone-400">
              <span className="font-medium text-stone-200">
                {providerSources.find((s) => s.id === playerSource)?.label || '—'}
              </span>
            </p>
          </div>
        </div>

        {!isSecureEmbed && hasEmbed && (
          <p className="mt-3 rounded border border-rose-700/60 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
            Non-HTTPS stream URL detected. Some browsers may block playback.
          </p>
        )}

        {/* TV controls */}
        {isTvRoute && (
          <div className="mt-4 rounded-xl border border-stone-700/70 bg-stone-950/70 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-stone-400">
                Season
                <input
                  type="number"
                  min="1"
                  value={seasonNumber}
                  onChange={(e) =>
                    goToTvEpisode(Number(e.target.value || 1), episodeNumber)
                  }
                  className="mt-1 h-9 w-20 rounded-md border border-stone-600 bg-stone-900 px-2 text-sm text-stone-100"
                />
              </label>
              <label className="text-xs text-stone-400">
                Episode
                <input
                  type="number"
                  min="1"
                  max={maxEpisodes || undefined}
                  value={episodeNumber}
                  onChange={(e) =>
                    goToTvEpisode(seasonNumber, Number(e.target.value || 1))
                  }
                  className="mt-1 h-9 w-20 rounded-md border border-stone-600 bg-stone-900 px-2 text-sm text-stone-100"
                />
              </label>

              <button
                type="button"
                onClick={goToPreviousEpisode}
                disabled={episodeNumber <= 1}
                className={`${compactControlClass} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <RotateCcw className={compactIconClass} />
                Prev
              </button>
              <button
                type="button"
                onClick={goToNextEpisode}
                className={compactControlPrimaryClass}
              >
                <RotateCw className={compactIconClass} />
                Next
              </button>
              <button
                type="button"
                onClick={() => setAutoplayEnabled((p) => !p)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition ${
                  autoplayEnabled
                    ? 'border-emerald-400/70 bg-emerald-950/40 text-emerald-200'
                    : 'border-stone-600 text-stone-300 hover:bg-stone-800'
                }`}
              >
                Autoplay {autoplayEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <p className="mt-2 text-xs text-stone-500">
              {seasonLoading && 'Loading episodes…'}
              {!seasonLoading && maxEpisodes && (
                <>Season {seasonNumber} · {maxEpisodes} episodes</>
              )}
              {seasonError && ` ${seasonError}`}
            </p>

            {!!episodeCards.length && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-stone-700/50 bg-stone-900/60 p-2">
                <div className="flex gap-2 pb-1">
                  {episodeCards.map((item) => {
                    const active = item.episode_number === episodeNumber;
                    return (
                      <button
                        key={item.id || `${seasonNumber}-${item.episode_number}`}
                        type="button"
                        onClick={() =>
                          goToTvEpisode(seasonNumber, item.episode_number)
                        }
                        className={`w-44 shrink-0 rounded-lg border p-2 text-left transition ${
                          active
                            ? 'border-amber-300 bg-amber-300/15'
                            : 'border-stone-600 bg-stone-900/80 hover:bg-stone-800'
                        }`}
                      >
                        <div className="mb-1.5 h-20 overflow-hidden rounded-md bg-stone-800">
                          {item.still_path ? (
                            <img
                              src={getBackdropUrl(item.still_path, 'w300')}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                              No image
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-100 line-clamp-1">
                          E{item.episode_number}: {item.name || 'Untitled'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player */}
        {hasEmbed ? (
          <div className="mt-4 space-y-4">
            {isDirectVideo ? (
              <>
                <div
                  ref={playerShellRef}
                  className={
                    immersive
                      ? 'fixed inset-0 z-[100] overflow-hidden bg-black'
                      : 'relative aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black'
                  }
                  onDoubleClick={onDoubleTap}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={{ filter: `brightness(${brightness})` }}
                >
                  <video
                    ref={videoRef}
                    className="h-full w-full"
                    controls={false}
                    playsInline
                    preload="metadata"
                    onPlay={onVideoPlay}
                    onPause={onVideoPause}
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
                  {/* Netflix-style Next Episode card (direct video, near end) */}
                  {isTvRoute && showNextUp && nextEpisodeTarget && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-3 pb-3 pt-16 sm:px-5 sm:pb-5">
                      <div className="pointer-events-auto ml-auto flex max-w-md flex-col gap-3 rounded-xl border border-white/15 bg-black/85 p-3 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center">
                        <div className="hidden h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-stone-800 sm:block">
                          {nextEpisodeTarget.still_path ? (
                            <img
                              src={getBackdropUrl(nextEpisodeTarget.still_path, 'w300')}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : titleMeta?.poster_path ? (
                            <img
                              src={getBackdropUrl(titleMeta.poster_path, 'w300')}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                              Next
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                            {nextEpisodeTarget.isSeasonFinale
                              ? 'Up next · New season'
                              : 'Up next'}
                          </p>
                          <p className="mt-0.5 truncate text-sm font-semibold text-white">
                            S{nextEpisodeTarget.season}E{nextEpisodeTarget.episode}
                            {nextEpisodeTarget.name
                              ? ` · ${nextEpisodeTarget.name}`
                              : ''}
                          </p>
                          {nextCountdown > 0 && (
                            <p className="mt-1 text-xs text-amber-200/90">
                              Playing in {nextCountdown}s
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={playNextEpisode}
                              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-950 transition hover:bg-amber-200"
                            >
                              <SkipForward className="h-3.5 w-3.5" />
                              Next Episode
                            </button>
                            <button
                              type="button"
                              onClick={dismissNextUp}
                              className="inline-flex items-center gap-1 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {immersive && (
                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current && !videoRef.current.paused) {
                          videoRef.current.pause();
                        } else {
                          exitImmersive();
                        }
                      }}
                      className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/90"
                    >
                      {isPlaying ? 'Pause & exit' : 'Exit'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button type="button" onClick={togglePlay} className={compactControlPrimaryClass}>
                    {isPlaying ? (
                      <Pause className={compactIconClass} />
                    ) : (
                      <Play className={compactIconClass} />
                    )}
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <button type="button" onClick={() => seekBy(-10)} className={compactControlClass}>
                    <RotateCcw className={compactIconClass} />
                    -10s
                  </button>
                  <button type="button" onClick={() => seekBy(10)} className={compactControlClass}>
                    <RotateCw className={compactIconClass} />
                    +10s
                  </button>
                  <button type="button" onClick={togglePip} className={compactControlClass}>
                    <PictureInPicture2 className={compactIconClass} />
                    {isPipActive ? 'Exit PiP' : 'PiP'}
                  </button>
                  <button type="button" onClick={lockLandscape} className={compactControlClass}>
                    <Maximize className={compactIconClass} />
                    Landscape
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="rounded-lg border border-stone-700/60 bg-stone-950/50 px-3 py-2 text-[11px] text-stone-400">
                    Mobile: double-tap left/right to seek · swipe right for volume, left for brightness
                  </p>
                  <p className="rounded-lg border border-stone-700/60 bg-stone-950/50 px-3 py-2 text-[11px] text-stone-400">
                    Keys: Space/K play · arrows seek & volume · N/P next/prev episode
                  </p>
                </div>
              </>
            ) : (
              <div
                ref={playerShellRef}
                className={
                  immersive
                    ? 'fixed inset-0 z-[100] flex flex-col bg-black'
                    : 'relative'
                }
              >
                {immersive && (
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/90 px-3 py-2">
                    <p className="truncate text-xs text-stone-300">
                      {displayTitle}
                      {isTvRoute ? ` · S${seasonNumber}E${episodeNumber}` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={exitImmersive}
                      className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                    >
                      Exit fullscreen
                    </button>
                  </div>
                )}
                <div
                  className={immersive ? 'min-h-0 flex-1' : undefined}
                  onDoubleClick={() => {
                    // Double-click embed chrome toggles theater (can't read play/pause inside iframe)
                    if (immersive) exitImmersive();
                    else enterImmersive();
                  }}
                >
                  <AdShieldPlayer
                    src={embedUrl}
                    title="Embedded player"
                    defaultEnabled
                    frameClassName={
                      immersive
                        ? 'h-full w-full overflow-hidden bg-black'
                        : 'aspect-video overflow-hidden rounded-xl border border-stone-700/80 bg-black shadow-lg'
                    }
                  />
                </div>
                {/* Embeds can't report time — offer a persistent Netflix-style Next control for TV */}
                {isTvRoute && nextEpisodeTarget && (
                  <div
                    className={`mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition ${
                      showNextUp
                        ? 'border-amber-400/50 bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-950 shadow-[0_0_24px_rgba(251,191,36,0.12)]'
                        : 'border-stone-700/70 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="hidden h-14 w-24 shrink-0 overflow-hidden rounded-md bg-stone-800 sm:block">
                        {nextEpisodeTarget.still_path ? (
                          <img
                            src={getBackdropUrl(nextEpisodeTarget.still_path, 'w300')}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-stone-500">
                            Next
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                          {nextEpisodeTarget.isSeasonFinale
                            ? 'Up next · New season'
                            : 'Up next'}
                        </p>
                        <p className="truncate text-sm font-medium text-stone-100">
                          S{nextEpisodeTarget.season}E{nextEpisodeTarget.episode}
                          {nextEpisodeTarget.name
                            ? ` · ${nextEpisodeTarget.name}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {nextCountdown > 0 && (
                        <span className="text-xs text-amber-200/90">
                          Auto in {nextCountdown}s
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={playNextEpisode}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-amber-300 px-3 text-xs font-semibold text-stone-900 transition hover:bg-amber-200"
                      >
                        <SkipForward className="h-3.5 w-3.5" />
                        Next Episode
                      </button>
                      {autoplayEnabled ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAutoplayEnabled(false);
                            setNextCountdown(0);
                          }}
                          className="inline-flex h-9 items-center rounded-md border border-stone-600 px-2.5 text-xs text-stone-300 hover:bg-stone-800"
                        >
                          Stop autoplay
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAutoplayEnabled(true)}
                          className="inline-flex h-9 items-center rounded-md border border-stone-600 px-2.5 text-xs text-stone-300 hover:bg-stone-800"
                        >
                          Enable autoplay
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {!immersive && isTvRoute && (
                  <p className="mt-2 text-[11px] text-stone-500">
                    Double-click the player to expand · Esc or Exit to restore
                  </p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-200/90">
              Playback comes from an external source. Quality and availability can vary.
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Player source not configured
            </div>
            <p className="mt-2 text-amber-200/90">
              Set embed URL templates in your environment:
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-amber-200/80 space-y-1">
              <li>
                VITE_LEGAL_PLAYER_URL_TEMPLATE_MOVIE=https://provider.com/movie/{'{tmdbId}'}
              </li>
              <li>
                VITE_LEGAL_PLAYER_URL_TEMPLATE_TV=https://provider.com/tv/{'{tmdbId}'}/{'{season}'}/{'{episode}'}
              </li>
            </ul>
          </div>
        )}

        <div className="mt-4">
          <Link
            to={`/title/${isTvRoute ? 'tv' : 'movie'}/${tmdbId}`}
            className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-200 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to details
          </Link>
        </div>
      </motion.section>
    </motion.main>
  );
}
// 
// 