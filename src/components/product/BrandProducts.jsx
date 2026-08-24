import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import ProductImage from "../common/ProductImage.jsx";
import Skeleton from "../common/Skeleton.jsx";
import { useBrandProducts } from "../../hooks/useDiscovery.js";
import { formatPrice } from "../../utils/format.js";

export default function BrandProducts({ brand, currentProductSlug }) {
  const { data: products, isPending, isError } = useBrandProducts({
    brandSlug: brand?.slug,
    excludeSlug: currentProductSlug,
    limit: 8,
  });

  // Don't render if no brand, loading, error, or no results
  if (!brand) return null;
  if (isPending) {
    return (
      <section className="mt-10">
        <Skeleton className="h-6 w-48" />
        <div className="mt-4 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 w-40 shrink-0 rounded-card" />
          ))}
        </div>
      </section>
    );
  }
  if (isError || !products || products.length === 0) return null;

  return (
    <section aria-labelledby="brand-section" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 id="brand-section" className="text-section text-ink">
          More from {brand.name}
        </h2>
        <Link
          to={`/search?brand=${encodeURIComponent(brand.slug)}`}
          className="inline-flex items-center gap-0.5 text-meta font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          View all {brand.name} Products
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <Link
            key={product.slug}
            to={`/product/${product.slug}`}
            className="group flex w-40 shrink-0 flex-col rounded-card border border-line bg-surface p-3 transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raised"
          >
            <ProductImage src={product.image_url} name={product.name} size="lg" />
            {product.brand ? (
              <p className="mt-2 text-meta font-semibold text-ink-muted">{product.brand.name}</p>
            ) : null}
            <h3 className="mt-0.5 line-clamp-2 text-[0.8125rem] font-semibold text-ink">
              {product.name}
            </h3>
            <p className="mt-1 text-meta text-ink-muted">{product.unit_label}</p>
            <p className="mt-auto pt-2 text-meta text-ink-soft">
              MRP <span className="font-semibold tabular-nums">{formatPrice(product.mrp)}</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
