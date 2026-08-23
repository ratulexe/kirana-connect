import { useState } from "react";
import { cn } from "../../lib/cn.js";

const SIZES = {
  sm: "size-12 text-[0.8125rem]",
  md: "size-16 text-[0.9375rem]",
  lg: "h-32 w-full text-[1.25rem]",
  xl: "h-48 w-full text-[1.5rem]",
};

function initials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Product photo with a text fallback.
 *
 * Only some catalogue items have a picture, and a remote URL can start failing
 * long after it was stored. Both land on the same initials tile, so a missing
 * photo is a designed state rather than a broken image icon.
 */
export default function ProductImage({ src, name, size = "md", className }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-card border border-line-soft bg-surface-sunken",
        SIZES[size],
        className,
      )}
    >
      {showFallback ? (
        <span aria-hidden="true" className="font-bold tracking-tight text-ink-muted">
          {initials(name)}
        </span>
      ) : (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-contain p-1.5"
        />
      )}
    </div>
  );
}
