import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Film, Search, Tv, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import TitleDetailsPage from './pages/TitleDetailsPage';
import EmbeddedWatchPage from './pages/EmbeddedWatchPage';
import BrowsePage from './pages/BrowsePage';
import { APP_NAME, APP_URL, HAS_TMDB_AUTH } from './constants';
import PageTransition from './components/ui/page-transition';
import { Card, CardContent } from './components/ui/card';

function App() {
  const location = useLocation();

  return (
    <div className="app-shell min-h-screen text-stone-100">
      <header className="sticky top-0 z-20 border-b border-stone-700/60 bg-stone-950/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-amber-300">
            <Film className="h-5 w-5" />
            <span>{APP_NAME}</span>
            <span className="text-xs font-medium normal-case tracking-normal text-stone-300/80">by innewgen</span>
          </Link>
          </motion.div>
          <nav className="flex items-center gap-2 text-sm">
            <AppNavLink to="/" label="Discover" icon={<Tv className="h-4 w-4" />} />
            <AppNavLink to="/browse" label="Browse" icon={<Filter className="h-4 w-4" />} />
            <AppNavLink to="/search" label="Search" icon={<Search className="h-4 w-4" />} />
          </nav>
        </div>
      </header>

      {!HAS_TMDB_AUTH && (
        <div className="border-b border-rose-600/40 bg-rose-900/50 px-4 py-2 text-center text-sm text-rose-100">
          Configure TMDB in .env.local using VITE_TMDB_READ_ACCESS_TOKEN to enable discovery data.
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/browse" element={<PageTransition><BrowsePage /></PageTransition>} />
          <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
          <Route path="/title/:mediaType/:id" element={<PageTransition><TitleDetailsPage /></PageTransition>} />
          <Route path="/movie/:tmdbId" element={<PageTransition><EmbeddedWatchPage /></PageTransition>} />
          <Route path="/tv/:tmdbId/:season/:episode" element={<PageTransition><EmbeddedWatchPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>

      <footer className="mx-auto mt-14 w-full max-w-6xl px-4 pb-8 pt-6 text-xs text-stone-300 sm:px-6">
        <Card>
        <CardContent className="p-4">
          <p>
            Streamline helps you discover titles fast, browse trailers, and open playback options with a clean viewing flow.
          </p>
          <p className="mt-2">
            Powered by TMDB data and artwork. Availability can vary by region and provider.
          </p>
          <p className="mt-2">
            Application URL: <a className="underline decoration-amber-400 underline-offset-2" href={APP_URL}>{APP_URL}</a>
          </p>
        </CardContent>
        </Card>
      </footer>
    </div>
  );
}

function AppNavLink({ to, label, icon }) {
  return (
    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.18 }}>
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
    </motion.div>
  );
}

export default App;
