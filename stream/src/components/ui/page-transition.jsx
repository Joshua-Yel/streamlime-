export default function PageTransition({ children }) {
  // Keep a simple wrapper so route keys still remount cleanly without stacked motion.
  return <div className="page-root">{children}</div>;
}
