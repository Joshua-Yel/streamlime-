import MovieCard from './MovieCard';
import { motion } from 'framer-motion';

export default function MediaRow({ title, items }) {
  return (
    <motion.section
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <h2 className="text-xl font-semibold tracking-tight text-stone-100">{title}</h2>
      {items?.length ? (
        <motion.div
          className="scroll-row flex gap-3 overflow-x-auto pb-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.03,
              },
            },
          }}
        >
          {items.map((item) => (
            <motion.div
              key={`${item.media_type || 'title'}-${item.id}`}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.25 }}
            >
              <MovieCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-lg border border-stone-700/60 bg-stone-900/70 p-4 text-center text-stone-300">
          Coming soon
        </div>
      )}
    </motion.section>
  );
}
