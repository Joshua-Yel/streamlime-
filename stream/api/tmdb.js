// Vercel serverless function: /api/tmdb
// Proxies TMDB API requests and injects your secret key from environment variables

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 90;
const ipBuckets = new Map();

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function exceededRateLimit(ip) {
  const now = Date.now();
  const floor = now - WINDOW_MS;
  const hits = (ipBuckets.get(ip) || []).filter((t) => t >= floor);
  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    ipBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipBuckets.set(ip, hits);
  return false;
}

function cleanEndpoint(input) {
  const value = String(input || "")
    .replace(/^\/+/, "")
    .trim();
  if (!value || value.includes("://")) {
    return null;
  }
  return value;
}

export default async function handler(req, res) {
  const { url, ...query } = req.query;
  const endpointPath = cleanEndpoint(url);
  if (!endpointPath) {
    res.status(400).json({ error: "Missing TMDB endpoint url param" });
    return;
  }

  const ip = clientIp(req);
  if (exceededRateLimit(ip)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many requests. Please retry shortly." });
    return;
  }

  const apiKey = process.env.VITE_TMDB_API_KEY;
  const accessToken = process.env.VITE_TMDB_READ_ACCESS_TOKEN;
  if (!apiKey || !accessToken) {
    res.status(500).json({ error: "TMDB credentials not set in environment" });
    return;
  }

  // Build TMDB API URL
  const endpoint = `https://api.themoviedb.org/3/${endpointPath}`;
  const params = new URLSearchParams({ ...query, api_key: apiKey });

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const tmdbRes = await fetch(`${endpoint}?${params.toString()}`, {
      headers,
    });
    const data = await tmdbRes.json();

    const cacheSeconds = endpointPath.startsWith("search/") ? 20 : 180;
    res.setHeader(
      "Cache-Control",
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=60`,
    );

    res.status(tmdbRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "TMDB fetch failed", details: err.message });
  }
}
