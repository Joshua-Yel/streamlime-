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
    })
  : null;

function tmdbProxyGet(url, params = {}) {
  return axios.get(TMDB_PROXY_URL, {
    params: { url: url.replace(/^\/$/, ""), ...params },
  });
}

function tmdbGet(url, params = {}) {
  if (isDev && tmdbDirect) {
    return tmdbDirect.get(url, { params });
  }
  return tmdbProxyGet(url, params);
}

function withLanguage(params = {}) {
  return {
    language: "en-US",
    ...params,
  };
}

export async function getTrending() {
  const { data } = await tmdbGet("/trending/all/week", withLanguage());
  return data.results || [];
}

export async function getPopularMovies() {
  const { data } = await tmdbGet("/movie/popular", withLanguage());
  return data.results || [];
}

export async function getPopularTv() {
  const { data } = await tmdbGet("/tv/popular", withLanguage());
  return data.results || [];
}

export async function searchTitles(query) {
  if (!query?.trim()) {
    return [];
  }
  const { data } = await tmdbGet(
    "/search/multi",
    withLanguage({
      query: query.trim(),
      include_adult: false,
    }),
  );
  return (data.results || []).filter(
    (item) => item.media_type === "movie" || item.media_type === "tv",
  );
}

export async function getTitleDetails(mediaType, id) {
  const { data } = await tmdbGet(`/${mediaType}/${id}`, withLanguage());
  return data;
}

export async function getTitleVideos(mediaType, id) {
  const { data } = await tmdbGet(`/${mediaType}/${id}/videos`, withLanguage());
  return data.results || [];
}

export async function getWatchProviders(mediaType, id) {
  const { data } = await tmdbGet(`/${mediaType}/${id}/watch/providers`);
  return data.results || {};
}

export async function getTvSeasonDetails(tvId, seasonNumber) {
  const { data } = await tmdbGet(
    `/tv/${tvId}/season/${seasonNumber}`,
    withLanguage(),
  );
  return data;
}

export async function getMovieGenres() {
  const { data } = await tmdbGet("/genre/movie/list", withLanguage());
  return data.genres || [];
}

export async function getTvGenres() {
  const { data } = await tmdbGet("/genre/tv/list", withLanguage());
  return data.genres || [];
}

export async function getMoviesByGenre(genreId, page = 1) {
  const { data } = await tmdbGet(
    "/discover/movie",
    withLanguage({
      with_genres: genreId,
      page,
      sort_by: "popularity.desc",
    }),
  );
  return data.results || [];
}

export async function getTvByGenre(genreId, page = 1) {
  const { data } = await tmdbGet(
    "/discover/tv",
    withLanguage({
      with_genres: genreId,
      page,
      sort_by: "popularity.desc",
    }),
  );
  return data.results || [];
}
