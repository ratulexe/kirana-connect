import { cn } from "../../lib/cn.js";

/**
 * Loading placeholder. aria-hidden because the surrounding region announces
 * its own busy state; a screen reader gains nothing from the shimmer.
 */
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-surface-sunken", className)}
    />
  );
}
