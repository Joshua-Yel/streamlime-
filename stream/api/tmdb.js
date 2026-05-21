// Vercel serverless function: /api/tmdb
// Proxies TMDB API requests and injects your secret key from environment variables

export default async function handler(req, res) {
  const { url, ...query } = req.query;
  if (!url) {
    res.status(400).json({ error: "Missing TMDB endpoint url param" });
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const accessToken = process.env.TMDB_READ_ACCESS_TOKEN;
  if (!apiKey || !accessToken) {
    res.status(500).json({ error: "TMDB credentials not set in environment" });
    return;
  }

  // Build TMDB API URL
  const endpoint = `https://api.themoviedb.org/3/${url}`;
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
    res.status(tmdbRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "TMDB fetch failed", details: err.message });
  }
}
