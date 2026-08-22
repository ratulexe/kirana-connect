import { Link } from "react-router-dom";
import { cn } from "../lib/cn.js";

/**
 * Portal wordmark: the consumer mark plus a "For Stores" qualifier, so the
 * portal reads as the same product wearing a work apron.
 */
export default function Logo({ to = "/", className }) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2 rounded-control py-1.5", className)}
      aria-label="Kirana Connect for Stores, go to start"
    >
      <span className="inline-flex items-baseline gap-1">
        <span className="relative text-[1.0625rem] font-bold tracking-tight text-ink">
          Kirana
          <span
            aria-hidden="true"
            className="absolute -top-0.5 right-[1.5px] size-[5px] rounded-pill bg-accent"
          />
        </span>
        <span className="text-[1.0625rem] font-medium tracking-tight text-primary">
          Connect
        </span>
      </span>
      <span className="rounded-pill border border-line bg-surface px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-ink-soft uppercase">
        For Stores
      </span>
    </Link>
  );
}
