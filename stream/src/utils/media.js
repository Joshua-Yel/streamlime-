import { TMDB_IMAGE_BASE } from '../constants';

export function getTitleName(item) {
  return item.title || item.name || 'Untitled';
}

export function getReleaseYear(item) {
  const date = item.release_date || item.first_air_date;
  if (!date) {
    return 'TBA';
  }
  return date.slice(0, 4);
}

export function getMediaType(item) {
  return item.media_type || (item.first_air_date ? 'tv' : 'movie');
}

export function getPosterUrl(path) {
  return path ? `${TMDB_IMAGE_BASE}/w500${path}` : '';
}

export function getBackdropUrl(path) {
  return path ? `${TMDB_IMAGE_BASE}/w1280${path}` : '';
}

export function formatRating(voteAverage) {
  if (!voteAverage) {
    return 'N/A';
  }
  return voteAverage.toFixed(1);
}
