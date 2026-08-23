import { cn } from "../lib/cn.js";

export default function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-card bg-surface-sunken", className)} />;
}
