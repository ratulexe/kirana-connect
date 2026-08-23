import { Link } from "react-router-dom";
import { PackageSearch, ChevronRight } from "lucide-react";
import Container from "../../components/common/Container.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import Skeleton from "../../components/common/Skeleton.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { useCategories } from "../../hooks/useCategories.js";
import { useRevealOnScroll } from "../../animations/useRevealOnScroll.js";

function CategoryCard({ category }) {
  return (
    <Link
      to={`/search?category=${category.slug}`}
      className="group flex h-full min-w-[10.5rem] flex-col justify-between gap-6 rounded-card border border-line bg-surface p-4 transition-[border-color,box-shadow,transform] duration-200 ease-brand hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raised sm:min-w-0"
    >
      <div>
        <h3 className="text-card text-ink">{category.name}</h3>
        {category.description ? (
          <p className="mt-1 line-clamp-2 text-meta text-ink-muted">{category.description}</p>
        ) : null}
      </div>
      <span className="inline-flex items-center gap-1 text-meta font-semibold text-primary">
        Browse
        <ChevronRight
          className="size-3.5 transition-transform duration-200 ease-brand group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

function CategorySkeletons() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-32 rounded-card" />
      ))}
    </div>
  );
}

/**
 * Category shell, wired to the live discovery API.
 *
 * Kept in this milestone because it is the cheapest honest way to prove the
 * React -> Express -> Supabase path and to exercise the loading and empty
 * states of the design system with real data rather than fixtures.
 */
export default function CategoryStrip() {
  const sectionRef = useRevealOnScroll();
  const { data: categories, isPending, isError } = useCategories();

  return (
    <section ref={sectionRef} aria-labelledby="categories-heading">
      <Container className="pt-14 sm:pt-20">
        <SectionHeader
          id="categories-heading"
          title="Shop by category"
          description="Everyday essentials, grouped the way a kirana shelf is."
        />

        <div className="mt-6" aria-busy={isPending}>
          {isPending ? <CategorySkeletons /> : null}

          {isError ? (
            <EmptyState
              tone="error"
              icon={PackageSearch}
              title="Categories could not be loaded"
              description="The discovery API did not respond. Start the backend with npm run dev --prefix server and refresh."
            />
          ) : null}

          {!isPending && !isError && categories?.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No categories yet"
              description="Once the catalogue is seeded, categories appear here."
            />
          ) : null}

          {!isPending && !isError && categories?.length > 0 ? (
            /* Horizontal scroll on phones, grid from tablet up. */
            <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
              {categories.map((category) => (
                <li key={category.id} className="snap-start sm:snap-align-none">
                  <CategoryCard category={category} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
