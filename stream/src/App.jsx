import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Bookmark, Film, Filter, Search, Smartphone } from 'lucide-react';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import TitleDetailsPage from './pages/TitleDetailsPage';
import EmbeddedWatchPage from './pages/EmbeddedWatchPage';
import BrowsePage from './pages/BrowsePage';
import MyListPage from './pages/MyListPage';
import NotFoundPage from './pages/NotFoundPage';
import { APP_NAME, APP_URL, HAS_TMDB_AUTH } from './constants';
import PageTransition from './components/ui/page-transition';
import { Card, CardContent } from './components/ui/card';
import { cn } from './lib/utils';

function App() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isWatchRoute =
    /^\/movie\/\d+/.test(location.pathname) ||
    /^\/tv\/\d+\/\d+\/\d+/.test(location.pathname);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname]);

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
    <div className={cn('app-shell min-h-screen text-stone-100', isWatchRoute && 'is-watch')}>
      <header
        className={cn(
          'sticky top-0 z-30 border-b border-stone-800/90 bg-stone-950/92 backdrop-blur-md',
          isWatchRoute && 'border-stone-900 bg-stone-950/95',
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight text-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 sm:text-lg"
          >
            <Film className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{APP_NAME}</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm sm:gap-1.5" aria-label="Primary">
            <AppNavLink to="/" label="Discover" end />
            <AppNavLink to="/browse" label="Browse" icon={<Filter className="h-3.5 w-3.5" />} />
            <AppNavLink to="/search" label="Search" icon={<Search className="h-3.5 w-3.5" />} />
            <AppNavLink to="/my-list" label="My List" icon={<Bookmark className="h-3.5 w-3.5" />} />
          </nav>
        </div>
      </header>

      {!HAS_TMDB_AUTH && (
        <div
          className="border-b border-rose-700/50 bg-rose-950/70 px-4 py-2 text-center text-sm text-rose-100"
          role="alert"
        >
          Configure TMDB in <code className="rounded bg-black/30 px-1">.env</code> using{' '}
          <code className="rounded bg-black/30 px-1">VITE_TMDB_READ_ACCESS_TOKEN</code> to enable
          discovery data.
        </div>
      )}

      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/browse" element={<PageTransition><BrowsePage /></PageTransition>} />
        <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
        <Route path="/my-list" element={<PageTransition><MyListPage /></PageTransition>} />
        <Route path="/title/:mediaType/:id" element={<PageTransition><TitleDetailsPage /></PageTransition>} />
        <Route path="/movie/:tmdbId" element={<PageTransition><EmbeddedWatchPage /></PageTransition>} />
        <Route path="/tv/:tmdbId/:season/:episode" element={<PageTransition><EmbeddedWatchPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
      </Routes>

      {!isWatchRoute && (
        <footer className="mx-auto mt-12 w-full max-w-6xl px-4 pb-8 pt-2 sm:px-6">
          <Card>
            <CardContent className="grid gap-6 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-100">
                  Discover titles, open trailers, and jump into playback.
                </p>
                <p className="text-xs leading-relaxed text-stone-400">
                  Metadata and artwork from TMDB. Availability depends on region and provider.
                  This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
              </div>

              <div className="flex flex-col items-start gap-2">
                <button
                  type="button"
                  onClick={handleMobileInstall}
                  disabled={isInstalled}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2.5 text-sm font-medium text-stone-950 transition hover:bg-amber-300 disabled:cursor-default disabled:opacity-70"
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  {isInstalled
                    ? 'Installed'
                    : deferredPrompt
                      ? 'Install app'
                      : 'Open on phone to install'}
                </button>
                <p className="max-w-[16rem] text-[11px] text-stone-500">
                  {deferredPrompt
                    ? 'Install Streamline as a PWA on this device.'
                    : 'On mobile, use Add to Home Screen if install is unavailable here.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </footer>
      )}
    </div>
  );
}

function AppNavLink({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition sm:px-3 sm:text-sm',
          isActive
            ? 'bg-amber-400 text-stone-950'
            : 'text-stone-300 hover:bg-stone-900 hover:text-stone-100',
        )
      }
    >
      {icon}
      <span className={icon ? 'hidden xs:inline sm:inline' : undefined}>{label}</span>
      {icon && <span className="sm:hidden sr-only">{label}</span>}
    </NavLink>
  );
}

export default App;
