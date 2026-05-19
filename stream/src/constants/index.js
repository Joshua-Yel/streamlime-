export const APP_NAME = import.meta.env.VITE_APP_NAME || "Streamline";
export const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
export const FALLBACK_BACKDROP = "/images/fallback-backdrop.jpg";
export const FALLBACK_POSTER = "/images/fallback-poster.jpg";

export const HAS_TMDB_AUTH = Boolean(
  import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
);
