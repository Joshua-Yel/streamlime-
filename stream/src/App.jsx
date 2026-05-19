import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Film, Search, Tv } from 'lucide-react';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import TitleDetailsPage from './pages/TitleDetailsPage';
import EmbeddedWatchPage from './pages/EmbeddedWatchPage';
import { APP_NAME, APP_URL, HAS_TMDB_AUTH } from './constants';

function App() {
  return (
    <div className="app-shell min-h-screen text-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-700/60 bg-stone-950/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-amber-300">
            <Film className="h-5 w-5" />
            <span>{APP_NAME}</span>
            <span className="text-xs font-medium normal-case tracking-normal text-stone-300/80">by innewgen</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <AppNavLink to="/" label="Discover" icon={<Tv className="h-4 w-4" />} />
            <AppNavLink to="/search" label="Search" icon={<Search className="h-4 w-4" />} />
          </nav>
        </div>
      </header>

      {!HAS_TMDB_AUTH && (
        <div className="border-b border-rose-600/40 bg-rose-900/50 px-4 py-2 text-center text-sm text-rose-100">
          Configure TMDB in .env.local using VITE_TMDB_READ_ACCESS_TOKEN to enable discovery data.
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/title/:mediaType/:id" element={<TitleDetailsPage />} />
        <Route path="/movie/:tmdbId" element={<EmbeddedWatchPage />} />
        <Route path="/tv/:tmdbId/:season/:episode" element={<EmbeddedWatchPage />} />
      </Routes>

      <footer className="mx-auto mt-14 w-full max-w-6xl px-4 pb-8 pt-6 text-xs text-stone-300 sm:px-6">
        <div className="rounded-xl border border-stone-700/60 bg-stone-900/70 p-4">
          <p>
            Streamline helps you discover titles fast, browse trailers, and open playback options with a clean viewing flow.
          </p>
          <p className="mt-2">
            Powered by TMDB data and artwork. Availability can vary by region and provider.
          </p>
          <p className="mt-2">
            Application URL: <a className="underline decoration-amber-400 underline-offset-2" href={APP_URL}>{APP_URL}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function AppNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-md px-3 py-2 transition ${
          isActive ? 'bg-amber-400 text-stone-900' : 'text-stone-200 hover:bg-stone-800'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export default App;
