import { Link } from "react-router-dom";
import ProductImage from "../common/ProductImage.jsx";
import { formatPrice } from "../../utils/format.js";

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
    <li>
      <Link
        to={`/product/${product.slug}`}
        className="group flex h-full flex-col rounded-card border border-line bg-surface p-3 transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raised"
      >
        <ProductImage src={product.image_url} name={product.name} size="lg" />

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
            <span className="ml-1.5 text-primary group-hover:underline">Compare shops</span>
          </p>
        </div>
      </Link>
    </li>
  );
}
