import { loadWatchHistory } from "./recommendations";
import { getTitleDetails } from "../services/tmdb";

const SERIES_PROGRESS_KEY = "streamline.seriesProgress";

function loadAllSeriesProgress() {
  try {
    const raw = localStorage.getItem(SERIES_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function needsHydration(item) {
  // Missing poster or still showing the fallback "Series 123" label
  const title = item.title || item.name || "";
  const isFallback = /^Series\s+\d+$/i.test(title);
  return !item.poster_path || isFallback || !item.vote_average;
}

/**
 * Builds Continue Watching from series progress + movie play history.
 * Sync version — uses whatever is already in localStorage / history.
 * Prefer buildContinueWatchingAsync when you can await.
 */
export function buildContinueWatching(limit = 18) {
  const seriesProgress = loadAllSeriesProgress();
  const history = loadWatchHistory();
  const items = [];

  Object.entries(seriesProgress).forEach(([seriesId, progress]) => {
    if (!progress?.lastSeason || !progress?.lastEpisode) return;

    const historyMatch = history.find(
      (entry) =>
        entry.mediaType === "tv" && String(entry.id) === String(seriesId),
    );

    const title = progress.title || historyMatch?.title || `Series ${seriesId}`;

    items.push({
      id: Number(seriesId),
      media_type: "tv",
      title,
      name: title,
      poster_path: progress.poster_path || historyMatch?.poster_path || null,
      backdrop_path:
        progress.backdrop_path || historyMatch?.backdrop_path || null,
      vote_average: progress.vote_average || historyMatch?.vote_average || 0,
      first_air_date:
        progress.first_air_date || historyMatch?.release_date || null,
      genre_ids: historyMatch?.genre_ids || [],
      continueSeason: Number(progress.lastSeason),
      continueEpisode: Number(progress.lastEpisode),
      updatedAt: progress.updatedAt || 0,
      continueLabel: `S${progress.lastSeason} · E${progress.lastEpisode}`,
    });
  });

  history
    .filter((entry) => entry.mediaType === "movie" && entry.played)
    .forEach((entry) => {
      items.push({
        id: entry.id,
        media_type: "movie",
        title: entry.title,
        name: entry.title,
        poster_path: entry.poster_path || null,
        backdrop_path: entry.backdrop_path || null,
        vote_average: entry.vote_average || 0,
        release_date: entry.release_date || null,
        genre_ids: entry.genre_ids || [],
        updatedAt: entry.watchedAt || 0,
        continueLabel: "Resume",
      });
    });

  const seen = new Set();
  return items
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter((item) => {
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/**
 * Same as buildContinueWatching, but fills missing title/poster/rating
 * from TMDB so MovieCard never shows blank / 0.0 / "Series 123".
 * Also writes meta back into seriesProgress for next time.
 */
export async function buildContinueWatchingAsync(limit = 18) {
  const base = buildContinueWatching(limit);
  const seriesProgress = loadAllSeriesProgress();

  const hydrated = await Promise.all(
    base.map(async (item) => {
      if (item.media_type !== "tv" || !needsHydration(item)) {
        return item;
      }

      try {
        const details = await getTitleDetails("tv", item.id);
        const title = details?.name || details?.original_name || item.title;
        const poster_path = details?.poster_path || item.poster_path;
        const backdrop_path = details?.backdrop_path || item.backdrop_path;
        const vote_average = details?.vote_average ?? item.vote_average;
        const first_air_date = details?.first_air_date || item.first_air_date;

        // Persist so next visit is instant
        const key = String(item.id);
        const current = seriesProgress[key] || {};
        seriesProgress[key] = {
          ...current,
          title,
          poster_path,
          backdrop_path,
          vote_average,
          first_air_date,
        };

        return {
          ...item,
          title,
          name: title,
          poster_path,
          backdrop_path,
          vote_average,
          first_air_date,
        };
      } catch {
        return item;
      }
    }),
  );

  try {
    localStorage.setItem(SERIES_PROGRESS_KEY, JSON.stringify(seriesProgress));
  } catch {
    /* ignore quota errors */
  }

  return hydrated;
}
