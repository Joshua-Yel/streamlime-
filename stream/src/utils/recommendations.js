const WATCH_HISTORY_KEY = "streamline.watchHistory";
const FAVORITES_KEY = "streamline.favorites";
const WATCHLIST_KEY = "streamline.watchlist";

const LIMITS = {
  watchHistory: 50,
  favorites: 80,
  watchlist: 100,
  recommendations: 18,
  continueWatchingDefault: 8,
};

export const GENRE_IDS = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCI_FI: 878,
  TV_MOVIE: 10770,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
  ACTION_ADVENTURE_TV: 10759,
  KIDS_TV: 10762,
  NEWS_TV: 10763,
  REALITY_TV: 10764,
  SCI_FI_FANTASY_TV: 10765,
  SOAP_TV: 10766,
  TALK_TV: 10767,
  WAR_POLITICS_TV: 10768,
};

export const GENRE_NAMES = Object.fromEntries(
  Object.entries(GENRE_IDS).map(([key, id]) => [
    id,
    key
      .replace(/_TV$/, "")
      .split("_")
      .map((word) => word[0] + word.slice(1).toLowerCase())
      .join(" "),
  ]),
);

const G = GENRE_IDS;

export const MOOD_PRESETS = {
  chill: {
    label: "Chill Night",
    genres: [G.COMEDY, G.FAMILY, G.ROMANCE],
    description: "Comedy, family, and romance",
  },
  thrill: {
    label: "Adrenaline",
    genres: [G.ACTION, G.THRILLER, G.CRIME],
    description: "Action, thriller, crime",
  },
  dark: {
    label: "Dark Vibes",
    genres: [G.HORROR, G.MYSTERY],
    description: "Horror and mystery",
  },
  mind: {
    label: "Mind Bender",
    genres: [G.SCI_FI, G.MYSTERY, G.DRAMA],
    description: "Sci-fi, mystery, drama",
  },
  feelgood: {
    label: "Feel Good",
    genres: [G.COMEDY, G.FAMILY, G.ANIMATION, G.FANTASY],
    description: "Comedy, family, animation, fantasy",
  },
};

export function loadWatchHistory() {
  try {
    const raw = localStorage.getItem(WATCH_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchHistoryEntry(entry) {
  const current = loadWatchHistory();
  const filtered = current.filter(
    (item) => !(item.id === entry.id && item.mediaType === entry.mediaType),
  );
  const next = [entry, ...filtered].slice(0, LIMITS.watchHistory);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearWatchHistory() {
  localStorage.removeItem(WATCH_HISTORY_KEY);
}

export function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavorite(id, mediaType) {
  return loadFavorites().some(
    (f) => f.id === Number(id) && f.mediaType === mediaType,
  );
}

export function toggleFavorite(entry) {
  const current = loadFavorites();
  const exists = current.some(
    (f) => f.id === entry.id && f.mediaType === entry.mediaType,
  );
  const next = exists
    ? current.filter(
        (f) => !(f.id === entry.id && f.mediaType === entry.mediaType),
      )
    : [
        {
          id: Number(entry.id),
          mediaType: entry.mediaType,
          title: entry.title || "Untitled",
          poster_path: entry.poster_path || null,
          vote_average: entry.vote_average || null,
          addedAt: Date.now(),
        },
        ...current,
      ].slice(0, LIMITS.favorites);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return { list: next, added: !exists };
}

export function loadWatchlist() {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isInWatchlist(id, mediaType) {
  return loadWatchlist().some(
    (w) => w.id === Number(id) && w.mediaType === mediaType,
  );
}

export function toggleWatchlist(entry) {
  const current = loadWatchlist();
  const exists = current.some(
    (w) => w.id === entry.id && w.mediaType === entry.mediaType,
  );
  const next = exists
    ? current.filter(
        (w) => !(w.id === entry.id && w.mediaType === entry.mediaType),
      )
    : [
        {
          id: Number(entry.id),
          mediaType: entry.mediaType,
          title: entry.title || "Untitled",
          poster_path: entry.poster_path || null,
          vote_average: entry.vote_average || null,
          addedAt: Date.now(),
        },
        ...current,
      ].slice(0, LIMITS.watchlist);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  return { list: next, added: !exists };
}

export const SCORE_WEIGHTS = {
  historyLookback: 14,
  maxRecencyWeight: 14,
  mediaTypeMatchBonus: 1.4,
  timeOfDayMatchWeight: 0.9,
  timeOfDayWindowHours: 2,
  ratingWeight: 0.25,
  popularVoteBonus: 0.8,
  popularVoteThreshold: 500,
};

export function getItemGenreIds(item) {
  if (Array.isArray(item.genre_ids) && item.genre_ids.length) {
    return item.genre_ids;
  }
  if (Array.isArray(item.genres) && item.genres.length) {
    return item.genres.map((genre) => genre.id);
  }
  return [];
}

function scoreCandidate(candidate, history, nowHour, weights = SCORE_WEIGHTS) {
  const candidateGenres = getItemGenreIds(candidate);
  if (!candidateGenres.length) return 0;

  const recentHistory = history.slice(0, weights.historyLookback);
  let score = 0;

  recentHistory.forEach((entry, index) => {
    const recencyWeight = Math.max(1, weights.maxRecencyWeight - index);
    const overlap = candidateGenres.filter((genreId) =>
      (entry.genre_ids || []).includes(genreId),
    ).length;
    score += overlap * recencyWeight;

    const candidateType =
      candidate.media_type || (candidate.first_air_date ? "tv" : "movie");
    if (entry.mediaType === candidateType) {
      score += weights.mediaTypeMatchBonus;
    }

    if (
      typeof entry.watchHour === "number" &&
      Math.abs(entry.watchHour - nowHour) <= weights.timeOfDayWindowHours
    ) {
      score += overlap * weights.timeOfDayMatchWeight;
    }
  });

  score += (candidate.vote_average || 0) * weights.ratingWeight;
  if ((candidate.vote_count || 0) > weights.popularVoteThreshold) {
    score += weights.popularVoteBonus;
  }
  return score;
}

export function buildBecauseYouWatched(
  catalog,
  history,
  weights = SCORE_WEIGHTS,
) {
  if (!history.length) return [];

  const excluded = new Set(
    history.map((item) => `${item.mediaType}-${item.id}`),
  );
  const nowHour = new Date().getHours();

  return catalog
    .filter((item) => {
      const mediaType =
        item.media_type || (item.first_air_date ? "tv" : "movie");
      return !excluded.has(`${mediaType}-${item.id}`);
    })
    .map((item) => ({
      item,
      score: scoreCandidate(item, history, nowHour, weights),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, LIMITS.recommendations)
    .map((entry) => entry.item);
}

export function buildMoodSuggestions(catalog, moodKey) {
  const mood = MOOD_PRESETS[moodKey] || MOOD_PRESETS.chill;
  return catalog
    .filter((item) => {
      const genres = getItemGenreIds(item);
      return genres.some((genreId) => mood.genres.includes(genreId));
    })
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, LIMITS.recommendations);
}

export function getContinueWatching(
  history,
  limit = LIMITS.continueWatchingDefault,
) {
  return history.slice(0, limit);
}
