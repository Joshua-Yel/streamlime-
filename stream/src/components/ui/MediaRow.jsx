import MovieCard from './MovieCard';

export default function MediaRow({ title, items }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-stone-100">{title}</h2>
      {items?.length ? (
        <div className="scroll-row flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <MovieCard item={item} key={`${item.media_type || 'title'}-${item.id}`} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-stone-700/60 bg-stone-900/70 p-4 text-center text-stone-300">
          Coming soon
        </div>
      )}
    </section>
  );
}
