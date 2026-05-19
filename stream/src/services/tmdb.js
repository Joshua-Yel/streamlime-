import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const tmdbReadToken = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: tmdbReadToken
    ? {
        Authorization: `Bearer ${tmdbReadToken}`,
      }
    : {},
});

function withLanguage(params = {}) {
  return {
    language: 'en-US',
    ...params,
  };
}

export async function getTrending() {
  const { data } = await tmdb.get('/trending/all/week', { params: withLanguage() });
  return data.results || [];
}

export async function getPopularMovies() {
  const { data } = await tmdb.get('/movie/popular', { params: withLanguage() });
  return data.results || [];
}

export async function getPopularTv() {
  const { data } = await tmdb.get('/tv/popular', { params: withLanguage() });
  return data.results || [];
}

export async function searchTitles(query) {
  if (!query?.trim()) {
    return [];
  }

  const { data } = await tmdb.get('/search/multi', {
    params: withLanguage({
      query: query.trim(),
      include_adult: false,
    }),
  });

  return (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getTitleDetails(mediaType, id) {
  const { data } = await tmdb.get(`/${mediaType}/${id}`, { params: withLanguage() });
  return data;
}

export async function getTitleVideos(mediaType, id) {
  const { data } = await tmdb.get(`/${mediaType}/${id}/videos`, { params: withLanguage() });
  return data.results || [];
}

export async function getWatchProviders(mediaType, id) {
  const { data } = await tmdb.get(`/${mediaType}/${id}/watch/providers`);
  return data.results || {};
}
