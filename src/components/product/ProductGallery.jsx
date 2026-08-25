import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/cn.js";

const TYPE_LABELS = {
  front: "Front",
  back: "Back",
  nutrition: "Nutrition Facts",
  promotional: "Promotional",
};

function typeLabel(type) {
  return TYPE_LABELS[type] ?? type;
}

function fallbackAlt(name, type) {
  return `${name} ${typeLabel(type).toLowerCase()}`;
}

export default function ProductGallery({ media, legacyImageUrl, productName }) {
  // Build the gallery items: structured media first, legacy fallback if no media
  const items = media && media.length > 0
    ? media.map((m) => ({
        id: m.id,
        src: m.image_url,
        alt: m.alt_text || fallbackAlt(productName, m.media_type),
        type: m.media_type,
        label: m.alt_text || typeLabel(m.media_type),
      }))
    : legacyImageUrl
      ? [{ id: "legacy", src: legacyImageUrl, alt: productName, type: "front", label: "Front" }]
      : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(new Set());

  // Reset when items change
  useEffect(() => {
    setActiveIndex(0);
    setImgFailed(new Set());
  }, [items.length]);

  const handleKeyDown = useCallback(
    (event) => {
      if (items.length <= 1) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      }
    },
    [items.length],
  );

  if (items.length === 0) {
    // No images at all — show initials fallback
    const letters = String(productName ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

    return (
      <div className="flex h-48 w-full items-center justify-center rounded-card border border-line-soft bg-surface sm:h-64 sm:w-64 sm:shrink-0">
        <span aria-hidden="true" className="text-3xl font-bold tracking-tight text-ink-muted">
          {letters}
        </span>
      </div>
    );
  }

  const active = items[activeIndex];

  return (
    <div
      className="flex flex-col gap-3 sm:w-64 sm:shrink-0"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Product images"
    >
      {/* Active image */}
      <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-card border border-line-soft bg-surface sm:h-64">
        {imgFailed.has(active.id) ? (
          <span className="text-sm text-ink-muted">Image unavailable</span>
        ) : (
          <img
            key={active.id}
            src={active.src}
            alt={active.alt}
            loading="eager"
            decoding="async"
            onError={() => setImgFailed((prev) => new Set(prev).add(active.id))}
            className="size-full object-contain p-2"
          />
        )}
        {active.type !== "front" && (
          <span className="absolute bottom-2 left-2 rounded-md bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white">
            {active.label}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product image thumbnails">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={item.label}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-surface transition-colors",
                index === activeIndex ? "border-primary" : "border-line-soft hover:border-ink-faint",
              )}
            >
              {imgFailed.has(item.id) ? (
                <span className="text-[0.6rem] text-ink-muted">{item.label}</span>
              ) : (
                <img
                  src={item.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgFailed((prev) => new Set(prev).add(item.id))}
                  className="size-full object-contain p-0.5"
                />
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-ink/60 px-1 py-px text-center text-[0.55rem] font-semibold leading-tight text-white">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
