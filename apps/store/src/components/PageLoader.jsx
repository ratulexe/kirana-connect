import { Loader2 } from "lucide-react";

/** Full-height loading state used while the session or status resolves. */
export default function PageLoader({ label = "Loading" }) {
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
      <p className="text-meta text-ink-muted">{label}</p>
    </div>
  );
}
