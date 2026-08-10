/**
 * My List / Watchlist — storage unified with recommendations under streamline.myList.
 */

const MY_LIST_KEY = "streamline.myList";
const MAX_WATCHLIST = 80;

function safeParse(raw, fallback) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadMyList() {
  try {
    const raw = localStorage.getItem(MY_LIST_KEY);
    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isInMyList(id, mediaType) {
  const list = loadMyList();
  return list.some(
    (item) => item.id === Number(id) && item.mediaType === mediaType,
  );
}

export function toggleMyListItem(entry) {
  const current = loadMyList();
  const id = Number(entry.id);
  const mediaType = entry.mediaType === "tv" ? "tv" : "movie";
  const exists = current.some(
    (item) => item.id === id && item.mediaType === mediaType,
  );

  const next = exists
    ? current.filter(
        (item) => !(item.id === id && item.mediaType === mediaType),
      )
    : [
        {
          id,
          mediaType,
          title: entry.title || entry.name || "Untitled",
          poster_path: entry.poster_path || null,
          backdrop_path: entry.backdrop_path || null,
          vote_average: Number(entry.vote_average) || 0,
          release_date: entry.release_date || entry.first_air_date || null,
          first_air_date: entry.first_air_date || null,
          genre_ids: Array.isArray(entry.genre_ids) ? entry.genre_ids : [],
          addedAt: Date.now(),
        },
        ...current,
      ].slice(0, MAX_WATCHLIST);

  try {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }

  return { list: next, added: !exists };
}

export function removeFromMyList(id, mediaType) {
  const next = loadMyList().filter(
    (item) => !(item.id === Number(id) && item.mediaType === mediaType),
  );
  try {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function isInWatchlist(id, mediaType) {
  return isInMyList(id, mediaType);
}

export function toggleWatchlist(entry) {
  return toggleMyListItem(entry);
}
