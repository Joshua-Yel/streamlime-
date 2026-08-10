/**
 * Local persistence for watch history, favorites, and watchlist (My List).
 * All data lives in localStorage under streamline.* keys.
 */

const WATCH_HISTORY_KEY = "streamline.watchHistory";
const FAVORITES_KEY = "streamline.favorites";
const WATCHLIST_KEY = "streamline.myList"; // same key as watchlist.js — unified

const MAX_HISTORY = 120;
const MAX_FAVORITES = 100;
const MAX_WATCHLIST = 80;

/* ---------- helpers ---------- */

function safeParse(raw, fallback) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
  return safeParse(localStorage.getItem(key), []);
}

function writeArray(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

function sameItem(a, b) {
  return Number(a.id) === Number(b.id) && a.mediaType === b.mediaType;
}

function normalizeEntry(entry) {
  return {
    id: Number(entry.id),
    mediaType: entry.mediaType === "tv" ? "tv" : "movie",
    title: entry.title || entry.name || "Untitled",
    poster_path: entry.poster_path || null,
    backdrop_path: entry.backdrop_path || null,
    vote_average: Number(entry.vote_average) || 0,
    release_date: entry.release_date || entry.first_air_date || null,
    first_air_date: entry.first_air_date || null,
    genre_ids: Array.isArray(entry.genre_ids) ? entry.genre_ids : [],
  };
}

/* ---------- Watch history ---------- */

export function loadWatchHistory() {
  const list = readArray(WATCH_HISTORY_KEY);
  return Array.isArray(list) ? list : [];
}

export function saveWatchHistoryEntry(entry) {
  if (!entry?.id || !entry?.mediaType) return loadWatchHistory();

  const normalized = {
    ...normalizeEntry(entry),
    watchedAt: entry.watchedAt || Date.now(),
    watchHour:
      typeof entry.watchHour === "number"
        ? entry.watchHour
        : new Date().getHours(),
    played: Boolean(entry.played),
  };

  const current = loadWatchHistory().filter(
    (item) => !sameItem(item, normalized),
  );
  const next = [normalized, ...current].slice(0, MAX_HISTORY);
  writeArray(WATCH_HISTORY_KEY, next);
  return next;
}

/** Mark a title as actually played (used by continue-watching for movies). */
export function markAsPlayed(id, mediaType, extra = {}) {
  const current = loadWatchHistory();
  const existing = current.find(
    (item) => item.id === Number(id) && item.mediaType === mediaType,
  );
  return saveWatchHistoryEntry({
    ...(existing || {}),
    id,
    mediaType,
    title: extra.title || existing?.title,
    poster_path: extra.poster_path ?? existing?.poster_path,
    vote_average: extra.vote_average ?? existing?.vote_average,
    genre_ids: extra.genre_ids || existing?.genre_ids || [],
    played: true,
    watchedAt: Date.now(),
  });
}

export function clearWatchHistory() {
  writeArray(WATCH_HISTORY_KEY, []);
}

/* ---------- Favorites ---------- */

export function loadFavorites() {
  const list = readArray(FAVORITES_KEY);
  return Array.isArray(list) ? list : [];
}

export function isFavorite(id, mediaType) {
  return loadFavorites().some(
    (item) => item.id === Number(id) && item.mediaType === mediaType,
  );
}

export function toggleFavorite(entry) {
  const current = loadFavorites();
  const normalized = normalizeEntry(entry);
  const exists = current.some((item) => sameItem(item, normalized));

  const next = exists
    ? current.filter((item) => !sameItem(item, normalized))
    : [
        {
          ...normalized,
          addedAt: Date.now(),
        },
        ...current,
      ].slice(0, MAX_FAVORITES);

  writeArray(FAVORITES_KEY, next);
  return { list: next, added: !exists };
}

export function removeFavorite(id, mediaType) {
  const next = loadFavorites().filter(
    (item) => !(item.id === Number(id) && item.mediaType === mediaType),
  );
  writeArray(FAVORITES_KEY, next);
  return next;
}

/* ---------- Watchlist / My List (unified storage) ---------- */

export function loadWatchlist() {
  const list = readArray(WATCHLIST_KEY);
  return Array.isArray(list) ? list : [];
}

/** Alias used by MyListPage / Home via watchlist.js */
export function loadMyList() {
  return loadWatchlist();
}

export function isInWatchlist(id, mediaType) {
  return loadWatchlist().some(
    (item) => item.id === Number(id) && item.mediaType === mediaType,
  );
}

export function isInMyList(id, mediaType) {
  return isInWatchlist(id, mediaType);
}

export function toggleWatchlist(entry) {
  const current = loadWatchlist();
  const normalized = normalizeEntry(entry);
  const exists = current.some((item) => sameItem(item, normalized));

  const next = exists
    ? current.filter((item) => !sameItem(item, normalized))
    : [
        {
          ...normalized,
          addedAt: Date.now(),
        },
        ...current,
      ].slice(0, MAX_WATCHLIST);

  writeArray(WATCHLIST_KEY, next);
  return { list: next, added: !exists };
}

export function toggleMyListItem(entry) {
  return toggleWatchlist(entry);
}

export function removeFromWatchlist(id, mediaType) {
  const next = loadWatchlist().filter(
    (item) => !(item.id === Number(id) && item.mediaType === mediaType),
  );
  writeArray(WATCHLIST_KEY, next);
  return next;
}

export function removeFromMyList(id, mediaType) {
  return removeFromWatchlist(id, mediaType);
}

/* ---------- "Because you watched" helper ---------- */

/**
 * Simple genre-overlap recommendations from the local catalog + history.
 * Used by Home.jsx. Expects a flat catalog of TMDB-like items.
 */
export function buildBecauseYouWatched(catalog = [], history = [], limit = 14) {
  if (!catalog.length) return [];

  const recent = (history.length ? history : loadWatchHistory()).slice(0, 8);
  if (!recent.length) {
    // Cold start: high-rated popular-looking items
    return catalog
      .filter((i) => (i.vote_average || 0) >= 7 && i.poster_path)
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, limit);
  }

  const watchedKeys = new Set(
    recent.map((h) => `${h.mediaType || h.media_type}-${h.id}`),
  );
  const genreScores = new Map();

  recent.forEach((h, index) => {
    const weight = recent.length - index;
    (h.genre_ids || []).forEach((gid) => {
      genreScores.set(gid, (genreScores.get(gid) || 0) + weight);
    });
  });

  const scored = catalog
    .filter((item) => {
      const type = item.media_type || (item.first_air_date ? "tv" : "movie");
      const key = `${type}-${item.id}`;
      return !watchedKeys.has(key) && item.poster_path;
    })
    .map((item) => {
      const genres = item.genre_ids || [];
      let score = 0;
      genres.forEach((gid) => {
        score += genreScores.get(gid) || 0;
      });
      // slight boost for rating
      score += (item.vote_average || 0) * 0.15;
      return { item, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.item);
}
