const SERIES_PROGRESS_KEY = "streamline.seriesProgress";

function loadAllProgress() {
  try {
    const raw = localStorage.getItem(SERIES_PROGRESS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveAllProgress(progress) {
  localStorage.setItem(SERIES_PROGRESS_KEY, JSON.stringify(progress));
}

export function getSeriesProgress(seriesId) {
  const all = loadAllProgress();
  return all[String(seriesId)] || null;
}

export function saveSeriesEpisode(seriesId, season, episode) {
  const all = loadAllProgress();
  const key = String(seriesId);
  const current = all[key] || {};
  all[key] = {
    ...current,
    lastSeason: Number(season),
    lastEpisode: Number(episode),
    updatedAt: Date.now(),
  };
  saveAllProgress(all);
  return all[key];
}

export function getEpisodePosition(seriesId, season, episode) {
  const progress = getSeriesProgress(seriesId);
  if (!progress?.positions) {
    return 0;
  }
  const key = `${Number(season)}-${Number(episode)}`;
  return Number(progress.positions[key] || 0);
}

export function saveEpisodePosition(seriesId, season, episode, seconds) {
  const all = loadAllProgress();
  const key = String(seriesId);
  const current = all[key] || {};
  const positions = current.positions || {};
  const positionKey = `${Number(season)}-${Number(episode)}`;

  all[key] = {
    ...current,
    lastSeason: Number(season),
    lastEpisode: Number(episode),
    updatedAt: Date.now(),
    positions: {
      ...positions,
      [positionKey]: Math.max(0, Math.floor(Number(seconds) || 0)),
    },
  };

  saveAllProgress(all);
  return all[key];
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
