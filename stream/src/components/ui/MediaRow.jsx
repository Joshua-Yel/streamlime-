import MovieCard from './MovieCard';

export default function MediaRow({ title, items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-stone-100">{title}</h2>
      <div className="scroll-row flex gap-3 overflow-x-auto pb-2">
        {items.map((item) => (
          <MovieCard item={item} key={`${item.media_type || 'title'}-${item.id}`} />
        ))}
      </div>
    </section>
  );
}
