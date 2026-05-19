const WATCH_HISTORY_KEY = "streamline.watchHistory";

export const MOOD_PRESETS = {
  chill: {
    label: "Chill Night",
    genres: [35, 10751, 10749],
  },
  thrill: {
    label: "Adrenaline",
    genres: [28, 53, 80],
  },
  dark: {
    label: "Dark Vibes",
    genres: [27, 9648],
  },
  mind: {
    label: "Mind Bender",
    genres: [878, 9648, 18],
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
  const next = [entry, ...filtered].slice(0, 40);
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(next));
  return next;
}

function getItemGenreIds(item) {
  if (Array.isArray(item.genre_ids) && item.genre_ids.length) {
    return item.genre_ids;
  }
  if (Array.isArray(item.genres) && item.genres.length) {
    return item.genres.map((genre) => genre.id);
  }
  return [];
}

function scoreCandidate(candidate, history, nowHour) {
  const candidateGenres = getItemGenreIds(candidate);
  if (!candidateGenres.length) {
    return 0;
  }

  const historyByRecency = history.slice(0, 12);
  let score = 0;

  historyByRecency.forEach((entry, index) => {
    const recencyWeight = Math.max(1, 12 - index);
    const overlap = candidateGenres.filter((genreId) =>
      (entry.genre_ids || []).includes(genreId),
    ).length;
    score += overlap * recencyWeight;

    if (
      entry.mediaType ===
      (candidate.media_type || (candidate.first_air_date ? "tv" : "movie"))
    ) {
      score += 1.2;
    }

    if (
      typeof entry.watchHour === "number" &&
      Math.abs(entry.watchHour - nowHour) <= 2
    ) {
      score += overlap * 0.8;
    }
  });

  score += (candidate.vote_average || 0) * 0.2;
  return score;
}

export function buildBecauseYouWatched(catalog, history) {
  if (!history.length) {
    return [];
  }

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
    .map((item) => ({ item, score: scoreCandidate(item, history, nowHour) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18)
    .map((entry) => entry.item);
}

export function buildMoodSuggestions(catalog, moodKey) {
  const mood = MOOD_PRESETS[moodKey] || MOOD_PRESETS.chill;
  const selected = catalog
    .filter((item) => {
      const genres = getItemGenreIds(item);
      return genres.some((genreId) => mood.genres.includes(genreId));
    })
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    .slice(0, 18);

  return selected;
}
