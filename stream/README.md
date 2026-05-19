# Streamline

Streamline is a web-based platform to browse and discover movies and TV shows, watch official trailers, and open legal streaming provider options.

## Application

- Name: Streamline
- URL: https://www.watch.innewgen.com
- Scope: discovery and legal watch redirection only

## Features

- TMDB-powered trending, popular movies, and popular TV browsing
- Search across movies and shows
- Title details page with official trailer embed (YouTube)
- Watch provider availability by region (from TMDB watch provider data)
- Legal disclaimer and TMDB attribution in UI

## Local Setup

```bash
pnpm install
pnpm dev
```

Environment values are configured in `.env.local`.

## Build

```bash
pnpm build
pnpm preview
```

## Legal and Attribution

- This app does not host full movies or TV episodes.
- Streaming links are based on official provider metadata available through TMDB.
- This product uses the TMDB API but is not endorsed or certified by TMDB.
