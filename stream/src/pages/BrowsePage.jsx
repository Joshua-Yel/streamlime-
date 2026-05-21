import { useEffect, useState } from 'react';
import { getMovieGenres, getTvGenres, getMoviesByGenre, getTvByGenre } from '../services/tmdb';
import MovieCard from '../components/ui/MovieCard';
import { Filter } from 'lucide-react';

export default function BrowsePage() {
  const [mediaType, setMediaType] = useState('movie');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load genres when media type changes
  useEffect(() => {
    async function loadGenres() {
      try {
        const genreList = mediaType === 'movie' 
          ? await getMovieGenres() 
          : await getTvGenres();
        setGenres(genreList);
        setSelectedGenre(null);
        setResults([]);
      } catch (err) {
        setError('Could not load genres');
      }
    }
    loadGenres();
  }, [mediaType]);

  // Load content when genre is selected
  useEffect(() => {
    if (!selectedGenre) {
      setResults([]);
      return;
    }

    async function loadByGenre() {
      try {
        setLoading(true);
        setError('');
        const items = mediaType === 'movie'
          ? await getMoviesByGenre(selectedGenre)
          : await getTvByGenre(selectedGenre);
        setResults(items);
      } catch (err) {
        setError('Could not load content for this genre');
      } finally {
        setLoading(false);
      }
    }

    loadByGenre();
  }, [selectedGenre, mediaType]);

  const selectedGenreName = genres.find(g => g.id === selectedGenre)?.name;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Filter className="h-6 w-6 text-amber-300" />
          <h1 className="text-3xl font-semibold text-white">Browse by Genre</h1>
        </div>

        {/* Media Type Tabs */}
        <div className="flex gap-3 mb-6">
          {['movie', 'tv'].map((type) => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              className={`rounded-lg px-4 py-2 font-semibold transition ${
                mediaType === type
                  ? 'bg-amber-300 text-stone-900'
                  : 'border border-stone-600 text-stone-200 hover:bg-stone-800'
              }`}
            >
              {type === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Genre List Sidebar */}
        <aside className="lg:col-span-1">
          <div className="rounded-lg border border-stone-700/70 bg-stone-900/50 p-4">
            <h2 className="mb-4 font-semibold text-stone-100">Genres</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition ${
                    selectedGenre === genre.id
                      ? 'bg-amber-300 text-stone-900 font-semibold'
                      : 'text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <section className="lg:col-span-3">
          {!selectedGenre ? (
            <div className="rounded-lg border border-stone-700/70 bg-stone-900/50 p-8 text-center">
              <p className="text-stone-300">Select a genre to browse {mediaType === 'movie' ? 'movies' : 'TV shows'}</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold text-stone-100">
                  {selectedGenreName} {mediaType === 'movie' ? 'Movies' : 'TV Shows'}
                </h2>
              </div>
              {loading && <p className="text-stone-300">Loading {selectedGenreName}...</p>}
              {error && (
                <p className="rounded-lg border border-rose-700/60 bg-rose-950/50 p-3 text-sm text-rose-200">
                  {error}
                </p>
              )}
              {!loading && !error && results.length > 0 && (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {results.map((item) => (
                    <MovieCard item={item} key={`${item.media_type || 'title'}-${item.id}`} />
                  ))}
                </div>
              )}
              {!loading && !error && results.length === 0 && (
                <div className="rounded-lg border border-stone-700/70 bg-stone-900/50 p-8 text-center">
                  <p className="text-stone-300">No {mediaType === 'movie' ? 'movies' : 'TV shows'} found in this genre</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
