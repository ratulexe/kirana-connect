export default function PageLoader({ label = "Loading" }) {
  return (
    <div role="status" className="flex min-h-[55vh] items-center justify-center px-4 text-meta text-ink-muted">
      {label}
    </div>
  );
}
