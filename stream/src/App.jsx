import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Film, Search, Tv, Filter, Smartphone } from 'lucide-react';
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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleMobileInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }

    window.open(APP_URL, '_blank', 'noopener,noreferrer');
  }

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
       <CardContent className="p-5">
  <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
    {/* Left Content */}
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          Built for effortless streaming discovery
        </h3>

        <p className="leading-relaxed text-stone-300">
          Streamline helps you quickly discover movies and shows, watch trailers,
          and jump into playback with a smooth, distraction-free experience.
        </p>

        <p className="text-sm leading-relaxed text-stone-400">
          Powered by TMDB metadata and artwork. Content availability may vary
          depending on your region and provider.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="text-stone-400">Application URL</span>
        <span className="text-stone-600">•</span>

        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-amber-300 hover:underline underline-offset-4"
        >
          {APP_URL}
        </a>
      </div>
    </div>

    {/* Right Actions */}
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleMobileInstall}
        disabled={isInstalled}
        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-medium text-stone-900 transition-all duration-200 hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] active:scale-95"
      >
        <Smartphone className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
        {isInstalled ? 'Installed on Mobile' : deferredPrompt ? 'Install PWA on Mobile' : 'Open on Mobile to Install'}
      </button>

      <p className="text-xs text-stone-500">
        {deferredPrompt
          ? 'Tap to install the Streamline PWA directly.'
          : 'If install is not available here, open this site on your phone and tap Add to Home Screen.'}
      </p>
    </div>
  </div>
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
