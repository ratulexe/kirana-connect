import { cn } from "../lib/cn.js";

/** Loading placeholder. aria-hidden: the region announces its own busy state. */
export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-surface-sunken", className)}
    />
  );
}
