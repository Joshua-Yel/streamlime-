import axios from "axios";

const isDev = import.meta.env.MODE === "development";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_PROXY_URL = "/api/tmdb";
const tmdbReadToken = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

// Use direct TMDB API in dev (frontend keys), proxy in prod (backend keys)
const tmdbDirect = isDev
  ? axios.create({
      baseURL: TMDB_BASE_URL,
      headers: tmdbReadToken
        ? { Authorization: `Bearer ${tmdbReadToken}` }
        : {},
      timeout: 12000,
    })
  : null;

const responseCache = new Map();
const inFlight = new Map();
const bucketLastAt = new Map();
const TMDB_LANG_KEY = "streamline_tmdbLang";
const MAX_CONCURRENT_REQUESTS = 4;
const CACHE_SOFT_LIMIT = 180;

let activeRequests = 0;
const waitQueue = [];

function readPreferredLanguage() {
  try {
    const raw = localStorage.getItem(TMDB_LANG_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return typeof parsed === "string" && parsed.trim() ? parsed : "en-US";
  } catch {
    return "en-US";
  }
}

function acquireSlot() {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(resolve);
  });
}

function releaseSlot() {
  if (activeRequests > 0) {
    activeRequests -= 1;
  }
  if (waitQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    const next = waitQueue.shift();
    next();
  }
}

function pruneCache() {
  if (responseCache.size <= CACHE_SOFT_LIMIT) return;
  const now = Date.now();
  for (const [key, value] of responseCache) {
    if (value.expiresAt <= now) responseCache.delete(key);
  }
  while (responseCache.size > CACHE_SOFT_LIMIT) {
    const oldestKey = responseCache.keys().next().value;
    if (!oldestKey) break;
    responseCache.delete(oldestKey);
  }
}

export function clearTmdbCache() {
  responseCache.clear();
}

function buildKey(url, params = {}) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
  return `${url}?${query}`;
}

function getCache(key) {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCache(key, value, ttlMs) {
  if (!ttlMs) return;
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  pruneCache();
}

async function paceBucket(bucket, minGapMs) {
  if (!bucket || !minGapMs) return;
  const now = Date.now();
  const lastAt = bucketLastAt.get(bucket) || 0;
  const waitMs = minGapMs - (now - lastAt);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  bucketLastAt.set(bucket, Date.now());
}

function tmdbProxyGet(url, params = {}, config = {}) {
  return axios.get(TMDB_PROXY_URL, {
    timeout: 12000,
    ...config,
    params: { url: url.replace(/^\/+/, ""), ...params },
  });
}

function tmdbGet(url, params = {}, config = {}) {
  if (isDev && tmdbDirect) {
    return tmdbDirect.get(url, { ...config, params });
  }
  return tmdbProxyGet(url, params, config);
}

async function request(url, params = {}, options = {}) {
  const { ttlMs = 0, bucket = "default", minGapMs = 0, signal } = options;
  const key = buildKey(url, params);
  const cached = getCache(key);
  if (cached !== null) return { data: cached };

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    await paceBucket(bucket, minGapMs);
    await acquireSlot();
    try {
      const res = await tmdbGet(url, params, signal ? { signal } : {});
      setCache(key, res.data, ttlMs);
      return res;
    } finally {
      releaseSlot();
    }
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

function withLanguage(params = {}) {
  return { language: readPreferredLanguage(), ...params };
}

/* ---------- Lists ---------- */

export async function getTrending(timeWindow = "week") {
  const { data } = await request(
    `/trending/all/${timeWindow}`,
    withLanguage(),
    {
      ttlMs: 5 * 60 * 1000,
      bucket: "lists",
      minGapMs: 120,
    },
  );
  return data.results || [];
}

export async function getPopularMovies(page = 1) {
  const { data } = await request("/movie/popular", withLanguage({ page }), {
    ttlMs: 5 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getPopularTv(page = 1) {
  const { data } = await request("/tv/popular", withLanguage({ page }), {
    ttlMs: 5 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getTopRatedMovies(page = 1) {
  const { data } = await request("/movie/top_rated", withLanguage({ page }), {
    ttlMs: 10 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getTopRatedTv(page = 1) {
  const { data } = await request("/tv/top_rated", withLanguage({ page }), {
    ttlMs: 10 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getNowPlayingMovies(page = 1) {
  const { data } = await request("/movie/now_playing", withLanguage({ page }), {
    ttlMs: 5 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getUpcomingMovies(page = 1) {
  const { data } = await request("/movie/upcoming", withLanguage({ page }), {
    ttlMs: 10 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getAiringTodayTv(page = 1) {
  const { data } = await request("/tv/airing_today", withLanguage({ page }), {
    ttlMs: 5 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

export async function getOnTheAirTv(page = 1) {
  const { data } = await request("/tv/on_the_air", withLanguage({ page }), {
    ttlMs: 5 * 60 * 1000,
    bucket: "lists",
    minGapMs: 120,
  });
  return data.results || [];
}

/* ---------- Search ---------- */

export async function searchTitles(query, options = {}) {
  if (!query?.trim()) return [];
  const { data } = await request(
    "/search/multi",
    withLanguage({
      query: query.trim(),
      include_adult: false,
      page: options.page || 1,
    }),
    {
      ttlMs: 20 * 1000,
      bucket: "search",
      minGapMs: 260,
      signal: options.signal,
    },
  );
  return (data.results || []).filter(
    (item) => item.media_type === "movie" || item.media_type === "tv",
  );
}

export async function searchMovies(query, options = {}) {
  if (!query?.trim()) return [];
  const { data } = await request(
    "/search/movie",
    withLanguage({
      query: query.trim(),
      include_adult: false,
      page: options.page || 1,
    }),
    {
      ttlMs: 20 * 1000,
      bucket: "search",
      minGapMs: 260,
      signal: options.signal,
    },
  );
  return data.results || [];
}

export async function searchTv(query, options = {}) {
  if (!query?.trim()) return [];
  const { data } = await request(
    "/search/tv",
    withLanguage({
      query: query.trim(),
      include_adult: false,
      page: options.page || 1,
    }),
    {
      ttlMs: 20 * 1000,
      bucket: "search",
      minGapMs: 260,
      signal: options.signal,
    },
  );
  return data.results || [];
}

/* ---------- Details ---------- */

export async function getTitleDetails(mediaType, id) {
  const { data } = await request(
    `/${mediaType}/${id}`,
    withLanguage({
      append_to_response: "credits,keywords,content_ratings,release_dates",
    }),
    {
      ttlMs: 3 * 60 * 1000,
      bucket: "details",
      minGapMs: 100,
    },
  );
  return data;
}

export async function getTitleVideos(mediaType, id) {
  const { data } = await request(`/${mediaType}/${id}/videos`, withLanguage(), {
    ttlMs: 60 * 1000,
    bucket: "details",
    minGapMs: 100,
  });
  return data.results || [];
}

export async function getTitleCredits(mediaType, id) {
  const { data } = await request(
    `/${mediaType}/${id}/credits`,
    withLanguage(),
    {
      ttlMs: 5 * 60 * 1000,
      bucket: "details",
      minGapMs: 100,
    },
  );
  return data;
}

export async function getSimilar(mediaType, id, page = 1) {
  const { data } = await request(
    `/${mediaType}/${id}/similar`,
    withLanguage({ page }),
    { ttlMs: 5 * 60 * 1000, bucket: "details", minGapMs: 100 },
  );
  return data.results || [];
}

export async function getRecommendations(mediaType, id, page = 1) {
  const { data } = await request(
    `/${mediaType}/${id}/recommendations`,
    withLanguage({ page }),
    { ttlMs: 5 * 60 * 1000, bucket: "details", minGapMs: 100 },
  );
  return data.results || [];
}

export async function getWatchProviders(mediaType, id) {
  const { data } = await request(
    `/${mediaType}/${id}/watch/providers`,
    {},
    { ttlMs: 10 * 60 * 1000, bucket: "providers", minGapMs: 100 },
  );
  return data.results || {};
}

export async function getTvSeasonDetails(tvId, seasonNumber) {
  const { data } = await request(
    `/tv/${tvId}/season/${seasonNumber}`,
    withLanguage(),
    { ttlMs: 10 * 60 * 1000, bucket: "season", minGapMs: 100 },
  );
  return data;
}

export async function getTvEpisodeDetails(tvId, seasonNumber, episodeNumber) {
  const { data } = await request(
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,
    withLanguage(),
    { ttlMs: 10 * 60 * 1000, bucket: "season", minGapMs: 100 },
  );
  return data;
}

/* ---------- Genres & Discover ---------- */

export async function getMovieGenres() {
  const { data } = await request("/genre/movie/list", withLanguage(), {
    ttlMs: 24 * 60 * 60 * 1000,
    bucket: "genres",
    minGapMs: 100,
  });
  return data.genres || [];
}

export async function getTvGenres() {
  const { data } = await request("/genre/tv/list", withLanguage(), {
    ttlMs: 24 * 60 * 60 * 1000,
    bucket: "genres",
    minGapMs: 100,
  });
  return data.genres || [];
}

export async function getMoviesByGenre(genreId, page = 1, extra = {}) {
  const { data } = await request(
    "/discover/movie",
    withLanguage({
      with_genres: genreId,
      page,
      sort_by: extra.sort_by || "popularity.desc",
      "vote_count.gte": extra.minVotes || 50,
      ...extra,
    }),
    { ttlMs: 3 * 60 * 1000, bucket: "discover", minGapMs: 120 },
  );
  return {
    results: data.results || [],
    totalPages: data.total_pages || 1,
    page: data.page || 1,
  };
}

export async function getTvByGenre(genreId, page = 1, extra = {}) {
  const { data } = await request(
    "/discover/tv",
    withLanguage({
      with_genres: genreId,
      page,
      sort_by: extra.sort_by || "popularity.desc",
      "vote_count.gte": extra.minVotes || 50,
      ...extra,
    }),
    { ttlMs: 3 * 60 * 1000, bucket: "discover", minGapMs: 120 },
  );
  return {
    results: data.results || [],
    totalPages: data.total_pages || 1,
    page: data.page || 1,
  };
}

export async function discoverMovies(params = {}) {
  const { data } = await request(
    "/discover/movie",
    withLanguage({
      sort_by: "popularity.desc",
      "vote_count.gte": 40,
      ...params,
    }),
    { ttlMs: 3 * 60 * 1000, bucket: "discover", minGapMs: 120 },
  );
  return {
    results: data.results || [],
    totalPages: data.total_pages || 1,
    page: data.page || 1,
  };
}

export async function discoverTv(params = {}) {
  const { data } = await request(
    "/discover/tv",
    withLanguage({
      sort_by: "popularity.desc",
      "vote_count.gte": 40,
      ...params,
    }),
    { ttlMs: 3 * 60 * 1000, bucket: "discover", minGapMs: 120 },
  );
  return {
    results: data.results || [],
    totalPages: data.total_pages || 1,
    page: data.page || 1,
  };
}

/* ---------- People ---------- */

export async function getPersonDetails(personId) {
  const { data } = await request(
    `/person/${personId}`,
    withLanguage({
      append_to_response: "combined_credits,external_ids",
    }),
    {
      ttlMs: 10 * 60 * 1000,
      bucket: "details",
      minGapMs: 100,
    },
  );
  return data;
}

export async function searchPeople(query, options = {}) {
  if (!query?.trim()) return [];
  const { data } = await request(
    "/search/person",
    withLanguage({ query: query.trim(), page: options.page || 1 }),
    {
      ttlMs: 20 * 1000,
      bucket: "search",
      minGapMs: 260,
      signal: options.signal,
    },
  );
  return data.results || [];
}
