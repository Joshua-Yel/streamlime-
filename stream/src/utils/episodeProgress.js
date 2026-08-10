/**
 * TV series progress + per-episode scrub position.
 * Keys are shared with continueWatching.js.
 */

const SERIES_PROGRESS_KEY = "streamline.seriesProgress";
const EPISODE_POSITION_KEY = "streamline.episodePositions";

function safeParse(raw, fallback) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadAllSeriesProgress() {
  try {
    return safeParse(localStorage.getItem(SERIES_PROGRESS_KEY), {});
  } catch {
    return {};
  }
}

function saveAllSeriesProgress(data) {
  try {
    localStorage.setItem(SERIES_PROGRESS_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

function loadAllPositions() {
  try {
    return safeParse(localStorage.getItem(EPISODE_POSITION_KEY), {});
  } catch {
    return {};
  }
}

function saveAllPositions(data) {
  try {
    localStorage.setItem(EPISODE_POSITION_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function positionKey(seriesId, season, episode) {
  return `${seriesId}:${Number(season)}:${Number(episode)}`;
}

/** mm:ss or h:mm:ss for resume badges */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * @returns {{ lastSeason: number, lastEpisode: number, updatedAt?: number, title?: string, poster_path?: string } | null}
 */
export function getSeriesProgress(seriesId) {
  const all = loadAllSeriesProgress();
  const entry = all[String(seriesId)];
  if (!entry?.lastSeason || !entry?.lastEpisode) return null;
  return {
    lastSeason: Number(entry.lastSeason),
    lastEpisode: Number(entry.lastEpisode),
    updatedAt: entry.updatedAt || 0,
    title: entry.title,
    poster_path: entry.poster_path,
    backdrop_path: entry.backdrop_path,
    vote_average: entry.vote_average,
    first_air_date: entry.first_air_date,
  };
}

/**
 * Persist last watched episode. Optional meta keeps Continue Watching populated offline.
 */
export function saveSeriesEpisode(seriesId, season, episode, meta = {}) {
  const id = String(seriesId);
  const all = loadAllSeriesProgress();
  const prev = all[id] || {};

  all[id] = {
    ...prev,
    lastSeason: Math.max(1, Number(season) || 1),
    lastEpisode: Math.max(1, Number(episode) || 1),
    updatedAt: Date.now(),
    ...(meta.title != null ? { title: meta.title } : {}),
    ...(meta.poster_path != null ? { poster_path: meta.poster_path } : {}),
    ...(meta.backdrop_path != null
      ? { backdrop_path: meta.backdrop_path }
      : {}),
    ...(meta.vote_average != null ? { vote_average: meta.vote_average } : {}),
    ...(meta.first_air_date != null
      ? { first_air_date: meta.first_air_date }
      : {}),
  };

  saveAllSeriesProgress(all);
  return all[id];
}

export function clearSeriesProgress(seriesId) {
  const all = loadAllSeriesProgress();
  delete all[String(seriesId)];
  saveAllSeriesProgress(all);
}

export function clearAllSeriesProgress() {
  saveAllSeriesProgress({});
}

export function getAllSeriesProgress() {
  return loadAllSeriesProgress();
}

/** Seconds into a specific episode (for direct-video resume). */
export function getEpisodePosition(seriesId, season, episode) {
  const all = loadAllPositions();
  const value = all[positionKey(seriesId, season, episode)];
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function saveEpisodePosition(seriesId, season, episode, seconds) {
  const n = Math.max(0, Math.floor(Number(seconds) || 0));
  const all = loadAllPositions();
  const key = positionKey(seriesId, season, episode);

  if (n < 5) {
    // Near the start — clear so we don't always offer resume
    delete all[key];
  } else {
    all[key] = n;
  }

  // Bound size: keep newest ~200 keys
  const keys = Object.keys(all);
  if (keys.length > 200) {
    // Drop arbitrary oldest-ish entries (keys are not ordered by time; fine for soft limit)
    keys.slice(0, keys.length - 200).forEach((k) => delete all[k]);
  }

  saveAllPositions(all);
  return n;
}

export function clearEpisodePosition(seriesId, season, episode) {
  const all = loadAllPositions();
  delete all[positionKey(seriesId, season, episode)];
  saveAllPositions(all);
}
