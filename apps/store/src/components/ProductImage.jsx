import { useState } from "react";
import { cn } from "../lib/cn.js";

const SIZES = {
  sm: "size-11 text-[0.8125rem]",
  md: "size-14 text-[0.9375rem]",
  lg: "size-20 text-[1.125rem]",
};

/** First letters of the first two words, e.g. "Amul Taaza" -> "AT". */
function initials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Product thumbnail with a text fallback.
 *
 * Not every catalogue item has a photo, and a remote image can fail to load
 * long after the URL was stored. Both cases land on the same initials tile, so
 * a missing picture is a designed state rather than a broken one.
 */
export default function ProductImage({ src, name, size = "sm", className }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-surface-sunken",
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
          className="size-full object-contain"
        />
      )}
    </div>
  );
}
