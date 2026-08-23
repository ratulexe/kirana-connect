import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import Button from "../../components/common/Button.jsx";
import { useProductSearch } from "../../hooks/useDiscovery.js";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

export default function LiveProductShelf() {
  const sectionRef = useRevealOnScroll();
  const { data, isPending, isError, error } = useProductSearch({
    search: "",
    category: "",
    limit: 8,
    offset: 0,
  });

  const products = data?.products ?? [];

  return (
    <section ref={sectionRef} aria-labelledby="live-products-heading">
      <Container className="pt-14 sm:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            id="live-products-heading"
            title="Available from local stores"
            description="Products shown here come from visible store inventory, not sample data."
          />
          <Button as={Link} to="/search" variant="secondary" size="sm">
            Browse all
          </Button>
        </div>

        <div className="mt-6" aria-busy={isPending}>
          {isPending ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <li key={index}>
                  <Skeleton className="h-64 rounded-card" />
                </li>
              ))}
            </ul>
          ) : null}

          {isError ? (
            <EmptyState
              tone="error"
              icon={PackageSearch}
              title="Live products could not be loaded"
              description={error?.message ?? "Please try again in a moment."}
            />
          ) : null}

          {!isPending && !isError && products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No live products yet"
              description="Once an approved store lists visible inventory, products appear here automatically."
            />
          ) : null}

          {products.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
