import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import ProductCard from "../../components/products/ProductCard.jsx";
import Button from "../../components/common/Button.jsx";
import NeonBadge from "../../components/common/NeonBadge.jsx";
import { useProductSearch } from "../../hooks/useDiscovery.js";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

export default function LiveProductShelf() {
  const sectionRef = useRevealOnScroll();
  const { data, isPending, isError, error } = useProductSearch({
    search: "",
    category: "",
    limit: 8,
    offset: 0,
    // Keep the home shelf in sync with catalogue and image changes made in
    // Admin, without making customers refresh the page.
    refetchInterval: 15_000,
  });

  const products = data?.products ?? [];

  return (
    <section ref={sectionRef} className="relative mt-14 overflow-hidden border-y border-[#e7dfd0] bg-gradient-to-b from-[#f7f0e2] via-[#fbf8f1] to-[#e9f3ec] py-14 sm:mt-20 sm:py-20" aria-labelledby="live-products-heading">
      <div aria-hidden="true" className="absolute -right-20 top-0 size-80 rounded-full bg-[#eab14b]/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -left-24 bottom-0 size-72 rounded-full bg-[#2c8c67]/15 blur-3xl" />
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <NeonBadge variant="live" className="mb-3" />
            <SectionHeader
              id="live-products-heading"
              title="Available around you"
              description="Real products from the live catalogue. Open any item to compare nearby shop prices."
            />
          </div>
          <Button as={Link} to="/search" variant="secondary" size="sm" className="border-primary/20 bg-[#fffdf8] hover:border-primary">
            Browse all products
          </Button>
        </div>

        <div className="mt-6" aria-busy={isPending}>
          {isPending ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-4">
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
              title="No products yet"
              description="Once Admin adds active catalogue products, they appear here automatically."
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
