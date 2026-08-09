import { TMDB_IMAGE_BASE } from "../constants";

export function getTitleName(item) {
  return item?.title || item?.name || "Untitled";
}

export function getReleaseYear(item) {
  const date = item?.release_date || item?.first_air_date;
  if (!date) return "TBA";
  return date.slice(0, 4);
}

export function getReleaseDate(item) {
  return item?.release_date || item?.first_air_date || null;
}

export function getMediaType(item) {
  if (item?.media_type) return item.media_type;
  if (item?.first_air_date || item?.number_of_seasons != null) return "tv";
  return "movie";
}

export function getPosterUrl(path, size = "w500") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "";
}

export function getBackdropUrl(path, size = "w1280") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "";
}

export function getProfileUrl(path, size = "w185") {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : "";
}

export function formatRating(voteAverage) {
  if (voteAverage == null || Number.isNaN(Number(voteAverage))) return "N/A";
  return Number(voteAverage).toFixed(1);
}

export function formatRuntime(minutes) {
  if (!minutes) return "";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) return `${mins}m`;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function formatVoteCount(count) {
  if (!count) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function getContentRating(details, region = "US") {
  // Movies use release_dates
  const movieResults = details?.release_dates?.results;
  if (Array.isArray(movieResults)) {
    const regionEntry =
      movieResults.find((r) => r.iso_3166_1 === region) ||
      movieResults.find((r) => r.iso_3166_1 === "US") ||
      movieResults[0];
    const cert = regionEntry?.release_dates?.find(
      (d) => d.certification,
    )?.certification;
    if (cert) return cert;
  }

  // TV uses content_ratings
  const tvResults = details?.content_ratings?.results;
  if (Array.isArray(tvResults)) {
    const regionEntry =
      tvResults.find((r) => r.iso_3166_1 === region) ||
      tvResults.find((r) => r.iso_3166_1 === "US") ||
      tvResults[0];
    if (regionEntry?.rating) return regionEntry.rating;
  }

  return null;
}

export function getDirectors(credits) {
  if (!credits?.crew) return [];
  return credits.crew.filter((c) => c.job === "Director").slice(0, 4);
}

export function getMainCast(credits, limit = 8) {
  if (!credits?.cast) return [];
  return credits.cast.slice(0, limit);
}

export function buildTitlePath(item) {
  const type = getMediaType(item);
  return `/title/${type}/${item.id}`;
}

export function buildWatchPath(item, season = 1, episode = 1) {
  const type = getMediaType(item);
  if (type === "tv") return `/tv/${item.id}/${season}/${episode}`;
  return `/movie/${item.id}`;
}
