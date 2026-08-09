export const APP_NAME = import.meta.env.VITE_APP_NAME || "Streamline";
export const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Inline SVG placeholders — no missing static assets required
export const FALLBACK_POSTER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">
      <rect width="342" height="513" fill="#1c1917"/>
      <rect x="24" y="24" width="294" height="465" rx="8" fill="#292524" stroke="#44403c"/>
      <text x="171" y="260" text-anchor="middle" fill="#a8a29e" font-family="system-ui,sans-serif" font-size="16">No poster</text>
    </svg>`,
  );

export const FALLBACK_BACKDROP =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#0c0a09"/>
      <text x="640" y="370" text-anchor="middle" fill="#78716c" font-family="system-ui,sans-serif" font-size="28">No image</text>
    </svg>`,
  );

export const HAS_TMDB_AUTH = Boolean(
  import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
);
