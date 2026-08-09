const SERIES_PROGRESS_KEY = "streamline.seriesProgress";

function loadAllProgress() {
  try {
    const raw = localStorage.getItem(SERIES_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllProgress(progress) {
  localStorage.setItem(SERIES_PROGRESS_KEY, JSON.stringify(progress));
}

export function getSeriesProgress(seriesId) {
  const all = loadAllProgress();
  return all[String(seriesId)] || null;
}

/**
 * @param {string|number} seriesId
 * @param {number} season
 * @param {number} episode
 * @param {object} [meta] optional title/poster so Continue Watching has real cards
 */
export function saveSeriesEpisode(seriesId, season, episode, meta = {}) {
  const all = loadAllProgress();
  const key = String(seriesId);
  const current = all[key] || {};

  all[key] = {
    ...current,
    lastSeason: Number(season),
    lastEpisode: Number(episode),
    updatedAt: Date.now(),
    // Keep previous meta unless new values are provided
    title: meta.title || meta.name || current.title || undefined,
    poster_path:
      meta.poster_path !== undefined
        ? meta.poster_path
        : current.poster_path || undefined,
    backdrop_path:
      meta.backdrop_path !== undefined
        ? meta.backdrop_path
        : current.backdrop_path || undefined,
    vote_average:
      meta.vote_average !== undefined
        ? meta.vote_average
        : current.vote_average,
    first_air_date: meta.first_air_date || current.first_air_date || undefined,
  };

  // Drop undefined keys to keep storage clean
  Object.keys(all[key]).forEach((k) => {
    if (all[key][k] === undefined) delete all[key][k];
  });

  saveAllProgress(all);
  return all[key];
}

export function getEpisodePosition(seriesId, season, episode) {
  const progress = getSeriesProgress(seriesId);
  if (!progress?.positions) return 0;
  const key = `${Number(season)}-${Number(episode)}`;
  return Number(progress.positions[key] || 0);
}

export function saveEpisodePosition(
  seriesId,
  season,
  episode,
  seconds,
  meta = {},
) {
  const all = loadAllProgress();
  const key = String(seriesId);
  const current = all[key] || {};
  const positions = current.positions || {};
  const positionKey = `${Number(season)}-${Number(episode)}`;

  all[key] = {
    ...current,
    lastSeason: Number(season),
    lastEpisode: Number(episode),
    updatedAt: Date.now(),
    positions: {
      ...positions,
      [positionKey]: Math.max(0, Math.floor(Number(seconds) || 0)),
    },
    title: meta.title || meta.name || current.title,
    poster_path:
      meta.poster_path !== undefined ? meta.poster_path : current.poster_path,
    backdrop_path:
      meta.backdrop_path !== undefined
        ? meta.backdrop_path
        : current.backdrop_path,
    vote_average:
      meta.vote_average !== undefined
        ? meta.vote_average
        : current.vote_average,
    first_air_date: meta.first_air_date || current.first_air_date,
  };

  Object.keys(all[key]).forEach((k) => {
    if (all[key][k] === undefined) delete all[key][k];
  });

  saveAllProgress(all);
  return all[key];
}

export function clearSeriesProgress(seriesId) {
  const all = loadAllProgress();
  delete all[String(seriesId)];
  saveAllProgress(all);
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function getContinueWatchingSeries(limit = 12) {
  const all = loadAllProgress();
  return Object.entries(all)
    .map(([id, data]) => ({
      seriesId: Number(id),
      lastSeason: data.lastSeason,
      lastEpisode: data.lastEpisode,
      updatedAt: data.updatedAt || 0,
      positions: data.positions || {},
      title: data.title,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      vote_average: data.vote_average,
      first_air_date: data.first_air_date,
    }))
    .filter((e) => e.lastSeason && e.lastEpisode)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}
