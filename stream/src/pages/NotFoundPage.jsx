import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-stone-400">
        That route doesn’t exist. Head back to Discover or search for a title.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          to="/"
          className="rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-stone-950 hover:bg-amber-300"
        >
          Discover
        </Link>
        <Link
          to="/search"
          className="rounded-md border border-stone-700 px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-stone-900"
        >
          Search
        </Link>
      </div>
    </main>
  );
}
