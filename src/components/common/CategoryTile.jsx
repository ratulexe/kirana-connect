import { useState } from "react";
import { getCategoryIcon } from "../../utils/categoryIcons.js";

export const CATEGORY_TILE_GRADIENTS = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-cyan-500",
  "from-orange-400 to-amber-500",
  "from-emerald-400 to-teal-500",
  "from-red-400 to-orange-500",
];

/**
 * The image tile has three fallback tiers, in order: a real representative
 * product photo for the category (`sample_image_url`, computed server-side
 * -- never a hotlinked stock image), then the existing icon+gradient
 * treatment if there is no image or it fails to load, and the gradient
 * alone briefly while the image is still loading. The icon+gradient layer
 * is always mounted underneath so there is never a blank tile.
 */
export default function CategoryTile({ category, index = 0 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const Icon = getCategoryIcon(category.slug);
  const gradient = CATEGORY_TILE_GRADIENTS[index % CATEGORY_TILE_GRADIENTS.length];
  const showImage = Boolean(category.sample_image_url) && !errored;

  return (
    <span
      className={`relative mb-4 block aspect-square w-full overflow-hidden rounded-[20px] bg-gradient-to-br ${gradient} transition-transform duration-200 ease-brand group-hover:scale-[1.02]`}
    >
      <span className="absolute inset-0 flex items-center justify-center text-white">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      {showImage ? (
        <img
          src={category.sample_image_url}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ease-brand ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
    </span>
  );
}
