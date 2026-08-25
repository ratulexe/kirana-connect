import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductImage from "../common/ProductImage.jsx";
import { formatPrice } from "../../utils/format.js";
import WishlistButton from "../common/WishlistButton.jsx";

/**
 * One catalogue product in a results grid.
 *
 * Shows MRP only, never a price. A price belongs to a shop, and which shop is
 * cheapest is the question the product page answers.
 */
export default function ProductCard({ product }) {
  const variantCount = product.variant_count ?? product.variants?.length ?? 0;
  const sizeLabel = variantCount > 1
    ? `${variantCount} sizes`
    : product.unit_label;
  const mrpLabel = variantCount > 1 ? "From" : "MRP";

  return (
    <li className="relative h-full">
      <article className="group relative flex h-full flex-col overflow-hidden rounded-card border border-[#e4dccd] bg-[#fffdf8] p-3 shadow-[0_8px_24px_rgba(51,65,48,.07)] transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_30px_rgba(21,122,85,.14)]">
        <WishlistButton productId={product.id} className="absolute top-5 right-5 z-20 shadow-sm" />
        <Link
          to={`/product/${product.slug}`}
          className="flex h-full flex-col rounded-control focus-visible:outline-offset-4"
          aria-label={`View ${product.name}`}
        >
          <div className="relative overflow-hidden rounded-control border border-[#eee5d7] bg-gradient-to-br from-[#fff7df] via-[#f8f4e9] to-[#e5f3ea] p-1">
            <ProductImage src={product.image_url} name={product.name} size="lg" />
            {product.available_nearby ? (
              <span className="absolute top-2 left-2 inline-flex max-w-[calc(100%-2.75rem)] items-center gap-1 truncate rounded-pill bg-[#fffdf8]/95 px-2 py-1 text-[.65rem] font-bold tracking-wide text-primary shadow-sm">
                <Sparkles className="size-2.5 shrink-0" /> <span className="truncate">AVAILABLE NEARBY</span>
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-1 flex-col">
            {product.brand ? (
              <p className="text-meta font-semibold text-ink-muted">{product.brand.name}</p>
            ) : null}

            <h3 className="mt-0.5 line-clamp-2 text-[0.9375rem] font-semibold text-ink">
              {product.name}
            </h3>

            <p className="mt-1 text-meta text-ink-muted">{sizeLabel}</p>

            <p className="mt-auto pt-3 text-meta text-ink-soft">
              {mrpLabel} <span className="font-semibold tabular-nums">{formatPrice(product.price_from ?? product.mrp)}</span>
              <span className="ml-1.5 inline-flex items-center font-semibold text-primary group-hover:underline">View <ArrowUpRight className="ml-0.5 size-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
            </p>
          </div>
        </Link>
      </article>
    </li>
  );
}
