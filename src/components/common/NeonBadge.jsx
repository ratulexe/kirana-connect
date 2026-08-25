export default function NeonBadge({ variant = 'live', className = '', children }) {
  const styles = {
    live: 'bg-green-500 text-white',
    deal: 'bg-red-500 text-white deal-flash',
    hot: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    new: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
    trending: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
  };
  const labels = { live: 'LIVE', deal: 'DEAL', hot: 'HOT', new: 'NEW', trending: '↑ TRENDING' };
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${styles[variant] || styles.live} ${className}`}>
      {variant === 'live' && <span className="size-1.5 rounded-full bg-white live-dot" />}
      {children ?? labels[variant]}
    </span>
  );
}
